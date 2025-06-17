import { Injectable, Inject, Logger } from '@nestjs/common';
import { Session, SessionState, IWhatsappClient } from '../../domain';

@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);
  private readonly sessions = new Map<string, Session>();
  private readonly SESSION_TIMEOUT_MINUTES = 5;

  constructor(
    @Inject('IWhatsappClient') private readonly whatsappClient: IWhatsappClient,
  ) {}

  createSession(phoneNumber: string): Session {
    // Limpiar sesión anterior si existe
    this.clearSession(phoneNumber);
    
    const session = new Session(phoneNumber);
    this.sessions.set(phoneNumber, session);
    
    // Configurar timeout
    this.setSessionTimeout(session);
    
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

  clearSession(phoneNumber: string): void {
    const session = this.sessions.get(phoneNumber);
    if (session) {
      this.clearSessionTimeout(session);
      this.sessions.delete(phoneNumber);
    }
  }

  private setSessionTimeout(session: Session): void {
    session.timeoutId = setTimeout(async () => {
      
      // Enviar mensaje de despedida antes de cerrar sesión
      await this.sendInactivityMessage(session.phoneNumber);
      
      // Limpiar sesión
      this.clearSession(session.phoneNumber);
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