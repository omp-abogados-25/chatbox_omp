export interface MfaSession {
  id: string;
  phoneNumber: string;
  documentNumber: string;
  documentType: string;
  totpSecret: string;
  totpCode: string;
  isVerified: boolean;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  expiresAt: Date;
  email?: string;
  clientName?: string;
}

export interface BlacklistedPhone {
  phoneNumber: string;
  reason: string;
  blockedAt: Date;
  expiresAt?: Date;
  attempts: number;
}

export interface RateLimitInfo {
  phoneNumber: string;
  requestCount: number;
  windowStart: Date;
  isBlocked: boolean;
  blockExpiresAt?: Date;
} 