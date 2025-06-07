import { Injectable, Inject, Logger } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { EchoMessageService } from './echo-message.service';
import { ChatTranscriptionService } from './chat-transcription.service';
import { SessionState, DocumentType } from '../../domain';
import { FindUserByIdentificationNumberUseCase } from '../../../modules/users/application/use-cases';
import { User as DomainUser } from '../../../modules/users/domain/entities/user.entity';
import { SessionWithAllData } from '../../domain/types/session-data.types';
import { MfaConversationFlowService } from './mfa-conversation-flow.service';
import { IWhatsAppProfileService } from '../../domain/interfaces/message-analysis.interface';

/**
 * @fileoverview Servicio para manejar el flujo inicial de autenticación y recopilación de datos del usuario.
 *
 * @class InitialAuthenticationFlowService
 * @description
 * Este servicio es responsable de las primeras etapas de la interacción con el usuario:
 * - Enviar mensajes de bienvenida personalizados.
 * - Gestionar la entrada y validación del número de documento del usuario.
 * - Buscar al usuario en la base de datos a partir de su identificación.
 * - Preparar y transferir el control al {@link MfaConversationFlowService} si el usuario es identificado.
 *
 * @property {Logger} logger - Instancia para el registro de eventos y errores.
 * @property {SessionManagerService} sessionManager - Gestiona sesiones de usuario.
 * @property {EchoMessageService} messageService - Envía mensajes de respuesta.
 * @property {ChatTranscriptionService} transcriptionService - Registra la conversación.
 * @property {FindUserByIdentificationNumberUseCase} findUserByIdentificationNumberUseCase - Busca usuarios por identificación.
 * @property {MfaConversationFlowService} mfaConversationFlowService - Servicio para el flujo de MFA.
 * @property {IWhatsAppProfileService} profileService - Obtiene perfiles de WhatsApp.
 */
@Injectable()
export class InitialAuthenticationFlowService {
  private readonly logger = new Logger(InitialAuthenticationFlowService.name);

  constructor(
    private readonly sessionManager: SessionManagerService,
    private readonly messageService: EchoMessageService,
    private readonly transcriptionService: ChatTranscriptionService,
    private readonly findUserByIdentificationNumberUseCase: FindUserByIdentificationNumberUseCase,
    private readonly mfaConversationFlowService: MfaConversationFlowService,
    @Inject('IWhatsAppProfileService') private readonly profileService: IWhatsAppProfileService,
  ) {}

