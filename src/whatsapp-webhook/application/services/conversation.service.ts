import { Injectable, Inject, Logger } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { EchoMessageService } from './echo-message.service';
import { ChatTranscriptionService } from './chat-transcription.service';
import { SessionState, IRateLimitService } from '../../domain';
import { IMessageAnalysisService, IWhatsAppProfileService, MessageContext } from '../../domain/interfaces/message-analysis.interface';
import { MessageIntent } from '../../domain/entities/message-intent.entity';

import { SessionWithAllData } from '../../domain/types/session-data.types';
import { formatDateForColombia } from '../../../utils/timezone.utils';

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

    const isBlocked = await this.rateLimitService.isPhoneBlocked(from);
    if (isBlocked) {
      await this.handleBlockedState(from, messageId, phoneNumberId);
      return;
    }

    let session = this.sessionManager.getSession(from) as SessionWithAllData | null;
    const isNewSession = !session;

    if (isNewSession) {
      session = this.sessionManager.createSession(from) as SessionWithAllData;
    } else {
      this.sessionManager.updateSessionActivity(from);
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
    
    this.transcriptionService.addMessage(from, 'user', body);
    
    if (isNewSession) {
      await this.initialAuthenticationFlowService.handleNewUserInteraction(from, currentSession, analysis, messageId, phoneNumberId);
    } else {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
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
      ? `🚫 Tu número (${from}) está temporalmente bloqueado hasta ${formatDateForColombia(new Date(blacklistedInfo.expiresAt))}.\n${blockDetail}`
      : `🚫 Tu número (${from}) está permanentemente bloqueado.\n${blockDetail}`;
    blockMessage += "\n\nSi consideras que esto es un error, por favor contacta a Recursos Humanos o al departamento de TI.";
    
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

    const onSubFlowCompletedAndAuthenticated = async () => {
      await this.sendMessageAndLog(from, '¿Necesitas algo más? Puedes solicitar otro certificado o finalizar la conversación.', messageId, phoneNumberId);
    };

    switch (session.state) {
      case SessionState.WAITING_DOCUMENT_NUMBER:
        await this.initialAuthenticationFlowService.processDocumentNumberInput(from, analysis.originalMessage, messageId, phoneNumberId, session);
        break;
      
      case SessionState.WAITING_MFA_VERIFICATION:
        await this.mfaConversationFlowService.handleMfaVerification(
          from, 
          analysis.originalMessage, 
          messageId, 
          phoneNumberId,
          async () => { 
            await this.certificateConversationFlowService.showCertificateMenu(from, messageId, phoneNumberId);
          }
        );
        break;
      
      case SessionState.AUTHENTICATED:
        if (analysis.intent === MessageIntent.REQUEST_CERTIFICATE || analysis.originalMessage?.toLowerCase().includes('certificado')) {
            await this.certificateConversationFlowService.showCertificateMenu(from, messageId, phoneNumberId);
        } else if (analysis.originalMessage?.toLowerCase().includes('finalizar')) {
            this.sessionManager.clearSession(from);
            this.transcriptionService.clearConversation(from);
            await this.sendMessageAndLog(from, 'Sesión finalizada. ¡Gracias por usar nuestros servicios! 👋', messageId, phoneNumberId);
        } else {
            await this.sendMessageAndLog(from, '¿Necesitas algo más? Puedes solicitar otro certificado escribiendo "certificado" o "finalizar" para terminar.', messageId, phoneNumberId);
        }
        break;

      case SessionState.WAITING_CERTIFICATE_TYPE:
        await this.certificateConversationFlowService.handleMenuSelection(
          from,
          analysis.originalMessage,
          messageId,
          phoneNumberId,
          onSubFlowCompletedAndAuthenticated
        );
        break;
      
      case SessionState.WAITING_FINAL_ACTION:
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
        await this.handleBlockedState(from, messageId, phoneNumberId);
        break;
      
      default:
        this.sessionManager.clearSession(from);
        const newSessionForReset = this.sessionManager.createSession(from);
        await this.initialAuthenticationFlowService.handleNewUserInteraction(from, newSessionForReset, analysis, messageId, phoneNumberId);
        break;
    }
  }
} 