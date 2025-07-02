import { PasswordResetSession } from '../entities/password-reset-session.entity';

export interface IPasswordResetService {
  generateTotpSecret(): string;
  generateTotpCode(secret: string): string;
  verifyTotpCode(secret: string, token: string): boolean;
  createPasswordResetSession(email: string): Promise<PasswordResetSession>;
  getPasswordResetSession(sessionId: string): Promise<PasswordResetSession | null>;
  verifyPasswordResetSession(sessionId: string, totpCode: string): Promise<boolean>;
  invalidatePasswordResetSession(sessionId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
}

export interface IPasswordResetEmailService {
  sendPasswordResetCode(email: string, totpCode: string, userName: string, expiresIn: number): Promise<boolean>;
}

export interface IUserActivationService {
  createActivationSession(userIds: string[]): Promise<UserActivationSession[]>;
  verifyActivationSession(sessionId: string, code: string): Promise<boolean>;
  getActivationSession(sessionId: string): Promise<UserActivationSession | null>;
  invalidateActivationSession(sessionId: string): Promise<void>;
}

export interface IUserActivationEmailService {
  sendActivationCode(
    email: string, 
    code: string, 
    fullName: string, 
    expiresInMinutes: number
  ): Promise<boolean>;
}

export interface UserActivationSession {
  id: string;
  userId: string;
  email: string;
  totpCode: string;
  isVerified: boolean;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
} 