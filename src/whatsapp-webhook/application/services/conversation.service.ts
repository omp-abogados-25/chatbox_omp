import { Injectable, Inject, Logger } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { ClientService } from './client.service';
import { EchoMessageService } from './echo-message.service';
import { ChatTranscriptionService } from './chat-transcription.service';
import { SessionState, DocumentType, IEmailService, IMfaService, IRateLimitService, IMfaEmailService } from '../../domain';
import { IMessageAnalysisService, IWhatsAppProfileService, MessageContext } from '../../domain/interfaces/message-analysis.interface';
import { MessageIntent, CertificateType } from '../../domain/entities/message-intent.entity';

/**
 * @fileoverview Servicio principal de conversación para el sistema de WhatsApp
 * 
 * Este servicio maneja tod el flujo de conversación del chatbot, incluyendo:
 * - Autenticación multifactor (MFA) con códigos TOTP
 * - Rate limiting inteligente para prevenir abuso
 * - Gestión de estados de sesión
 * - Procesamiento de certificados laborales
 * - Análisis inteligente de mensajes e intenciones
 * - Saludos personalizados dinámicos
 * 
 * @author Sistema de Certificados Laborales
 * @version 1.0.0
 * @since 2024-12
 */
@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  /**
   * Constructor del servicio de conversación
   * 
   * @param sessionManager - Gestor de sesiones de usuario
   * @param clientService - Servicio de consulta de clientes
   * @param messageService - Servicio de envío de mensajes WhatsApp
   * @param transcriptionService - Servicio de transcripción de conversaciones
   * @param emailService - Servicio de envío de emails con certificados
   * @param mfaService - Servicio de autenticación multifactor
   * @param rateLimitService - Servicio de rate limiting y bloqueos
   * @param mfaEmailService - Servicio especializado para emails MFA
   * @param messageAnalysisService - Servicio de análisis inteligente de mensajes
   * @param profileService - Servicio de perfiles de WhatsApp
   */
  constructor(
    private readonly sessionManager: SessionManagerService,
    private readonly clientService: ClientService,
    private readonly messageService: EchoMessageService,
    private readonly transcriptionService: ChatTranscriptionService,
    @Inject('IEmailService') private readonly emailService: IEmailService,
    @Inject('IMfaService') private readonly mfaService: IMfaService,
    @Inject('IRateLimitService') private readonly rateLimitService: IRateLimitService,
    @Inject('IMfaEmailService') private readonly mfaEmailService: IMfaEmailService,
    @Inject('IMessageAnalysisService') private readonly messageAnalysisService: IMessageAnalysisService,
    @Inject('IWhatsAppProfileService') private readonly profileService: IWhatsAppProfileService,
  ) {}

  /**
   * Maneja un mensaje entrante de WhatsApp con análisis inteligente
   * 
   * Este es el punto de entrada principal para todos los mensajes. Implementa:
   * - Análisis inteligente de intenciones y extracción de información
   * - Verificación de lista negra (sin rate limiting general)
   * - Gestión de estados de sesión con atajos inteligentes
   * - Flujo completo de autenticación MFA
   * - Procesamiento de certificados laborales
   * - Saludos personalizados dinámicos
   * 
   * @param from - Número de teléfono del remitente
   * @param body - Contenido del mensaje
   * @param messageId - ID único del mensaje para respuestas
   * @param phoneNumberId - ID del número de WhatsApp Business
   * 
   * @example
   * ```typescript
   * // Mensaje simple
   * await conversationService.handleMessage('+573001234567', 'Hola', 'msg_123', 'phone_456');
   * 
   * // Mensaje complejo con información
   * await conversationService.handleMessage(
   *   '+573001234567', 
   *   'Necesito un certificado laboral, mi cédula es 12345678 y soy Juan Pérez', 
   *   'msg_123', 
   *   'phone_456'
   * );
   * ```
   */
  async handleMessage(from: string, body: string, messageId: string, phoneNumberId: string): Promise<void> {
    // 1. VERIFICAR SOLO SI ESTÁ EN LISTA NEGRA (no rate limit general)
    const isBlocked = await this.rateLimitService.isPhoneBlocked(from);
    
    if (isBlocked) {
      const blacklistedInfo = await this.rateLimitService.getBlacklistedPhone(from);
      const blockMessage = blacklistedInfo?.expiresAt 
        ? `🚫 Tu número está temporalmente bloqueado hasta ${new Date(blacklistedInfo.expiresAt).toLocaleString('es-CO')}.\n\nRazón: ${blacklistedInfo.reason}\n\nSi crees que esto es un error, contacta soporte.`
        : `🚫 Tu número está permanentemente bloqueado.\n\nRazón: ${blacklistedInfo?.reason || 'Múltiples violaciones de seguridad'}\n\nContacta soporte para más información.`;
      
      await this.messageService.reply(from, blockMessage, messageId, phoneNumberId);
      return;
    }

    // 2. ANÁLISIS INTELIGENTE DEL MENSAJE
    let session = this.sessionManager.getSession(from);
    const context: MessageContext = {
      sessionState: session?.state,
      isFirstInteraction: !session,
      knownUserInfo: session ? {
        name: session.clientName,
        documentNumber: session.documentNumber,
        documentType: session.documentType
      } : undefined
    };

    const analysis = await this.messageAnalysisService.analyzeMessage(body, context);
    
    // 3. REGISTRAR MENSAJE EN TRANSCRIPCIÓN
    this.transcriptionService.addMessage(from, 'user', body);
    
    // 4. PROCESAR SEGÚN INTENCIÓN DETECTADA
    if (!session) {
      // Nueva sesión - manejar según intención
      await this.handleNewSession(from, analysis, messageId, phoneNumberId);
    } else {
      // Sesión existente - continuar flujo o procesar atajo inteligente
      await this.handleExistingSession(from, session, analysis, messageId, phoneNumberId);
    }
  }

  private async sendMessageAndLog(from: string, message: string, messageId: string, phoneNumberId: string): Promise<void> {
    try {
      await this.messageService.reply(from, message, messageId, phoneNumberId);
      this.transcriptionService.addMessage(from, 'system', message);
    } catch (error) {
      this.logger.error(`Error sending message to ${from}:`, error.message);
      this.transcriptionService.addMessage(from, 'system', `[ERROR] Failed to send: ${message.substring(0, 50)}...`);
      
      // No relanzar el error para evitar que se rompa el flujo
      // En producción, aquí podrías implementar un sistema de reintentos
    }
  }

  private async sendInteractiveMenuAndLog(from: string, menuMessage: any, menuDescription: string): Promise<void> {
    try {
      await this.messageService.sendInteractiveMessage(menuMessage);
      this.transcriptionService.addMessage(from, 'system', `[Menú Interactivo] ${menuDescription}`);
    } catch (error) {
      this.logger.error(`Error sending interactive menu to ${from}:`, error.message);
      
      // Fallback: enviar mensaje de texto simple con opciones claras
      let fallbackMessage = '';
      
      if (menuDescription.includes('documento')) {
        fallbackMessage = `📋 **Tipo de Documento**

Selecciona tu tipo de documento:

🆔 **CC** - Cédula de Ciudadanía
👶 **TI** - Tarjeta de Identidad  
🌍 **CE** - Cédula de Extranjería
✈️ **PP** - Pasaporte

💡 **Escribe:** CC, TI, CE, PP o "finalizar"`;
      } else if (menuDescription.includes('certificado')) {
        fallbackMessage = `📄 **Certificados Laborales**

¿Qué tipo de certificado necesitas?

💰 **Con Sueldo** - Incluye información salarial
📋 **Sin Sueldo** - Solo información básica

💡 **Escribe:** "con sueldo", "sin sueldo" o "finalizar"`;
      } else {
        fallbackMessage = `📋 **Opciones Disponibles**

Por favor selecciona una opción escribiendo el texto correspondiente o escribe "finalizar" para salir.`;
      }
      
      try {
        await this.messageService.reply(from, fallbackMessage, '', '');
        this.transcriptionService.addMessage(from, 'system', `[Menú Texto] ${menuDescription}`);
      } catch (fallbackError) {
        this.logger.error(`Error sending fallback message to ${from}:`, fallbackError.message);
      }
    }
  }

  private async sendWelcomeMessage(from: string, messageId: string, phoneNumberId: string): Promise<void> {
    const welcomeMessage = `¡Hola! 👋 Bienvenido al sistema de certificados laborales.

Para comenzar, necesito verificar tu identidad.

📝 Por favor, ingresa tu número de documento:`;

    // Enviar mensaje de bienvenida y ir directo a pedir documento
    await this.sendMessageAndLog(from, welcomeMessage, messageId, phoneNumberId);
    this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
  }

  private async sendDocumentTypeMenu(from: string, messageId: string, phoneNumberId: string): Promise<void> {
    const menuMessage = {
      messaging_product: 'whatsapp',
      to: from,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '📋 Tipo de Documento'
        },
        body: {
          text: 'Selecciona tu tipo de documento de identidad:\n\n💡 También puedes escribir: CC, TI, CE, PP o "finalizar"'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'doc_cc',
                title: '🆔 Cédula (CC)'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'doc_ti',
                title: '👶 Tarjeta (TI)'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'doc_ce',
                title: '🌍 Extranjería (CE)'
              }
            }
          ]
        }
      }
    };

    await this.sendInteractiveMenuAndLog(from, menuMessage, 'documento');
  }

  private async handleDocumentTypeInput(from: string, body: string, messageId: string, phoneNumberId: string): Promise<void> {
    let documentType: DocumentType | undefined;
    const input = body.trim().toLowerCase();
    const session = this.sessionManager.getSession(from);

    if (!session) {
      await this.sendWelcomeMessage(from, messageId, phoneNumberId);
      return;
    }

    // Manejar respuesta de menú interactivo
    switch (body) {
      case 'doc_cc':
        documentType = DocumentType.CC;
        break;
      case 'doc_ti':
        documentType = DocumentType.TI;
        break;
      case 'doc_ce':
        documentType = DocumentType.CE;
        break;
      case 'doc_pp':
        documentType = DocumentType.PP;
        break;
      case 'finalizar_conversacion':
        await this.sendMessageAndLog(
          from,
          '👋 ¡Gracias por usar nuestro servicio! Que tengas un excelente día.',
          messageId,
          phoneNumberId
        );
        this.sessionManager.clearSession(from);
        this.transcriptionService.clearConversation(from);
        return;
      default:
        // Manejar entrada de texto libre
        if (input.includes('cc') || input.includes('cedula') || input.includes('cédula') || input.includes('ciudadania') || input === '1') {
          documentType = DocumentType.CC;
        } else if (input.includes('ti') || input.includes('tarjeta') || input.includes('identidad') || input === '2') {
          documentType = DocumentType.TI;
        } else if (input.includes('ce') || input.includes('extranjeria') || input.includes('extranjería') || input === '3') {
          documentType = DocumentType.CE;
        } else if (input.includes('pp') || input.includes('pasaporte') || input === '4') {
          documentType = DocumentType.PP;
        } else if (input.includes('finalizar') || input.includes('salir') || input.includes('terminar') || 
                   input.includes('adios') || input.includes('adiós') || input.includes('chao') || input === '5') {
          await this.sendMessageAndLog(
            from,
            '👋 ¡Gracias por usar nuestro servicio! Que tengas un excelente día.',
            messageId,
            phoneNumberId
          );
          this.sessionManager.clearSession(from);
          this.transcriptionService.clearConversation(from);
          return;
        } else {
          await this.sendMessageAndLog(
            from,
            '❌ Opción no válida. Por favor selecciona una opción del menú o escribe:\n\n• **CC** o **1** (Cédula de Ciudadanía)\n• **TI** o **2** (Tarjeta de Identidad)\n• **CE** o **3** (Cédula de Extranjería)\n• **PP** o **4** (Pasaporte)\n• **Finalizar** o **5** (Salir)',
            messageId,
            phoneNumberId
          );
          await this.sendDocumentTypeMenu(from, messageId, phoneNumberId);
          return;
        }
    }

    // Si ya tengo el número de documento (caso de múltiples coincidencias)
    if (session.documentNumber) {
      const client = this.clientService.findByDocument(documentType, session.documentNumber);
      
      if (client) {
        // Cliente encontrado con tipo específico
        session.documentType = documentType;
        session.clientName = client.name;
        session.email = client.email;
        
        const documentTypeNames = {
          [DocumentType.CC]: 'Cédula de Ciudadanía',
          [DocumentType.TI]: 'Tarjeta de Identidad',
          [DocumentType.CE]: 'Cédula de Extranjería',
          [DocumentType.PP]: 'Pasaporte'
        };
        
        await this.sendMessageAndLog(
          from,
          `✅ ¡Perfecto! Te hemos identificado como **${client.name}**.\n\n🔍 Documento: ${documentTypeNames[documentType]} ${session.documentNumber}`,
          messageId,
          phoneNumberId
        );
        
        await this.initiateMfaProcess(from, client.name, documentType, session.documentNumber, client.email, messageId, phoneNumberId);
      } else {
        // No encontrado con este tipo específico
        await this.sendMessageAndLog(
          from,
          `❌ **No encontrado**\n\nNo encontramos un registro con ${documentType} ${session.documentNumber}.\n\nPor favor selecciona el tipo correcto o escribe "finalizar" para salir.`,
          messageId,
          phoneNumberId
        );
        await this.sendDocumentTypeMenu(from, messageId, phoneNumberId);
      }
    } else {
      // Flujo normal: pedir número de documento
      session.documentType = documentType;
      this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
      
      const documentTypeNames = {
        [DocumentType.CC]: 'Cédula de Ciudadanía',
        [DocumentType.TI]: 'Tarjeta de Identidad',
        [DocumentType.CE]: 'Cédula de Extranjería',
        [DocumentType.PP]: 'Pasaporte'
      };
      
      await this.sendMessageAndLog(
        from,
        `✅ Perfecto! Has seleccionado: **${documentTypeNames[documentType]}**\n\n📝 Ahora por favor ingresa tu número de documento:`,
        messageId,
        phoneNumberId
      );
    }
  }

  private async handleDocumentNumberInput(from: string, body: string, messageId: string, phoneNumberId: string): Promise<void> {
    const documentNumber = body.trim();
    const input = documentNumber.toLowerCase();
    const session = this.sessionManager.getSession(from);
    
    if (!session) {
      await this.sendWelcomeMessage(from, messageId, phoneNumberId);
      return;
    }

    // Verificar si quiere finalizar
    if (input.includes('finalizar') || input.includes('salir') || input.includes('terminar') || 
        input.includes('adios') || input.includes('adiós') || input.includes('chao') || 
        input.includes('cancelar') || input.includes('ya no')) {
      await this.sendMessageAndLog(
        from,
        '👋 ¡Gracias por usar nuestro servicio! Que tengas un excelente día.',
        messageId,
        phoneNumberId
      );
      this.sessionManager.clearSession(from);
      this.transcriptionService.clearConversation(from);
      return;
    }

    // Validar que sea un número válido
    if (!/^\d{6,12}$/.test(documentNumber)) {
      await this.sendMessageAndLog(
        from,
        '❌ **Formato inválido**\n\nEl número de documento debe tener entre 6 y 12 dígitos.\n\n📝 Por favor ingresa solo números (sin puntos, comas o espacios):\n\n💡 *Ejemplo:* 12345678\n\n🚪 *Escribe "finalizar" para salir*',
        messageId,
        phoneNumberId
      );
      return;
    }

    // Buscar cliente por número (sin especificar tipo)
    const searchResult = this.clientService.findUniqueByDocumentNumber(documentNumber);
    
    if (searchResult === undefined) {
      // No encontrado
      const randomMessages = [
        '❌ **Usuario no encontrado**\n\nNo encontramos un registro con ese documento.',
        '❌ **Documento no registrado**\n\nEl documento ingresado no está en nuestros registros.',
        '❌ **Sin coincidencias**\n\nNo pudimos localizar tu información en el sistema.',
        '❌ **Registro inexistente**\n\nEl documento no se encuentra registrado.',
      ];
      
      const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
      await this.sendMessageAndLog(
        from, 
        `${randomMessage}\n\n🔄 **¿Qué puedes hacer?**\n• Verifica que el número esté correcto\n• Intenta nuevamente con el documento correcto\n• Escribe "finalizar" para salir\n\n📝 Ingresa tu número de documento:`,
        messageId, 
        phoneNumberId
      );
    } else if (searchResult === null) {
      // Múltiples coincidencias - pedir tipo de documento
      const matches = this.clientService.findByDocumentNumber(documentNumber);
      const documentTypes = matches.map(client => `${client.documentType} (${client.name})`).join(', ');
      
      await this.sendMessageAndLog(
        from,
        `🔍 **Múltiples registros encontrados**\n\nEncontramos ${matches.length} registros con el documento ${documentNumber}:\n\n${documentTypes}\n\nPara continuar, selecciona tu tipo de documento:`,
        messageId,
        phoneNumberId
      );
      
      // Guardar número y cambiar estado para pedir tipo
      session.documentNumber = documentNumber;
      this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_TYPE);
      await this.sendDocumentTypeMenu(from, messageId, phoneNumberId);
    } else {
      // Una sola coincidencia - continuar con MFA
      const client = searchResult;
      session.documentNumber = documentNumber;
      session.documentType = client.documentType;
      session.clientName = client.name;
      session.email = client.email;
      
      await this.sendMessageAndLog(
        from,
        `🎉 ¡Perfecto! Te hemos identificado como **${client.name}**.\n\n🔍 Documento: ${client.documentType} ${documentNumber}`,
        messageId,
        phoneNumberId
      );
      
      await this.initiateMfaProcess(from, client.name, client.documentType, documentNumber, client.email, messageId, phoneNumberId);
    }
  }

  /**
   * Inicia el proceso de autenticación multifactor (MFA)
   * 
   * Este método es crítico para la seguridad del sistema. Implementa:
   * - Rate limiting específico para solicitudes MFA (NO para conversación general)
   * - Generación de códigos TOTP únicos por sesión
   * - Envío de códigos por email con plantillas profesionales
   * - Gestión de intentos y expiración
   * 
   * @param from - Número de teléfono del usuario
   * @param clientName - Nombre del cliente identificado
   * @param documentType - Tipo de documento (CC, TI, CE, PP)
   * @param documentNumber - Número de documento
   * @param email - Email para envío del código TOTP
   * @param messageId - ID del mensaje para respuestas
   * @param phoneNumberId - ID del número WhatsApp Business
   * 
   * @throws Error si falla la generación o envío del código
   * 
   * @example
   * ```typescript
   * await this.initiateMfaProcess(
   *   '+573001234567',
   *   'Juan Pérez',
   *   DocumentType.CC,
   *   '12345678',
   *   'juan@email.com',
   *   'msg_123',
   *   'phone_456'
   * );
   * ```
   */
  private async initiateMfaProcess(
    from: string, 
    clientName: string, 
    documentType: DocumentType, 
    documentNumber: string, 
    email: string,
    messageId: string, 
    phoneNumberId: string
  ): Promise<void> {
    try {
      // VERIFICAR RATE LIMITING ESPECÍFICO PARA SOLICITUDES MFA
      const rateLimitInfo = await this.rateLimitService.checkRateLimit(from);
      
      if (rateLimitInfo.isBlocked) {
        const blockMessage = `🚫 Has solicitado demasiados códigos de verificación.\n\n` +
          `⏰ Puedes solicitar un nuevo código en ${Math.ceil((rateLimitInfo.blockExpiresAt?.getTime() - Date.now()) / (1000 * 60))} minutos.\n\n` +
          `🛡️ Esta medida protege tu cuenta contra uso no autorizado.`;
        
        await this.sendMessageAndLog(from, blockMessage, messageId, phoneNumberId);
        this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
        return;
      }

      // INCREMENTAR CONTADOR SOLO PARA SOLICITUDES MFA
      await this.rateLimitService.incrementRequestCount(from);

      // Crear sesión MFA
      const mfaSession = await this.mfaService.createMfaSession(
        from, 
        documentNumber, 
        documentType, 
        email
      );

      // Actualizar sesión local
      const session = this.sessionManager.getSession(from);
      if (session) {
        session.mfaSessionId = mfaSession.id;
        this.sessionManager.updateSessionState(from, SessionState.WAITING_MFA_VERIFICATION);
      }

      // Enviar código por email
      const emailSent = await this.mfaEmailService.sendTotpCode(
        email,
        mfaSession.totpCode,
        clientName,
        600 // 10 minutos
      );

      if (emailSent) {
        await this.sendMessageAndLog(
          from,
          `🎉 ¡Hola ${clientName}! Te hemos identificado correctamente.\n\n` +
          `🔐 Para continuar, hemos enviado un código de verificación a tu correo electrónico:\n` +
          `📧 ${this.maskEmail(email)}\n\n` +
          `Por favor revisa tu bandeja de entrada (y spam) e ingresa el código de 6 dígitos que recibiste.\n\n` +
          `⏰ El código expira en 10 minutos.\n` +
          `🔄 Tienes máximo 3 intentos para ingresarlo correctamente.`,
          messageId,
          phoneNumberId
        );
      } else {
        await this.sendMessageAndLog(
          from,
          `❌ Error al enviar el código de verificación. Por favor intenta nuevamente más tarde.`,
          messageId,
          phoneNumberId
        );
        this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
      }
    } catch (error) {
      console.error('Error initiating MFA process:', error);
      await this.sendMessageAndLog(
        from,
        `❌ Error en el sistema de verificación. Por favor intenta nuevamente.`,
        messageId,
        phoneNumberId
      );
      this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
    }
  }

  /**
   * Maneja la verificación de códigos TOTP para MFA
   * 
   * Características de seguridad implementadas:
   * - Validación de formato (exactamente 6 dígitos)
   * - Máximo 3 intentos por sesión MFA
   * - Limpieza automática de rate limits al completar exitosamente
   * - Expiración automática de sesiones (10 minutos)
   * - Reinicio del proceso tras agotar intentos
   * 
   * @param from - Número de teléfono del usuario
   * @param body - Código TOTP ingresado por el usuario
   * @param messageId - ID del mensaje para respuestas
   * @param phoneNumberId - ID del número WhatsApp Business
   * 
   * @example
   * ```typescript
   * // Usuario ingresa: "123456"
   * await this.handleMfaVerification('+573001234567', '123456', 'msg_123', 'phone_456');
   * ```
   */
  private async handleMfaVerification(from: string, body: string, messageId: string, phoneNumberId: string): Promise<void> {
    const session = this.sessionManager.getSession(from);
    
    if (!session || !session.mfaSessionId) {
      await this.sendWelcomeMessage(from, messageId, phoneNumberId);
      return;
    }

    const totpCode = body.trim();
    
    // Verificar formato del código (6 dígitos)
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
      // Verificar código TOTP
      const isValid = await this.mfaService.verifyMfaSession(session.mfaSessionId, totpCode);
      
      if (isValid) {
        // Verificación exitosa - LIMPIAR RATE LIMIT
        await this.rateLimitService.unblockPhoneNumber(from);
        this.sessionManager.updateSessionState(from, SessionState.AUTHENTICATED);
        
        // Si ya tiene tipo de certificado, procesar directamente
        if (session.certificateType) {
          const tipoSueldoDisplay = session.certificateType === CertificateType.WITH_SALARY ? 'con sueldo' : 'sin sueldo';
          const tipoSueldoClave = session.certificateType === CertificateType.WITH_SALARY ? 'con_sueldo' : 'sin_sueldo';
          
          await this.sendMessageAndLog(
            from,
            `✅ ¡Verificación exitosa! Tu identidad ha sido confirmada.\n\n📋 Procesando tu certificado laboral ${tipoSueldoDisplay}...`,
            messageId,
            phoneNumberId
          );
          
          await this.processCertificateRequest(from, tipoSueldoDisplay, tipoSueldoClave, session.clientName, messageId, phoneNumberId);
        } else {
          // Mostrar menú de certificados
          await this.showCertificateMenu(from, messageId, phoneNumberId);
        }
      } else {
        // Código inválido o sesión expirada
        const mfaSession = await this.mfaService.getMfaSession(session.mfaSessionId);
        
        if (!mfaSession) {
          await this.sendMessageAndLog(
            from,
            '❌ La sesión de verificación ha expirado. Por favor inicia el proceso nuevamente.',
            messageId,
            phoneNumberId
          );
          this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_TYPE);
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
            this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_TYPE);
            await this.sendWelcomeMessage(from, messageId, phoneNumberId);
          }
        }
      }
    } catch (error) {
      console.error('Error verifying MFA:', error);
      await this.sendMessageAndLog(
        from,
        '❌ Error en la verificación. Por favor intenta nuevamente.',
        messageId,
        phoneNumberId
      );
    }
  }

  private async handleBlockedState(from: string, messageId: string, phoneNumberId: string): Promise<void> {
    const blacklistedInfo = await this.rateLimitService.getBlacklistedPhone(from);
    const blockMessage = blacklistedInfo?.expiresAt 
      ? `🚫 Tu número está temporalmente bloqueado hasta ${new Date(blacklistedInfo.expiresAt).toLocaleString('es-CO')}.\n\nRazón: ${blacklistedInfo.reason}`
      : `🚫 Tu número está permanentemente bloqueado.\n\nRazón: ${blacklistedInfo?.reason || 'Múltiples violaciones de seguridad'}`;
    
    await this.messageService.reply(from, blockMessage, messageId, phoneNumberId);
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
    return `${maskedLocal}@${domain}`;
  }

  private async showCertificateMenu(from: string, messageId: string, phoneNumberId: string): Promise<void> {
    // Mensaje de confirmación
    await this.sendMessageAndLog(
      from,
      `✅ ¡Verificación exitosa! Tu identidad ha sido confirmada.`,
      messageId,
      phoneNumberId
    );

    // Menú interactivo con botones (aparece inmediatamente)
    const menuMessage = {
      messaging_product: 'whatsapp',
      to: from,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '📄 Certificados Laborales'
        },
        body: {
          text: '¿Qué tipo de certificado laboral necesitas?\n\n💡 También puedes escribir: "con sueldo", "sin sueldo" o "finalizar"'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'cert_con_sueldo',
                title: '💰 Con Sueldo'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'cert_sin_sueldo',
                title: '📋 Sin Sueldo'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'cert_finalizar',
                title: '❌ Finalizar'
              }
            }
          ]
        }
      }
    };

    await this.sendInteractiveMenuAndLog(from, menuMessage, 'certificados');
    this.sessionManager.updateSessionState(from, SessionState.SHOWING_MENU);
  }

  private async handleMenuSelection(from: string, body: string, messageId: string, phoneNumberId: string): Promise<void> {
    const session = this.sessionManager.getSession(from);
    if (!session || !session.clientName) {
      await this.sendWelcomeMessage(from, messageId, phoneNumberId);
      return;
    }

    const input = body.trim().toLowerCase();
    let tipoSueldoDisplay: string;
    let tipoSueldoClave: string;

    // Verificar si es una despedida antes de procesar opciones del menú
    const analysis = await this.messageAnalysisService.analyzeMessage(body);
    if (analysis.intent === MessageIntent.GOODBYE) {
      await this.sendMessageAndLog(
        from,
        '👋 ¡Gracias por usar nuestro servicio! Que tengas un excelente día.',
        messageId,
        phoneNumberId
      );
      this.sessionManager.clearSession(from);
      this.transcriptionService.clearConversation(from);
      return;
    }

    // Manejar opciones del menú
    switch (body) {
      case 'cert_con_sueldo':
        tipoSueldoDisplay = 'con sueldo';
        tipoSueldoClave = 'con_sueldo'; // Clave para EmailService
        await this.processCertificateRequest(from, tipoSueldoDisplay, tipoSueldoClave, session.clientName, messageId, phoneNumberId);
        break;
      
      case 'cert_sin_sueldo':
        tipoSueldoDisplay = 'sin sueldo';
        tipoSueldoClave = 'sin_sueldo'; // Clave para EmailService
        await this.processCertificateRequest(from, tipoSueldoDisplay, tipoSueldoClave, session.clientName, messageId, phoneNumberId);
        break;
      
      case 'cert_finalizar':
        await this.sendMessageAndLog(
          from,
          '👋 ¡Gracias por usar nuestro servicio! Que tengas un excelente día.',
          messageId,
          phoneNumberId
        );
        this.sessionManager.clearSession(from);
        this.transcriptionService.clearConversation(from);
        return;
      
      default:
        // Manejar entrada de texto libre
        if (input.includes('con sueldo') || input.includes('con salario') || input.includes('sueldo') || input.includes('salario') || input === '1') {
          tipoSueldoDisplay = 'con sueldo';
          tipoSueldoClave = 'con_sueldo';
          await this.processCertificateRequest(from, tipoSueldoDisplay, tipoSueldoClave, session.clientName, messageId, phoneNumberId);
        } else if (input.includes('sin sueldo') || input.includes('sin salario') || input.includes('basico') || input.includes('básico') || input === '2') {
          tipoSueldoDisplay = 'sin sueldo';
          tipoSueldoClave = 'sin_sueldo';
          await this.processCertificateRequest(from, tipoSueldoDisplay, tipoSueldoClave, session.clientName, messageId, phoneNumberId);
        } else if (input.includes('finalizar') || input.includes('salir') || input.includes('terminar') || 
                   input.includes('adios') || input.includes('adiós') || input.includes('chao') || 
                   input.includes('ya no') || input.includes('cancelar') || input === '3') {
          await this.sendMessageAndLog(
            from,
            '👋 ¡Gracias por usar nuestro servicio! Que tengas un excelente día.',
            messageId,
            phoneNumberId
          );
          this.sessionManager.clearSession(from);
          this.transcriptionService.clearConversation(from);
          return;
        } else {
          await this.sendMessageAndLog(
            from,
            '❌ Opción no válida. Por favor selecciona una opción del menú o escribe:\\n\\n• **Con sueldo** o **1** (Certificado con información salarial)\\n• **Sin sueldo** o **2** (Certificado básico)\\n• **Finalizar** o **3** (Salir del sistema)',
            messageId,
            phoneNumberId
          );
          await this.showCertificateMenu(from, messageId, phoneNumberId);
        }
        break;
    }
  }

  private async processCertificateRequest(
    from: string, 
    tipoSueldoDisplay: string, // Para mensajes al usuario
    tipoSueldoClave: string,    // Para EmailService
    clientName: string, 
    messageId: string, 
    phoneNumberId: string
  ): Promise<void> {
    const session = this.sessionManager.getSession(from);
    const documentInfo = session ? `${session.documentType} ${session.documentNumber}` : 'N/A';
    
    const processingMessage = `⏳ Procesando tu solicitud de certificado laboral ${tipoSueldoDisplay}...\n\nPor favor espera un momento.`;
    await this.sendMessageAndLog(from, processingMessage, messageId, phoneNumberId);

    // Simular delay de procesamiento intencionalmente más corto para este flujo final
    setTimeout(async () => {
      try {
        const chatTranscription = this.transcriptionService.getTranscription(from);
        // const conversationSummary = this.transcriptionService.getConversationSummary(from); // Ya no se usa en el mensaje
        
        const client = this.clientService.findByDocument(session?.documentType, session?.documentNumber);
        const clientEmail = client?.email || `${clientName.toLowerCase().replace(/\s+/g, '.')}@ejemplo.com`;
        
        const emailSent = await this.emailService.sendCertificateEmail(
          clientEmail,
          client,
          tipoSueldoClave, 
          chatTranscription
        );

        let confirmationMessage: string;
        
        if (emailSent) {
          confirmationMessage = `✅ **CERTIFICADO GENERADO EXITOSAMENTE**

📋 **Detalles de la solicitud:**
• Nombre: ${clientName}
• Documento: ${documentInfo}
• Tipo: Certificado laboral ${tipoSueldoDisplay} 
• Fecha: ${new Date().toLocaleDateString('es-CO')}
• Hora: ${new Date().toLocaleTimeString('es-CO')}

📧 **El certificado ha sido enviado a:** ${clientEmail}

Gracias por usar nuestro servicio.`;
        } else {
          confirmationMessage = `⚠️ **CERTIFICADO GENERADO CON ADVERTENCIA**

📋 **Detalles de la solicitud:**
• Nombre: ${clientName}
• Documento: ${documentInfo}
• Tipo: Certificado laboral ${tipoSueldoDisplay}
• Fecha: ${new Date().toLocaleDateString('es-CO')}
• Hora: ${new Date().toLocaleTimeString('es-CO')}

❌ **Hubo un problema al enviar el email a:** ${clientEmail}

Por favor, contacta a soporte técnico con el número de referencia: ${messageId}

Gracias por usar nuestro servicio.`;
        }

        await this.sendMessageAndLog(from, confirmationMessage, messageId, phoneNumberId);
        
        // Forzar cierre de sesión y no mostrar más menú
        this.logger.log(`Forzando cierre de sesión para ${from} después de generar certificado.`);
        this.sessionManager.clearSession(from);
        this.transcriptionService.clearConversation(from);
        
      } catch (error) {
        this.logger.error(`Error en processCertificateRequest para ${from}:`, error);
        const errorMessage = `❌ **ERROR AL PROCESAR CERTIFICADO**

Ocurrió un error inesperado al generar tu certificado. 
Por favor, intenta nuevamente o contacta a soporte técnico.

Referencia del error: ${messageId}

Finalizando sesión.`;

        await this.sendMessageAndLog(from, errorMessage, messageId, phoneNumberId);
        // Asegurarse de cerrar sesión también en caso de error catastrófico aquí
        this.sessionManager.clearSession(from);
        this.transcriptionService.clearConversation(from);
      }
    }, 1500); // Reducido el timeout, ya que no hay menú posterior
  }

  /**
   * Maneja mensajes para nuevas sesiones con análisis inteligente
   * 
   * @param from - Número de teléfono del usuario
   * @param analysis - Análisis del mensaje
   * @param messageId - ID del mensaje
   * @param phoneNumberId - ID del número WhatsApp Business
   */
  private async handleNewSession(from: string, analysis: any, messageId: string, phoneNumberId: string): Promise<void> {
    // Obtener perfil de usuario para saludo personalizado
    const profile = await this.profileService.getUserProfile(from);
    
    switch (analysis.intent) {
      case MessageIntent.REQUEST_CERTIFICATE:
        // Usuario solicita certificado directamente
        await this.handleDirectCertificateRequest(from, analysis, profile, messageId, phoneNumberId);
        break;
        
      case MessageIntent.PROVIDE_PERSONAL_INFO:
        // Usuario proporciona información personal directamente
        await this.handleDirectPersonalInfo(from, analysis, profile, messageId, phoneNumberId);
        break;
        
      case MessageIntent.GREETING:
      default:
        // Saludo normal o intención desconocida - flujo estándar
        const session = this.sessionManager.createSession(from);
        await this.sendPersonalizedWelcomeMessage(from, profile, messageId, phoneNumberId);
        break;
    }
  }

  /**
   * Maneja mensajes para sesiones existentes
   * 
   * @param from - Número de teléfono del usuario
   * @param session - Sesión existente
   * @param analysis - Análisis del mensaje
   * @param messageId - ID del mensaje
   * @param phoneNumberId - ID del número WhatsApp Business
   */
  private async handleExistingSession(from: string, session: any, analysis: any, messageId: string, phoneNumberId: string): Promise<void> {
    // Actualizar actividad de sesión
    this.sessionManager.updateSessionActivity(from);

    // Si el usuario hace una solicitud directa en cualquier momento, procesarla
    if (analysis.intent === MessageIntent.REQUEST_CERTIFICATE && session.state !== SessionState.WAITING_MFA_VERIFICATION) {
      const profile = await this.profileService.getUserProfile(from);
      await this.handleDirectCertificateRequest(from, analysis, profile, messageId, phoneNumberId);
      return;
    }

    // Continuar con el flujo normal según el estado
    switch (session.state) {
      case SessionState.WAITING_DOCUMENT_TYPE:
        await this.handleDocumentTypeInput(from, analysis.originalMessage, messageId, phoneNumberId);
        break;
      
      case SessionState.WAITING_DOCUMENT_NUMBER:
        await this.handleDocumentNumberInput(from, analysis.originalMessage, messageId, phoneNumberId);
        break;
      
      case SessionState.WAITING_MFA_VERIFICATION:
        await this.handleMfaVerification(from, analysis.originalMessage, messageId, phoneNumberId);
        break;
      
      case SessionState.AUTHENTICATED:
      case SessionState.SHOWING_MENU:
        await this.handleMenuSelection(from, analysis.originalMessage, messageId, phoneNumberId);
        break;
      
      case SessionState.BLOCKED:
      case SessionState.RATE_LIMITED:
        await this.handleBlockedState(from, messageId, phoneNumberId);
        break;
      
      default:
        const profile = await this.profileService.getUserProfile(from);
        await this.sendPersonalizedWelcomeMessage(from, profile, messageId, phoneNumberId);
    }
  }

  /**
   * Maneja solicitudes directas de certificado
   * 
   * @param from - Número de teléfono del usuario
   * @param analysis - Análisis del mensaje
   * @param profile - Perfil del usuario
   * @param messageId - ID del mensaje
   * @param phoneNumberId - ID del número WhatsApp Business
   */
  private async handleDirectCertificateRequest(from: string, analysis: any, profile: any, messageId: string, phoneNumberId: string): Promise<void> {
    const session = this.sessionManager.getSession(from) || this.sessionManager.createSession(from);
    
    if (analysis.extractedInfo?.documentNumber) {
      // Intentar buscar cliente directamente
      const searchResult = this.clientService.findUniqueByDocumentNumber(analysis.extractedInfo.documentNumber);
      
      if (searchResult === undefined) {
        // Cliente no encontrado
        await this.sendMessageAndLog(
          from,
          `¡Hola! 👋\n\n❌ **Usuario no encontrado**\n\nNo encontramos un registro con el documento ${analysis.extractedInfo.documentNumber}.\n\n🔄 Por favor verifica que el número esté correcto e intenta nuevamente.\n\n📝 Ingresa tu número de documento:`,
          messageId,
          phoneNumberId
        );
        this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
      } else if (searchResult === null) {
        // Múltiples coincidencias
        const matches = this.clientService.findByDocumentNumber(analysis.extractedInfo.documentNumber);
        const documentTypes = matches.map(client => `${client.documentType} (${client.name})`).join(', ');
        
        await this.sendMessageAndLog(
          from,
          `¡Hola! 👋\n\n🔍 **Múltiples registros encontrados**\n\nEncontramos ${matches.length} registros con el documento ${analysis.extractedInfo.documentNumber}:\n\n${documentTypes}\n\nPara continuar, selecciona tu tipo de documento:`,
          messageId,
          phoneNumberId
        );
        
        session.documentNumber = analysis.extractedInfo.documentNumber;
        this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_TYPE);
        await this.sendDocumentTypeMenu(from, messageId, phoneNumberId);
      } else {
        // Una sola coincidencia
        const client = searchResult;
        session.documentType = client.documentType;
        session.documentNumber = analysis.extractedInfo.documentNumber;
        session.clientName = client.name;
        session.email = client.email;
        
        await this.sendMessageAndLog(
          from,
          `¡Hola! 👋\n\n🎉 Te hemos identificado como **${client.name}**.\n\n🔍 Documento: ${client.documentType} ${analysis.extractedInfo.documentNumber}`,
          messageId,
          phoneNumberId
        );
        
        await this.initiateMfaProcess(from, client.name, client.documentType, analysis.extractedInfo.documentNumber, client.email, messageId, phoneNumberId);
      }
    } else {
      // Información insuficiente - flujo normal
      await this.sendPersonalizedWelcomeMessage(from, profile, messageId, phoneNumberId);
    }
  }

  /**
   * Maneja cuando el usuario proporciona información personal directamente
   * 
   * @param from - Número de teléfono del usuario
   * @param analysis - Análisis del mensaje
   * @param profile - Perfil del usuario
   * @param messageId - ID del mensaje
   * @param phoneNumberId - ID del número WhatsApp Business
   */
  private async handleDirectPersonalInfo(from: string, analysis: any, profile: any, messageId: string, phoneNumberId: string): Promise<void> {
    const session = this.sessionManager.getSession(from) || this.sessionManager.createSession(from);
    
    if (analysis.extractedInfo?.documentNumber) {
      // Intentar buscar cliente directamente
      const searchResult = this.clientService.findUniqueByDocumentNumber(analysis.extractedInfo.documentNumber);
      
      if (searchResult === undefined) {
        // Cliente no encontrado
        await this.sendMessageAndLog(
          from,
          `¡Hola! 👋\n\n❌ **Usuario no encontrado**\n\nNo encontramos un registro con el documento ${analysis.extractedInfo.documentNumber}.\n\n🔄 Por favor verifica que el número esté correcto e intenta nuevamente.\n\n📝 Ingresa tu número de documento:`,
          messageId,
          phoneNumberId
        );
        this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
      } else if (searchResult === null) {
        // Múltiples coincidencias
        const matches = this.clientService.findByDocumentNumber(analysis.extractedInfo.documentNumber);
        const documentTypes = matches.map(client => `${client.documentType} (${client.name})`).join(', ');
        
        await this.sendMessageAndLog(
          from,
          `¡Hola! 👋\n\n🔍 **Múltiples registros encontrados**\n\nEncontramos ${matches.length} registros con el documento ${analysis.extractedInfo.documentNumber}:\n\n${documentTypes}\n\nPara continuar, selecciona tu tipo de documento:`,
          messageId,
          phoneNumberId
        );
        
        session.documentNumber = analysis.extractedInfo.documentNumber;
        this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_TYPE);
        await this.sendDocumentTypeMenu(from, messageId, phoneNumberId);
      } else {
        // Una sola coincidencia
        const client = searchResult;
        session.documentType = client.documentType;
        session.documentNumber = analysis.extractedInfo.documentNumber;
        session.clientName = client.name;
        session.email = client.email;
        
        await this.sendMessageAndLog(
          from,
          `¡Hola! 👋\n\n🎉 Te hemos identificado como **${client.name}**.\n\n🔍 Documento: ${client.documentType} ${analysis.extractedInfo.documentNumber}`,
          messageId,
          phoneNumberId
        );
        
        await this.initiateMfaProcess(from, client.name, client.documentType, analysis.extractedInfo.documentNumber, client.email, messageId, phoneNumberId);
      }
    } else {
      // Información insuficiente - flujo normal
      await this.sendPersonalizedWelcomeMessage(from, profile, messageId, phoneNumberId);
    }
  }

  /**
   * Envía mensaje de bienvenida personalizado usando el perfil del usuario
   * 
   * @param from - Número de teléfono del usuario
   * @param profile - Perfil del usuario
   * @param messageId - ID del mensaje
   * @param phoneNumberId - ID del número WhatsApp Business
   */
  private async sendPersonalizedWelcomeMessage(from: string, profile: any, messageId: string, phoneNumberId: string): Promise<void> {
    const welcomeMessage = this.profileService.generateWelcomeMessage(profile);
    await this.sendMessageAndLog(from, welcomeMessage, messageId, phoneNumberId);
    
    // Ir directo a pedir número de documento
    this.sessionManager.updateSessionState(from, SessionState.WAITING_DOCUMENT_NUMBER);
  }
} 