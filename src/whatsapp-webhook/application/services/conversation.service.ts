import { Injectable, Inject, Logger } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { EchoMessageService } from './echo-message.service';
import { ChatTranscriptionService } from './chat-transcription.service';
import { SessionState, IRateLimitService } from '../../domain';
import { IMessageAnalysisService, IWhatsAppProfileService, MessageContext } from '../../domain/interfaces/message-analysis.interface';
import { MessageIntent } from '../../domain/entities/message-intent.entity';

import { SessionWithAllData } from '../../domain/types/session-data.types';

// Servicios de flujo de conversación especializados
import { MfaConversationFlowService } from './mfa-conversation-flow.service';
import { CertificateConversationFlowService } from './certificate-conversation-flow.service';
import { InitialAuthenticationFlowService } from './initial-authentication-flow.service';

/**
 * @fileoverview Servicio Principal de Orquestación de Conversaciones de WhatsApp.
 *
 * @class ConversationService
 * @description
 * Este servicio actúa como el cerebro central para manejar el flujo de las conversaciones
 * de WhatsApp. Delega la lógica detallada de cada parte del flujo a servicios más especializados:
 * - {@link InitialAuthenticationFlowService}: Para el manejo de la bienvenida inicial y la captura/verificación del No. de documento.
 * - {@link MfaConversationFlowService}: Para tod el proceso de autenticación multifactor.
 * - {@link CertificateConversationFlowService}: Para el flujo de solicitud y generación de certificados.
 *
 * Sus responsabilidades principales se limitan a:
 * - Recibir y realizar un análisis inicial del mensaje entrante.
 * - Gestionar la creación y actualización de la actividad de la sesión del usuario.
 * - Enrutar la conversación al servicio de flujo adecuado según si la sesión es nueva o existente y el estado de la misma.
 * - Registrar transcripciones de la conversación.
 * - Gestionar bloqueos por rate limiting a nivel de entrada.
 *
 * @property {Logger} logger - Instancia para el registro de eventos y errores.
 * @property {SessionManagerService} sessionManager - Gestiona sesiones de usuario.
 * @property {EchoMessageService} messageService - Servicio base para enviar mensajes de respuesta (usado para mensajes genéricos o de error del orquestador).
 * @property {ChatTranscriptionService} transcriptionService - Registra los mensajes intercambiados.
 * @property {IRateLimitService} rateLimitService - Gestiona bloqueos por límites de tasa.
 * @property {IMessageAnalysisService} messageAnalysisService - Analiza mensajes para extraer intención/entidades.
 * @property {IWhatsAppProfileService} profileService - Obtiene perfiles de WhatsApp (usado para reseteo de sesión).
 * @property {InitialAuthenticationFlowService} initialAuthenticationFlowService - Maneja flujo inicial de autenticación y bienvenida.
 * @property {MfaConversationFlowService} mfaConversationFlowService - Maneja flujo de MFA.
 * @property {CertificateConversationFlowService} certificateConversationFlowService - Maneja flujo de certificados.
 *
 * @version 2.5.1
 * @since 2024-07-31 (Reintento de delegación a InitialAuthenticationFlowService post-corrección de módulo)
 */
