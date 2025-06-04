import { MfaSession, BlacklistedPhone, RateLimitInfo } from '../entities/mfa-session.entity';

export interface IMfaService {
  generateTotpSecret(): string;
  generateTotpCode(secret: string): string;
  verifyTotpCode(secret: string, token: string): boolean;
  createMfaSession(phoneNumber: string, documentNumber: string, documentType: string, email?: string): Promise<MfaSession>;
  getMfaSession(sessionId: string): Promise<MfaSession | null>;
  verifyMfaSession(sessionId: string, totpCode: string): Promise<boolean>;
  invalidateMfaSession(sessionId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
}

export interface IRateLimitService {
  checkRateLimit(phoneNumber: string): Promise<RateLimitInfo>;
  incrementRequestCount(phoneNumber: string): Promise<void>;
  blockPhoneNumber(phoneNumber: string, reason: string, duration?: number): Promise<void>;
  isPhoneBlocked(phoneNumber: string): Promise<boolean>;
  getBlacklistedPhone(phoneNumber: string): Promise<BlacklistedPhone | null>;
  unblockPhoneNumber(phoneNumber: string): Promise<void>;
  cleanupExpiredBlocks(): Promise<void>;
}

export interface IMfaEmailService {
  sendTotpCode(email: string, totpCode: string, clientName: string, expiresIn: number): Promise<boolean>;
} 