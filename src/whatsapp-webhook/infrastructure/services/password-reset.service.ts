import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import { IPasswordResetService } from '../../domain/interfaces/password-reset.interface';
import { PasswordResetSession } from '../../domain/entities/password-reset-session.entity';
import { getRedisConfig } from '../config/redis.config';

@Injectable()
export class PasswordResetService implements IPasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private redis: Redis;
  private readonly PASSWORD_RESET_SESSION_TTL = 600; // 10 minutos
  private readonly MAX_ATTEMPTS = 3;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const config = getRedisConfig();
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix,
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis for Password Reset service');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  generateTotpSecret(): string {
    return speakeasy.generateSecret({
      name: 'OMP Abogados - Reset Password',
      issuer: 'Sistema de Gestión de Usuarios',
      length: 32,
    }).base32;
  }

  generateTotpCode(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000),
      step: 600, // 10 minutos de validez
      digits: 6,
    });
  }

  verifyTotpCode(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      step: 600, // 10 minutos de validez
      window: 1, // Permitir 1 step de tolerancia
    });
  }

  async createPasswordResetSession(email: string): Promise<PasswordResetSession> {
    try {
      // Verificar si ya existe una sesión activa para este email
      const existingSessionId = await this.redis.get(`password_reset_email:${email}`);
      if (existingSessionId) {
        // Invalidar la sesión anterior
        await this.invalidatePasswordResetSession(existingSessionId);
      }

      const sessionId = uuidv4();
      const totpSecret = this.generateTotpSecret();
      const totpCode = this.generateTotpCode(totpSecret);
      
      const session: PasswordResetSession = {
        id: sessionId,
        email,
        totpSecret,
        totpCode,
        isVerified: false,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.PASSWORD_RESET_SESSION_TTL * 1000),
      };

      // Guardar en Redis con TTL
      await this.redis.setex(
        `password_reset_session:${sessionId}`,
        this.PASSWORD_RESET_SESSION_TTL,
        JSON.stringify(session)
      );

      // También indexar por email para evitar múltiples sesiones
      await this.redis.setex(
        `password_reset_email:${email}`,
        this.PASSWORD_RESET_SESSION_TTL,
        sessionId
      );

      this.logger.log(`Password reset session created for email: ${email}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create password reset session for ${email}:`, error);
      throw error;
    }
  }

  async getPasswordResetSession(sessionId: string): Promise<PasswordResetSession | null> {
    try {
      const sessionData = await this.redis.get(`password_reset_session:${sessionId}`);
      if (!sessionData) {
        return null;
      }

      const session: PasswordResetSession = JSON.parse(sessionData);
      
      // Verificar si la sesión ha expirado
      if (new Date() > new Date(session.expiresAt)) {
        await this.invalidatePasswordResetSession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      this.logger.error(`Failed to get password reset session ${sessionId}:`, error);
      return null;
    }
  }

  async verifyPasswordResetSession(sessionId: string, totpCode: string): Promise<boolean> {
    try {
      const session = await this.getPasswordResetSession(sessionId);
      if (!session) {
        this.logger.warn(`Password reset session not found: ${sessionId}`);
        return false;
      }

      // Verificar si ya se agotaron los intentos
      if (session.attempts >= session.maxAttempts) {
        this.logger.warn(`Max attempts reached for password reset session: ${sessionId}`);
        await this.invalidatePasswordResetSession(sessionId);
        return false;
      }

      // Incrementar intentos
      session.attempts++;

      // Verificar el código TOTP
      const isValid = this.verifyTotpCode(session.totpSecret, totpCode);

      if (isValid) {
        session.isVerified = true;
        this.logger.log(`Password reset verification successful for session: ${sessionId}`);
      } else {
        this.logger.warn(`Invalid TOTP code for password reset session: ${sessionId}, attempt: ${session.attempts}`);
      }

      // Actualizar la sesión en Redis
      await this.redis.setex(
        `password_reset_session:${sessionId}`,
        this.PASSWORD_RESET_SESSION_TTL,
        JSON.stringify(session)
      );

      // Si se agotaron los intentos, invalidar la sesión
      if (session.attempts >= session.maxAttempts && !isValid) {
        await this.invalidatePasswordResetSession(sessionId);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Failed to verify password reset session ${sessionId}:`, error);
      return false;
    }
  }

  async invalidatePasswordResetSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getPasswordResetSession(sessionId);
      if (session) {
        // Eliminar tanto la sesión como el índice por email
        await this.redis.del(`password_reset_session:${sessionId}`);
        await this.redis.del(`password_reset_email:${session.email}`);
        this.logger.log(`Password reset session invalidated: ${sessionId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate password reset session ${sessionId}:`, error);
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      // Esta función puede implementarse para limpiar sesiones expiradas
      // Redis ya maneja la expiración automáticamente con TTL
      this.logger.log('Password reset session cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup expired password reset sessions:', error);
    }
  }

  async getSessionByEmail(email: string): Promise<string | null> {
    try {
      return await this.redis.get(`password_reset_email:${email}`);
    } catch (error) {
      this.logger.error(`Failed to get session by email ${email}:`, error);
      return null;
    }
  }
} 