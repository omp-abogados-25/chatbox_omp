import { Injectable, Inject, Logger } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { EchoMessageService } from './echo-message.service';
import { ChatTranscriptionService } from './chat-transcription.service';
import { SessionState, DocumentType, IMfaService, IRateLimitService, IMfaEmailService, Session } from '../../domain';
import { FindUserByIdentificationNumberUseCase } from '../../../modules/users/application/use-cases';
import { User as DomainUser } from '../../../modules/users/domain/entities/user.entity';

type SessionWithUserId = Session & { userId?: string; mfaSessionId?: string; };

@Injectable()
export class MfaConversationFlowService {
  private readonly logger = new Logger(MfaConversationFlowService.name);

  constructor(
    private readonly sessionManager: SessionManagerService,
    @Inject('IMfaService') private readonly mfaService: IMfaService,
    @Inject('IMfaEmailService') private readonly mfaEmailService: IMfaEmailService,
    @Inject('IRateLimitService') private readonly rateLimitService: IRateLimitService,
    private readonly messageService: EchoMessageService,
    private readonly transcriptionService: ChatTranscriptionService,
    private readonly findUserByIdentificationNumberUseCase: FindUserByIdentificationNumberUseCase,
  ) {}

  private async sendMessageAndLog(from: string, message: string, messageId: string, phoneNumberId: string): Promise<void> {
    try {
      await this.messageService.reply(from, message, messageId, phoneNumberId);
      this.transcriptionService.addMessage(from, 'system', message);
    } catch (error) {
      this.logger.error(`Error sending message to ${from}:`, error instanceof Error ? error.message : String(error));
      this.transcriptionService.addMessage(from, 'system', `[ERROR] Failed to send: ${message.substring(0, 50)}...`);
    }
  }
  
  private async sendWelcomeMessage(from: string, messageId: string, phoneNumberId: string): Promise<void> {
    const welcomeMessage = `¡Hola! 👋 Bienvenido al sistema de #OMPLovers
Soy tu asistente virtual y estoy aquí para ayudarte a obtener tu certificado de manera rápida y segura.

🔐 *¿Sabías que?* 
* Puedes escribir directamente: "Necesito un certificado laboral"
* O también: "Mi cédula es 12345678"
* ¡El sistema es inteligente y te entenderá!

📝 Para comenzar, ingresa tu número de documento:`;
    await this.sendMessageAndLog(from, welcomeMessage, messageId, phoneNumberId);
    const session = this.sessionManager.getSession(from) || this.sessionManager.createSession(from);
    session.documentType = DocumentType.CC; 
    this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
  }

  private maskEmail(email: string): string {
    if (!email) return 'Email no proporcionado';
    const [localPart, domain] = email.split('@');
    if (!domain) return 'Email inválido'; 
    if (localPart.length <= 2) {
      return `${localPart.length > 0 ? localPart[0] : ''}***@${domain}`;
    }
    const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
    return `${maskedLocal}@${domain}`;
  }

