import { Injectable, Inject, Logger } from '@nestjs/common';
import { Session, SessionState, IWhatsappClient, SessionTrace, SessionTraceStatus } from '../../domain';
import { SessionTraceService } from './session-trace.service';
import { randomUUID } from 'crypto';

@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);
  private readonly sessions = new Map<string, Session>();
  private readonly SESSION_TIMEOUT_MINUTES = 5;

  constructor(
    @Inject('IWhatsappClient') private readonly whatsappClient: IWhatsappClient,
    private readonly sessionTraceService: SessionTraceService,
  ) {}

  createSession(phoneNumber: string): Session {
    // Limpiar sesión anterior si existe
    this.clearSession(phoneNumber);
    
    const session = new Session(phoneNumber);
    this.sessions.set(phoneNumber, session);
    
    // Configurar timeout
    this.setSessionTimeout(session);
    
    // 🔥 CREAR TRAZA DE SESIÓN INICIADA con UUID único
    const sessionId = randomUUID();
    this.sessionTraceService.startSessionTrace(phoneNumber, sessionId)
      .catch(error => {
        this.logger.error(`❌ Error al crear traza de sesión para ${phoneNumber}:`, error);
      });
    
    return session;
  }

  getSession(phoneNumber: string): Session | undefined {
    const session = this.sessions.get(phoneNumber);
    
    if (session && session.isExpired(this.SESSION_TIMEOUT_MINUTES)) {
      this.clearSession(phoneNumber);
      return undefined;
    }
    
    return session;
  }

  updateSessionActivity(phoneNumber: string): void {
    const session = this.sessions.get(phoneNumber);
    if (session) {
      session.updateActivity();
      // Resetear timeout
      this.clearSessionTimeout(session);
      this.setSessionTimeout(session);
    }
  }

  updateSessionState(phoneNumber: string, state: SessionState): void {
    const session = this.sessions.get(phoneNumber);
    if (session) {
      session.state = state;
      session.updateActivity();
    }
  }

  clearSession(phoneNumber: string, reason: string = 'Sesión finalizada'): void {
    const session = this.sessions.get(phoneNumber);
    if (session) {
      this.clearSessionTimeout(session);
      this.sessions.delete(phoneNumber);
      
      // 🔥 FINALIZAR TRAZA DE SESIÓN
      this.sessionTraceService.finishSession(phoneNumber, reason)
        .catch(error => {
          this.logger.error(`❌ Error al finalizar traza de sesión para ${phoneNumber}:`, error);
        });
    }
  }

  private setSessionTimeout(session: Session): void {
    session.timeoutId = setTimeout(async () => {
      
      // 🔥 MARCAR SESIÓN COMO EXPIRADA EN LA TRAZA
      await this.sessionTraceService.markSessionExpired(
        session.phoneNumber, 
        'Sesión expirada por inactividad (5 minutos sin respuesta)'
      ).catch(error => {
        this.logger.error(`❌ Error al marcar sesión como expirada:`, error);
      });
      
      // Enviar mensaje de despedida antes de cerrar sesión
      await this.sendInactivityMessage(session.phoneNumber);
      
      // Limpiar sesión (sin crear otra traza porque ya se marcó como expirada)
      const sessionData = this.sessions.get(session.phoneNumber);
      if (sessionData) {
        this.clearSessionTimeout(sessionData);
        this.sessions.delete(session.phoneNumber);
      }
    }, this.SESSION_TIMEOUT_MINUTES * 60 * 1000);
  }

  private clearSessionTimeout(session: Session): void {
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
      session.timeoutId = undefined;
    }
  }

  private async sendInactivityMessage(phoneNumber: string): Promise<void> {
    try {
      const inactivityMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        text: { 
          body: `⏰ Tu sesión ha expirado por inactividad (5 minutos sin respuesta).

¡Hasta luego! 👋 

Si necesitas un certificado más tarde, simplemente envía un mensaje para iniciar una nueva sesión.` 
        }
      };

      await this.whatsappClient.sendMessage(inactivityMessage);
      this.logger.log(`✅ Mensaje de inactividad enviado a ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando mensaje de inactividad a ${phoneNumber}:`, error);
    }
  }
} 