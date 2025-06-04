import { SessionState } from '../enums/session-state.enum';
import { CertificateType } from './message-intent.entity';

export enum DocumentType {
  CC = 'Cedula de Ciudadanía', // Cédula de Ciudadanía
  TI = 'Tarjeta de Identidad', // Tarjeta de Identidad
  CE = 'Cedula de Extranjería', // Cédula de Extranjería
  PP = 'Pasaporte', // Pasaporte
}

export class Session {
  constructor(
    public readonly phoneNumber: string,
    public state: SessionState = SessionState.WAITING_DOCUMENT_TYPE,
    public documentType?: DocumentType,
    public documentNumber?: string,
    public clientName?: string,
    public createdAt: Date = new Date(),
    public lastActivity: Date = new Date(),
    public timeoutId?: NodeJS.Timeout,
    public mfaSessionId?: string,
    public email?: string,
    public certificateType?: CertificateType,
  ) {}

  updateActivity(): void {
    this.lastActivity = new Date();
  }

  isExpired(timeoutMinutes: number = 10): boolean {
    const now = new Date();
    const diffMinutes = (now.getTime() - this.lastActivity.getTime()) / (1000 * 60);
    return diffMinutes > timeoutMinutes;
  }
} 