  public async initiateMfaProcess(
    from: string,
    documentType: DocumentType, 
    documentNumber: string,    
    messageId: string,
    phoneNumberId: string,
  ): Promise<void> {
    const session = this.sessionManager.getSession(from) as SessionWithUserId | null;
    if (!session) {
      this.logger.error(`No se encontró sesión activa en initiateMfaProcess para ${from}`);
      await this.sendMessageAndLog(from, 'Error interno: No se pudo iniciar la verificación. Por favor, intenta de nuevo.', messageId, phoneNumberId);
      return;
    }

    try {
      this.logger.log(`(MFA) Re-consultando usuario ${documentNumber} para obtener email actualizado.`);
      const userFromDb = await this.findUserByIdentificationNumberUseCase.execute(documentNumber);

      if (!userFromDb || !userFromDb.email) {
        this.logger.error(`(MFA) Usuario ${documentNumber} no encontrado o sin email en la BD. No se puede enviar código MFA.`);
        const errMessage = userFromDb 
          ? 'No tienes un correo electrónico registrado en nuestro sistema. Por favor, contacta a RRHH para actualizar tu información.'
          : 'Error: No pudimos verificar tu información actualizada para enviar el código. Por favor, intenta de nuevo.';
        await this.sendMessageAndLog(from, errMessage, messageId, phoneNumberId);
         this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER); 
        return;
      }
      
      const emailForMfa = userFromDb.email;
      const actualClientName = userFromDb.full_name;

      const mfaSessionData = await this.mfaService.createMfaSession(from, documentNumber, documentType.toString(), emailForMfa);
      
      if (!mfaSessionData || !mfaSessionData.id || !mfaSessionData.totpCode) {
        this.logger.error(`Error al crear la sesión MFA para ${documentNumber}. No se obtuvo ID o TOTP code.`);
        await this.sendMessageAndLog(from, 'Lo sentimos, no pudimos generar el código de verificación en este momento. Intenta más tarde.', messageId, phoneNumberId);
        return;
      }

      session.mfaSessionId = mfaSessionData.id;
      this.sessionManager.updateSessionActivity(from);

      // Primero enviamos el mensaje de confirmación de usuario encontrado
      const userFoundMessage = `🎉 ¡Perfecto! Te hemos identificado como *${actualClientName}*.

🔍 Documento: ${documentType} ${documentNumber}`;
      await this.sendMessageAndLog(from, userFoundMessage, messageId, phoneNumberId);

      const expiresInMilliseconds = new Date(mfaSessionData.expiresAt).getTime() - Date.now();
      const expiresInMinutes = Math.max(0, Math.floor(expiresInMilliseconds / (1000 * 60)));

      this.logger.log(`Intentando enviar TOTP ${mfaSessionData.totpCode} a ${emailForMfa} para ${actualClientName}. Válido por ${expiresInMinutes} minutos.`);
      const emailSent = await this.mfaEmailService.sendTotpCode(
        emailForMfa,
        mfaSessionData.totpCode,
        actualClientName,
        expiresInMinutes
      );

      let mfaPromptMessage: string;
      if (emailSent) {
        this.logger.log(`Código TOTP enviado exitosamente a ${emailForMfa}`);
        const maskedEmail = this.maskEmail(emailForMfa);
        mfaPromptMessage = `🎉 ¡Hola, ${actualClientName}! Ya estás dentro del sistema #OMPLover.

🔐 Para continuar, hemos enviado un código de verificación a tu correo electrónico:
📧 ${maskedEmail}  

Por favor revisa tu bandeja de entrada (y spam) e ingresa el código de 6 dígitos que recibiste.

⏰ El código expira en 10 minutos.
🔄 Tienes máximo 3 intentos para ingresarlo correctamente.`;
      } else {
        this.logger.warn(`No se pudo enviar el correo electrónico con el código TOTP a ${emailForMfa}. El código generado es: ${mfaSessionData.totpCode}.`);
        mfaPromptMessage = `Lo sentimos, tuvimos un problema al enviar el código a tu correo. Por favor, intenta verificar tu identidad nuevamente en unos minutos.`;
      }
      
      await this.sendMessageAndLog(from, mfaPromptMessage, messageId, phoneNumberId);
      this.sessionManager.updateSessionState(from, SessionState.WAITING_MFA_VERIFICATION);

    } catch (error) {
      this.logger.error(`Error en initiateMfaProcess para ${documentNumber}:`, error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined);
      await this.sendMessageAndLog(from, 'Lo sentimos, ocurrió un error inesperado durante el proceso de verificación. Intenta de nuevo más tarde.', messageId, phoneNumberId);
      this.sessionManager.updateSessionState(from, SessionState.AUTHENTICATED);
    }
  }

  public async handleMfaVerification(
    from: string, 
    body: string, 
    messageId: string, 
    phoneNumberId: string,
    onSuccessCallback: () => Promise<void> 
  ): Promise<void> {
    const session = this.sessionManager.getSession(from) as SessionWithUserId | null;
    
    if (!session || !session.mfaSessionId) {
      this.logger.warn(`Intento de verificación MFA sin sesión MFA activa para ${from}. Reiniciando flujo.`);
      await this.sendWelcomeMessage(from, messageId, phoneNumberId); 
      return;
    }

    const totpCode = body.trim();
    
    if (!/^\d{6}$/.test(totpCode)) {
      await this.sendMessageAndLog(
        from,
        '❌ El código debe tener exactamente 6 dígitos. Por favor ingresa el código que recibiste por email:',
        messageId,
        phoneNumberId
      );
      return;
    }

    try {
      const isValid = await this.mfaService.verifyMfaSession(session.mfaSessionId, totpCode);
      
      if (isValid) {
        await this.rateLimitService.unblockPhoneNumber(from); 
        this.sessionManager.updateSessionState(from, SessionState.AUTHENTICATED);
        
        await this.sendMessageAndLog(
          from,
          `✅ ¡Verificación exitosa! Tu identidad ha sido confirmada.`,
          messageId,
          phoneNumberId
        );
        
        await onSuccessCallback();

      } else {
        const mfaSession = await this.mfaService.getMfaSession(session.mfaSessionId);
        
        if (!mfaSession) {
          await this.sendMessageAndLog(
            from,
            '❌ La sesión de verificación ha expirado. Por favor inicia el proceso nuevamente.',
            messageId,
            phoneNumberId
          );
          this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
          await this.sendWelcomeMessage(from, messageId, phoneNumberId); 
        } else {
          const remainingAttempts = mfaSession.maxAttempts - mfaSession.attempts;
          
          if (remainingAttempts > 0) {
            await this.sendMessageAndLog(
              from,
              `❌ Código incorrecto. Te quedan ${remainingAttempts} intentos.\n\nPor favor ingresa el código de 6 dígitos que recibiste por email:`,
              messageId,
              phoneNumberId
            );
          } else {
            await this.sendMessageAndLog(
              from,
              '❌ Has agotado todos los intentos. Por seguridad, debes iniciar el proceso nuevamente.',
              messageId,
              phoneNumberId
            );
             this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
            await this.sendWelcomeMessage(from, messageId, phoneNumberId);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error verifying MFA:', error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined);
      await this.sendMessageAndLog(
        from,
        '❌ Error en la verificación. Por favor intenta nuevamente.',
        messageId,
        phoneNumberId
      );
    }
  }
} 