@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly sessionManager: SessionManagerService,
    private readonly messageService: EchoMessageService,
    private readonly transcriptionService: ChatTranscriptionService,
    @Inject('IRateLimitService') private readonly rateLimitService: IRateLimitService,
    @Inject('IMessageAnalysisService') private readonly messageAnalysisService: IMessageAnalysisService,
    @Inject('IWhatsAppProfileService') private readonly profileService: IWhatsAppProfileService,
    private readonly initialAuthenticationFlowService: InitialAuthenticationFlowService,
    private readonly mfaConversationFlowService: MfaConversationFlowService,
    private readonly certificateConversationFlowService: CertificateConversationFlowService,
  ) {}

  /**
   * @public
   * @async
   * @method handleMessage
   * @description Punto de entrada principal para todos los mensajes de WhatsApp entrantes.
   *              Orquesta el procesamiento: chequeo de bloqueo, obtención/creación de sesión, análisis de mensaje,
   *              y delegación al flujo correspondiente (inicial, existente, MFA, certificados).
   *
   * @param {string} from - Número de teléfono del remitente.
   * @param {string} body - Contenido textual del mensaje.
   * @param {string} messageId - ID único del mensaje de WhatsApp.
   * @param {string} phoneNumberId - ID del número de WhatsApp Business.
   * @returns {Promise<void>}
   */
  async handleMessage(from: string, body: string, messageId: string, phoneNumberId: string): Promise<void> {
    this.logger.log(`[${from}] Orchestrator: Received message "${body.substring(0, 50)}..." (MsgID: ${messageId})`);

    const isBlocked = await this.rateLimitService.isPhoneBlocked(from);
    if (isBlocked) {
      this.logger.warn(`[${from}] Orchestrator: Message processing HALTED. User is BLOCKED.`);
      await this.handleBlockedState(from, messageId, phoneNumberId);
      return;
    }

    let session = this.sessionManager.getSession(from) as SessionWithAllData | null;
    const isNewSession = !session;

    if (isNewSession) {
      this.logger.log(`[${from}] Orchestrator: No existing session. Creating new one.`);
      session = this.sessionManager.createSession(from) as SessionWithAllData;
    } else {
      this.sessionManager.updateSessionActivity(from);
      this.logger.log(`[${from}] Orchestrator: Existing session found. State: ${session.state}`);
    }
    
    const currentSession = session;

    const context: MessageContext = {
      sessionState: currentSession.state,
      isFirstInteraction: isNewSession,
      knownUserInfo: {
        name: currentSession.clientName,
        documentNumber: currentSession.documentNumber,
        documentType: currentSession.documentType
      }
    };

    const analysis: any = await this.messageAnalysisService.analyzeMessage(body, context);
    this.logger.verbose(`[${from}] Orchestrator: Message analysis result - Intent: ${analysis.intent}`);
    
    this.transcriptionService.addMessage(from, 'user', body);
    
    if (isNewSession) {
      this.logger.log(`[${from}] Orchestrator: New session. Delegating to InitialAuthenticationFlowService.`);
      await this.initialAuthenticationFlowService.handleNewUserInteraction(from, currentSession, analysis, messageId, phoneNumberId);
    } else {
      this.logger.log(`[${from}] Orchestrator: Existing session. Delegating to handleExistingSession router.`);
      await this.handleExistingSession(from, currentSession, analysis, messageId, phoneNumberId);
    }
  }

  /**
   * @private
   * @async
   * @method sendMessageAndLog
   * @description (Utilidad interna del Orquestador) Envía un mensaje de respuesta y lo registra.
   *              Usado para mensajes que se originan directamente del orquestador (ej. errores genéricos, prompts post-flujo).
   *
   * @param {string} from - Número de teléfono del destinatario.
   * @param {string} message - Contenido del mensaje a enviar.
   * @param {string} messageId - ID del mensaje original al que se responde.
   * @param {string} phoneNumberId - ID del número de WhatsApp Business que envía el mensaje.
   * @returns {Promise<void>}
   */
  private async sendMessageAndLog(from: string, message: string, messageId: string, phoneNumberId: string): Promise<void> {
    try {
      await this.messageService.reply(from, message, messageId, phoneNumberId);
      this.transcriptionService.addMessage(from, 'system', message);
      this.logger.debug(`[${from}] Orchestrator: Sent system message: "${message.substring(0, 70)}..."`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${from}] Orchestrator: Failed to send message. Error: ${errorMessage}`);
      this.transcriptionService.addMessage(from, 'system', `[System Error - Orchestrator] Reply failed.`);
    }
  }

  /**
   * @private
   * @async
   * @method handleBlockedState
   * @description (Utilidad del Orquestador) Maneja la situación cuando un usuario está bloqueado.
   *              Envía un mensaje informativo al usuario sobre el estado de bloqueo.
   *
   * @param {string} from - Número de teléfono del usuario bloqueado.
   * @param {string} messageId - ID del mensaje original de WhatsApp.
   * @param {string} phoneNumberId - ID del número de WhatsApp Business.
   * @returns {Promise<void>}
   */
  private async handleBlockedState(from: string, messageId: string, phoneNumberId: string): Promise<void> {
    const blacklistedInfo = await this.rateLimitService.getBlacklistedPhone(from);
    let blockDetail = "Razón no especificada.";
    if (blacklistedInfo?.reason) {
      blockDetail = `Razón: ${blacklistedInfo.reason}.`;
    }
    let blockMessage = blacklistedInfo?.expiresAt 
      ? `🚫 Tu número (${from}) está temporalmente bloqueado hasta ${new Date(blacklistedInfo.expiresAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}.\n${blockDetail}`
      : `🚫 Tu número (${from}) está permanentemente bloqueado.\n${blockDetail}`;
    blockMessage += "\n\nSi consideras que esto es un error, por favor contacta a Recursos Humanos o al departamento de TI.";
    
    this.logger.warn(`[${from}] Orchestrator: Informing user of BLOCKED state. Details: ${JSON.stringify(blacklistedInfo || {})}`);
    await this.messageService.reply(from, blockMessage, messageId, phoneNumberId);
  }

  /**
   * @private
   * @async
   * @method handleExistingSession
   * @description (Enrutador del Orquestador) Gestiona los mensajes de un usuario con sesión activa.
   *              Enruta la conversación al servicio de flujo apropiado (Inicial, MFA, Certificados)
   *              basándose en el estado actual de la sesión. También maneja acciones post-flujo
   *              y el reseteo de sesión en caso de estados desconocidos.
   *
   * @param {string} from - Número de teléfono del usuario.
   * @param {SessionWithAllData} session - La sesión existente del usuario.
   * @param {any} analysis - Resultado del análisis del mensaje actual (tipo `any`).
   * @param {string} messageId - ID del mensaje original de WhatsApp.
   * @param {string} phoneNumberId - ID del número de WhatsApp Business.
   * @returns {Promise<void>}
   */
  private async handleExistingSession(from: string, session: SessionWithAllData, analysis: any, messageId: string, phoneNumberId: string): Promise<void> {
    this.logger.log(`[${from}] Orchestrator Router: Current state ${session.state}. Input: "${analysis.originalMessage?.substring(0,50)}...", Intent: ${analysis.intent}`);

    const onSubFlowCompletedAndAuthenticated = async () => {
      this.logger.log(`[${from}] Orchestrator: A sub-flow (e.g., certificate) completed. User is AUTHENTICATED. Prompting for next action.`);
      await this.sendMessageAndLog(from, '¿Hay algo más en lo que te pueda ayudar hoy? Escribe "certificado" para una nueva solicitud o "finalizar" para terminar.', messageId, phoneNumberId);
    };

    switch (session.state) {
      case SessionState.WAITING_DOCUMENT_NUMBER:
        this.logger.log(`[${from}] Orchestrator Router: State WAITING_DOCUMENT_NUMBER. Delegating to InitialAuthenticationFlowService.`);
        await this.initialAuthenticationFlowService.processDocumentNumberInput(from, analysis.originalMessage, messageId, phoneNumberId, session);
        break;
      
      case SessionState.WAITING_MFA_VERIFICATION:
        this.logger.log(`[${from}] Orchestrator Router: State WAITING_MFA_VERIFICATION. Delegating to MfaConversationFlowService.`);
        await this.mfaConversationFlowService.handleMfaVerification(
          from, 
          analysis.originalMessage, 
          messageId, 
          phoneNumberId,
          async () => { 
            this.logger.log(`[${from}] Orchestrator: MFA successful callback. Transitioning to certificate menu.`);
            await this.certificateConversationFlowService.showCertificateMenu(from, messageId, phoneNumberId);
          }
        );
        break;
      
      case SessionState.AUTHENTICATED:
        this.logger.log(`[${from}] Orchestrator Router: State AUTHENTICATED. Analyzing intent: ${analysis.intent}`);
        if (analysis.intent === MessageIntent.REQUEST_CERTIFICATE || analysis.originalMessage?.toLowerCase().includes('certificado')) {
            this.logger.log(`[${from}] Orchestrator: Authenticated user certificate request. Delegating to CertificateConversationFlowService.`);
            await this.certificateConversationFlowService.showCertificateMenu(from, messageId, phoneNumberId);
        } else if (analysis.originalMessage?.toLowerCase().includes('finalizar')) {
            this.logger.log(`[${from}] Orchestrator: Authenticated user requested session termination.`);
            this.sessionManager.clearSession(from);
            this.transcriptionService.clearConversation(from);
            await this.sendMessageAndLog(from, 'Sesión finalizada. ¡Gracias por usar nuestros servicios! 👋', messageId, phoneNumberId);
        } else {
            this.logger.log(`[${from}] Orchestrator: Authenticated user unhandled message. Prompting action.`);
            await this.sendMessageAndLog(from, 'Estoy listo para ayudarte. Puedes escribir "certificado" para solicitar un certificado laboral o "finalizar" para terminar.', messageId, phoneNumberId);
        }
        break;

      case SessionState.WAITING_CERTIFICATE_TYPE:
      case SessionState.WAITING_FUNCTION_DETAIL_CHOICE:
        this.logger.log(`[${from}] Orchestrator Router: State ${session.state}. Delegating to CertificateConversationFlowService for menu selection.`);
        await this.certificateConversationFlowService.handleMenuSelection(
          from,
          analysis.originalMessage,
          messageId,
          phoneNumberId,
          onSubFlowCompletedAndAuthenticated
        );
        break;
      
      case SessionState.BLOCKED:
      case SessionState.RATE_LIMITED:
        this.logger.warn(`[${from}] Orchestrator Router: Re-handling BLOCKED/RATE_LIMITED state.`);
        await this.handleBlockedState(from, messageId, phoneNumberId);
        break;
      
      default:
        this.logger.error(`[${from}] Orchestrator Router: Unhandled or unknown session state: "${session.state}". Resetting session.`);
        this.sessionManager.clearSession(from);
        const newSessionForReset = this.sessionManager.createSession(from);
        this.logger.log(`[${from}] Orchestrator: Session reset. Delegating to InitialAuthenticationFlowService for new interaction.`);
        await this.initialAuthenticationFlowService.handleNewUserInteraction(from, newSessionForReset, analysis, messageId, phoneNumberId);
        break;
    }
  }
} 