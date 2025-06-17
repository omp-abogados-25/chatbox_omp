import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { IMfaService } from '../../domain/interfaces/mfa.interface';
import { MfaSession } from '../../domain/entities/mfa-session.entity';
import { getRedisConfig } from '../config/redis.config';

@Injectable()
export class MfaService implements IMfaService {
  private readonly logger = new Logger(MfaService.name);
  private redis: Redis;
  private readonly MFA_SESSION_TTL = 600; // 10 minutos
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
      this.logger.log('Connected to Redis for MFA service');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  generateTotpSecret(): string {
    // Generar un secreto único y seguro de 32 caracteres
    return speakeasy.generateSecret({
      name: 'WhatsApp Certificados',
      issuer: 'Sistema Certificados Laborales',
      length: 32,
    }).base32;
  }

  generateTotpCode(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000),
      step: 300, // 5 minutos de validez
      digits: 6,
    });
  }

  verifyTotpCode(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      step: 300, // 5 minutos de validez
      window: 1, // Permitir 1 step de tolerancia
    });
  }

  async createMfaSession(
    phoneNumber: string,
    documentNumber: string,
    documentType: string,
    email?: string
  ): Promise<MfaSession> {
    try {
      const sessionId = uuidv4();
      const totpSecret = this.generateTotpSecret();
      const totpCode = this.generateTotpCode(totpSecret);
      
      const session: MfaSession = {
        id: sessionId,
        phoneNumber,
        documentNumber,
        documentType,
        totpSecret,
        totpCode,
        isVerified: false,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.MFA_SESSION_TTL * 1000),
        email,
      };

      // Guardar en Redis con TTL
      await this.redis.setex(
        `mfa_session:${sessionId}`,
        this.MFA_SESSION_TTL,
        JSON.stringify(session)
      );

      // También indexar por teléfono para evitar múltiples sesiones
      await this.redis.setex(
        `mfa_phone:${phoneNumber}`,
        this.MFA_SESSION_TTL,
        sessionId
      );

      return session;
    } catch (error) {
      this.logger.error(`Failed to create MFA session for ${phoneNumber}:`, error);
      throw error;
    }
  }

  async getMfaSession(sessionId: string): Promise<MfaSession | null> {
    try {
      const sessionData = await this.redis.get(`mfa_session:${sessionId}`);
      if (!sessionData) {
        return null;
      }

      const session: MfaSession = JSON.parse(sessionData);
      
      // Verificar si la sesión ha expirado
      if (new Date() > new Date(session.expiresAt)) {
        await this.invalidateMfaSession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      this.logger.error(`Failed to get MFA session ${sessionId}:`, error);
      return null;
    }
  }

  async verifyMfaSession(sessionId: string, totpCode: string): Promise<boolean> {
    try {
      const session = await this.getMfaSession(sessionId);
      if (!session) {
        this.logger.warn(`MFA session not found: ${sessionId}`);
        return false;
      }

      // Verificar si ya se agotaron los intentos
      if (session.attempts >= session.maxAttempts) {
        this.logger.warn(`Max attempts reached for MFA session: ${sessionId}`);
        await this.invalidateMfaSession(sessionId);
        return false;
      }

      // Incrementar intentos
      session.attempts++;

      // Verificar el código TOTP
      const isValid = this.verifyTotpCode(session.totpSecret, totpCode);

      if (isValid) {
        session.isVerified = true;
        this.logger.log(`MFA verification successful for session: ${sessionId}`);
      } else {
        this.logger.warn(`Invalid TOTP code for session: ${sessionId}, attempt: ${session.attempts}`);
      }

      // Actualizar la sesión en Redis
      await this.redis.setex(
        `mfa_session:${sessionId}`,
        this.MFA_SESSION_TTL,
        JSON.stringify(session)
      );

      // Si se agotaron los intentos, invalidar la sesión
      if (session.attempts >= session.maxAttempts && !isValid) {
        await this.invalidateMfaSession(sessionId);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Failed to verify MFA session ${sessionId}:`, error);
      return false;
    }
  }

  async invalidateMfaSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getMfaSession(sessionId);
      if (session) {
        // Eliminar tanto la sesión como el índice por teléfono
        await this.redis.del(`mfa_session:${sessionId}`);
        await this.redis.del(`mfa_phone:${session.phoneNumber}`);
        this.logger.log(`MFA session invalidated: ${sessionId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate MFA session ${sessionId}:`, error);
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      // No se necesita implementación para Redis
    } catch (error) {
      this.logger.error('Failed to cleanup expired MFA sessions:', error);
    }
  }

  async getSessionByPhone(phoneNumber: string): Promise<string | null> {
    try {
      return await this.redis.get(`mfa_phone:${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Failed to get session by phone ${phoneNumber}:`, error);
      return null;
    }
  }
} 