  /**
   * @private
   * @async
   * @method sendMessageAndLog
   * @description Envía un mensaje de respuesta al usuario y lo registra en la transcripción.
   *              Adaptado de ConversationService para uso interno.
   *
   * @param {string} from - Número de teléfono del destinatario.
   * @param {string} message - Contenido del mensaje a enviar.
   * @param {string} messageId - ID del mensaje original al que se responde (puede ser vacío).
   * @param {string} phoneNumberId - ID del número de WhatsApp Business que envía el mensaje.
   * @returns {Promise<void>}
   */
  private async sendMessageAndLog(from: string, message: string, messageId: string, phoneNumberId: string): Promise<void> {
    try {
      await this.messageService.reply(from, message, messageId, phoneNumberId);
      this.transcriptionService.addMessage(from, 'system', message);
      this.logger.debug(`[${from}] Sent system message via InitialAuthFlow: \"${message.substring(0, 100)}...\"`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${from}] Failed to send message via InitialAuthFlow. Error: ${errorMessage}`);
      this.transcriptionService.addMessage(from, 'system', `[System Error - IAF] Could not send reply.`);
    }
  }

  /**
   * @private
   * @async
   * @method sendWelcomeMessageInternal
   * @description Envía un mensaje de bienvenida personalizado al usuario e inicia el flujo de solicitud de documento.
   *              Establece el tipo de documento por defecto a Cédula de Ciudadanía (CC) y
   *              actualiza el estado de la sesión a `WAITING_DOCUMENT_NUMBER`.
   *
   * @param {string} from - Número de teléfono del usuario.
   * @param {string} messageId - ID del mensaje original de WhatsApp.
   * @param {string} phoneNumberId - ID del número de WhatsApp Business.
   * @param {SessionWithAllData} session - La sesión activa del usuario (recién creada o existente).
   * @param {any} [profile] - (Opcional) Perfil de WhatsApp del usuario si se obtuvo.
   * @returns {Promise<void>}
   */
  private async sendWelcomeMessageInternal(from: string, messageId: string, phoneNumberId: string, session: SessionWithAllData, profile?: any): Promise<void> {
    const welcomeMessage = `¡Hola! 👋 Bienvenido al sistema de #OMPLovers
Soy tu asistente virtual y estoy aquí para ayudarte a obtener tu certificado de manera rápida y segura.

🔐 *¿Sabías que?* 
* Puedes escribir directamente: "Necesito un certificado laboral"
* O también: "Mi cédula es 12345678"
* ¡El sistema es inteligente y te entenderá!

📝 Para comenzar, ingresa tu número de documento:`;
    
    await this.sendMessageAndLog(from, welcomeMessage, messageId, phoneNumberId);
    session.documentType = DocumentType.CC; 
    this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
    this.logger.log(`[${from}] Initial welcome message sent by InitialAuthFlow. Session state set to WAITING_DOCUMENT_NUMBER. Document type defaulted to CC.`);
  }

  /**
   * @public
   * @async
   * @method handleNewUserInteraction
   * @description Gestiona la interacción inicial para una nueva sesión.
   *              Intenta extraer información del primer mensaje para un atajo (ej. si se provee el No. de documento).
   *              Si no, envía el mensaje de bienvenida estándar.
   *
   * @param {string} from - Número de teléfono del usuario.
   * @param {SessionWithAllData} session - La sesión recién creada para el usuario.
   * @param {any} analysis - Resultado del análisis del primer mensaje (tipo cambiado a any).
   * @param {string} messageId - ID del mensaje original de WhatsApp.
   * @param {string} phoneNumberId - ID del número de WhatsApp Business.
   * @returns {Promise<void>}
   */
  public async handleNewUserInteraction(from: string, session: SessionWithAllData, analysis: any, messageId: string, phoneNumberId: string): Promise<void> {
    const profile = await this.profileService.getUserProfile(from);
    if (profile?.name && !session.clientName) {
      session.clientName = profile.name;
      this.logger.log(`[${from}] New session via InitialAuthFlow. Pre-filled client name from WhatsApp profile: \"${profile.name}\".`);
    }

    this.logger.log(`[${from}] Handling new user interaction via InitialAuthFlow. Intent: ${analysis.intent}, Extracted: ${JSON.stringify(analysis.extractedInfo)}`);

    if ((analysis.intent === 'REQUEST_CERTIFICATE' || analysis.intent === 'PROVIDE_PERSONAL_INFO') && analysis.extractedInfo?.documentNumber) {
      const normalizedDocumentNumber = String(analysis.extractedInfo.documentNumber).replace(/\\D/g, '');
      this.logger.log(`[${from}] New session (InitialAuthFlow): Document number \"${normalizedDocumentNumber}\" extracted. Attempting direct verification.`);
      
      session.documentType = analysis.extractedInfo?.documentType || DocumentType.CC; 
      session.documentNumber = normalizedDocumentNumber; 
      
      this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
      await this.processDocumentNumberInput(from, normalizedDocumentNumber, messageId, phoneNumberId, session);
      return; 
    }

    this.logger.log(`[${from}] New session (InitialAuthFlow): No scorable shortcut. Proceeding with standard welcome.`);
    await this.sendWelcomeMessageInternal(from, messageId, phoneNumberId, session, profile);
  }

