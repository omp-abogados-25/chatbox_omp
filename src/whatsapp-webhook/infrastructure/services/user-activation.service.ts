import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';
import { 
  IUserActivationService, 
  UserActivationSession 
} from '../../domain/interfaces/password-reset.interface';
import { getRedisConfig } from '../config/redis.config';

@Injectable()
export class UserActivationService implements IUserActivationService {
  private readonly logger = new Logger(UserActivationService.name);
  private redis: Redis;
  private readonly ACTIVATION_PREFIX = 'user_activation:';
  private readonly TOTP_EXPIRY_MINUTES = 10;
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
      this.logger.log('Connected to Redis for User Activation service');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  async createActivationSession(userIds: string[]): Promise<UserActivationSession[]> {
    try {
      const sessions: UserActivationSession[] = [];
      
      for (const userId of userIds) {
        // Generar código TOTP de 6 dígitos
        const totpCode = crypto.randomInt(100000, 999999).toString();
        
        // Generar ID único para la sesión
        const sessionId = crypto.randomUUID();
        
        const session: UserActivationSession = {
          id: sessionId,
          userId,
          email: '', // Se completará en el controlador
          totpCode,
          isVerified: false,
          attempts: 0,
          expiresAt: new Date(Date.now() + this.TOTP_EXPIRY_MINUTES * 60 * 1000),
          createdAt: new Date(),
        };

        // Guardar en Redis con TTL
        const key = `${this.ACTIVATION_PREFIX}${sessionId}`;
        await this.redis.setex(
          key,
          this.TOTP_EXPIRY_MINUTES * 60,
          JSON.stringify(session)
        );

        sessions.push(session);
        this.logger.log(`User activation session created for user: ${userId}`);
      }

      return sessions;
    } catch (error) {
      this.logger.error('Error creating user activation sessions:', error);
      throw error;
    }
  }

  async verifyActivationSession(sessionId: string, code: string): Promise<boolean> {
    try {
      const key = `${this.ACTIVATION_PREFIX}${sessionId}`;
      const sessionData = await this.redis.get(key);

      if (!sessionData) {
        this.logger.warn(`Activation session not found: ${sessionId}`);
        return false;
      }

      const session: UserActivationSession = JSON.parse(sessionData);

      // Verificar si la sesión ha expirado
      if (new Date() > new Date(session.expiresAt)) {
        this.logger.warn(`Activation session expired: ${sessionId}`);
        await this.redis.del(key);
        return false;
      }

      // Verificar número de intentos
      if (session.attempts >= this.MAX_ATTEMPTS) {
        this.logger.warn(`Max attempts reached for activation session: ${sessionId}`);
        await this.redis.del(key);
        return false;
      }

      // Incrementar intentos
      session.attempts++;

      // Verificar código
      if (session.totpCode !== code) {
        // Actualizar sesión con nuevo número de intentos
        await this.redis.setex(
          key,
          Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)),
          JSON.stringify(session)
        );
        
        this.logger.warn(`Invalid activation code for session: ${sessionId}`);
        return false;
      }

      // Código válido - marcar como verificado
      session.isVerified = true;
      await this.redis.setex(
        key,
        Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)),
        JSON.stringify(session)
      );

      this.logger.log(`Activation code verified successfully for session: ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error verifying activation session ${sessionId}:`, error);
      return false;
    }
  }

  async getActivationSession(sessionId: string): Promise<UserActivationSession | null> {
    try {
      const key = `${this.ACTIVATION_PREFIX}${sessionId}`;
      const sessionData = await this.redis.get(key);

      if (!sessionData) {
        return null;
      }

      const session: UserActivationSession = JSON.parse(sessionData);

      // Verificar si la sesión ha expirado
      if (new Date() > new Date(session.expiresAt)) {
        await this.redis.del(key);
        return null;
      }

      return session;
    } catch (error) {
      this.logger.error(`Error getting activation session ${sessionId}:`, error);
      return null;
    }
  }

  async invalidateActivationSession(sessionId: string): Promise<void> {
    try {
      const key = `${this.ACTIVATION_PREFIX}${sessionId}`;
      await this.redis.del(key);
      this.logger.log(`Activation session invalidated: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error invalidating activation session ${sessionId}:`, error);
      throw error;
    }
  }
} 