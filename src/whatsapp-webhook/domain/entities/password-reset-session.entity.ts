export interface PasswordResetSession {
  id: string;
  email: string;
  totpSecret: string;
  totpCode: string;
  isVerified: boolean;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  expiresAt: Date;
} 