  /**
   * @public
   * @async
   * @method processDocumentNumberInput
   * @description Procesa la entrada del usuario cuando se espera un número de documento.
   *              Limpia, valida el número y busca al usuario en la BD.
   *              Si se encuentra, actualiza la sesión e inicia el flujo MFA.
   *              Si no, informa al usuario y permite reintentar.
   *
   * @param {string} from - Número de teléfono del usuario.
   * @param {string} body - Mensaje del usuario (se espera el número de documento).
   * @param {string} messageId - ID del mensaje original de WhatsApp.
   * @param {string} phoneNumberId - ID del número de WhatsApp Business.
   * @param {SessionWithAllData} session - La sesión activa del usuario.
   * @returns {Promise<void>}
   */
  public async processDocumentNumberInput(from: string, body: string, messageId: string, phoneNumberId: string, session: SessionWithAllData): Promise<void> {
    session.documentType = session.documentType || DocumentType.CC;
    this.logger.log(`[${from}] InitialAuthFlow: Processing document number. Assumed/Current DocumentType: ${session.documentType}`);

    const rawInput = body.trim();
    const lowerInput = rawInput.toLowerCase();

    const terminationKeywords = ['finalizar', 'salir', 'terminar', 'cancelar', 'adios', 'adiós', 'chao'];
    if (terminationKeywords.some(keyword => lowerInput.includes(keyword))) {
      this.logger.log(`[${from}] User initiated termination during document input (InitialAuthFlow).`);
      await this.sendMessageAndLog(from, '👋 Solicitud de finalización recibida. ¡Hasta pronto!', messageId, phoneNumberId);
      this.transcriptionService.clearConversation(from); 
      this.sessionManager.clearSession(from); 
      return;
    }

    const numericId = rawInput.replace(/\\D/g, ''); 

    if (!numericId || numericId.length < 5 || numericId.length > 12) { 
      this.logger.warn(`[${from}] Invalid document number by InitialAuthFlow: \"${rawInput}\" -> \"${numericId}\".`);
      await this.sendMessageAndLog(from, '⚠️ El número de documento no parece válido. Por favor, ingrésalo sin puntos o comas, y asegúrate de que tenga la longitud correcta (5-12 dígitos).', messageId, phoneNumberId);
      this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER); 
      return;
    }

    this.logger.log(`[${from}] InitialAuthFlow: Searching user. DocType: ${session.documentType}, DocNum: ${numericId}`);
    let user: DomainUser | null = null;
    try {
      user = await this.findUserByIdentificationNumberUseCase.execute(numericId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${from}] Error during user search in InitialAuthFlow for ${numericId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      await this.sendMessageAndLog(from, 'Lo sentimos, un error técnico impidió buscar tu información. Intenta de nuevo más tarde.', messageId, phoneNumberId);
      this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER); 
      return;
    }

    if (user) {
      this.logger.log(`[${from}] InitialAuthFlow: User found - ID=${user.id}, Name=${user.full_name}, Email=${user.email ? 'Present' : 'MISSING!'}`);
      session.userId = user.id;
      session.clientName = user.full_name;
      session.documentNumber = user.identification_number; 
      session.email = user.email; 
      session.positionId = user.positionId ?? undefined;
      session.salary = user.salary;
      session.transportationAllowance = user.transportation_allowance;
      session.entryDate = user.entry_date;
      session.issuingPlace = user.issuing_place;

      this.logger.verbose(`[${from}] InitialAuthFlow: Session updated with user data. Proceeding to MFA.`);
      
      await this.mfaConversationFlowService.initiateMfaProcess(
        from,
        session.documentType, 
        user.identification_number, 
        messageId,
        phoneNumberId
      );
    } else {
      this.logger.warn(`[${from}] InitialAuthFlow: User NOT FOUND for DocType: ${session.documentType}, DocNum: ${numericId}.`);
      const notFoundMessage = `❌ *No eres empleado activo actualmente*
El documento no se encuentra registrado.

🔄 *¿Qué puedes hacer?*
* Verifica que el número esté correcto
* Intenta nuevamente con el documento correcto
* Escribe "finalizar" para salir

📝 Ingresa tu número de documento:`;
      await this.sendMessageAndLog(from, notFoundMessage, messageId, phoneNumberId);
      this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER); 
    }
  }
}