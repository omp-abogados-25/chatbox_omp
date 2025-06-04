import { Injectable } from '@nestjs/common';
import { Session, SessionState } from '../../domain';

@Injectable()
export class SessionManagerService {
  private readonly sessions = new Map<string, Session>();
  private readonly SESSION_TIMEOUT_MINUTES = 10;

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
    session.timeoutId = setTimeout(() => {
      console.log(`⏰ Sesión expirada para ${session.phoneNumber}`);
      this.clearSession(session.phoneNumber);
    }, this.SESSION_TIMEOUT_MINUTES * 60 * 1000);
  }

  private clearSessionTimeout(session: Session): void {
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
      session.timeoutId = undefined;
    }
  }
} 