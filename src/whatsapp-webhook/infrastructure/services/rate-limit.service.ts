import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { IRateLimitService } from '../../domain/interfaces/mfa.interface';
import { RateLimitInfo, BlacklistedPhone } from '../../domain/entities/mfa-session.entity';
import { getRedisConfig } from '../config/redis.config';

@Injectable()
export class RateLimitService implements IRateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private redis: Redis;
  
  // Configuración de rate limiting
  private readonly RATE_LIMIT_WINDOW = 300; // 5 minutos
  private readonly MAX_REQUESTS_PER_WINDOW = 5; // 5 solicitudes por ventana
  private readonly BLOCK_DURATION = 3600; // 1 hora de bloqueo
  private readonly PERMANENT_BLOCK_THRESHOLD = 3; // 3 bloqueos = bloqueo permanente

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
      this.logger.log('Connected to Redis for Rate Limit service');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  async checkRateLimit(phoneNumber: string): Promise<RateLimitInfo> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW * 1000);
      
      // Verificar si está en lista negra
      const isBlocked = await this.isPhoneBlocked(phoneNumber);
      if (isBlocked) {
        const blacklistedInfo = await this.getBlacklistedPhone(phoneNumber);
        return {
          phoneNumber,
          requestCount: this.MAX_REQUESTS_PER_WINDOW + 1,
          windowStart,
          isBlocked: true,
          blockExpiresAt: blacklistedInfo?.expiresAt,
        };
      }

      // Obtener contador actual
      const key = `rate_limit:${phoneNumber}`;
      const currentCount = await this.redis.get(key);
      const requestCount = currentCount ? parseInt(currentCount) : 0;

      return {
        phoneNumber,
        requestCount,
        windowStart,
        isBlocked: requestCount >= this.MAX_REQUESTS_PER_WINDOW,
        blockExpiresAt: requestCount >= this.MAX_REQUESTS_PER_WINDOW 
          ? new Date(now.getTime() + this.BLOCK_DURATION * 1000) 
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to check rate limit for ${phoneNumber}:`, error);
      // En caso de error, permitir la solicitud pero logear
      return {
        phoneNumber,
        requestCount: 0,
        windowStart: new Date(),
        isBlocked: false,
      };
    }
  }

  async incrementRequestCount(phoneNumber: string): Promise<void> {
    try {
      const key = `rate_limit:${phoneNumber}`;
      const pipeline = this.redis.pipeline();
      
      // Incrementar contador
      pipeline.incr(key);
      // Establecer TTL si es la primera vez
      pipeline.expire(key, this.RATE_LIMIT_WINDOW);
      
      const results = await pipeline.exec();
      const newCount = results?.[0]?.[1] as number;

      this.logger.debug(`Request count for ${phoneNumber}: ${newCount}`);

      // Si excede el límite, bloquear automáticamente
      if (newCount >= this.MAX_REQUESTS_PER_WINDOW) {
        await this.blockPhoneNumber(
          phoneNumber, 
          `Rate limit exceeded: ${newCount} requests in ${this.RATE_LIMIT_WINDOW}s`,
          this.BLOCK_DURATION
        );
      }
    } catch (error) {
      this.logger.error(`Failed to increment request count for ${phoneNumber}:`, error);
    }
  }

  async blockPhoneNumber(phoneNumber: string, reason: string, duration?: number): Promise<void> {
    try {
      const now = new Date();
      const blockDuration = duration || this.BLOCK_DURATION;
      
      // Obtener historial de bloqueos
      const blockHistoryKey = `block_history:${phoneNumber}`;
      const blockHistory = await this.redis.get(blockHistoryKey);
      const previousBlocks = blockHistory ? parseInt(blockHistory) : 0;
      const newBlockCount = previousBlocks + 1;

      // Determinar si es bloqueo permanente
      const isPermanent = newBlockCount >= this.PERMANENT_BLOCK_THRESHOLD;
      const expiresAt = isPermanent ? undefined : new Date(now.getTime() + blockDuration * 1000);

      const blacklistedPhone: BlacklistedPhone = {
        phoneNumber,
        reason: `${reason} (Bloqueo #${newBlockCount})`,
        blockedAt: now,
        expiresAt,
        attempts: newBlockCount,
      };

      // Guardar en lista negra
      const blacklistKey = `blacklist:${phoneNumber}`;
      if (isPermanent) {
        await this.redis.set(blacklistKey, JSON.stringify(blacklistedPhone));
      } else {
        await this.redis.setex(blacklistKey, blockDuration, JSON.stringify(blacklistedPhone));
      }

      // Actualizar historial de bloqueos
      await this.redis.setex(blockHistoryKey, 86400 * 30, newBlockCount.toString()); // 30 días

      // Limpiar rate limit actual
      await this.redis.del(`rate_limit:${phoneNumber}`);

      this.logger.warn(
        `Phone ${phoneNumber} blocked. Reason: ${reason}. ` +
        `Block count: ${newBlockCount}. ${isPermanent ? 'PERMANENT' : `Expires: ${expiresAt}`}`
      );
    } catch (error) {
      this.logger.error(`Failed to block phone ${phoneNumber}:`, error);
    }
  }

  async isPhoneBlocked(phoneNumber: string): Promise<boolean> {
    try {
      const blacklistKey = `blacklist:${phoneNumber}`;
      const blacklistedData = await this.redis.get(blacklistKey);
      
      if (!blacklistedData) {
        return false;
      }

      const blacklisted: BlacklistedPhone = JSON.parse(blacklistedData);
      
      // Si no tiene fecha de expiración, es permanente
      if (!blacklisted.expiresAt) {
        return true;
      }

      // Verificar si ha expirado
      if (new Date() > new Date(blacklisted.expiresAt)) {
        await this.redis.del(blacklistKey);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to check if phone ${phoneNumber} is blocked:`, error);
      return false;
    }
  }

  async getBlacklistedPhone(phoneNumber: string): Promise<BlacklistedPhone | null> {
    try {
      const blacklistKey = `blacklist:${phoneNumber}`;
      const blacklistedData = await this.redis.get(blacklistKey);
      
      if (!blacklistedData) {
        return null;
      }

      return JSON.parse(blacklistedData);
    } catch (error) {
      this.logger.error(`Failed to get blacklisted phone ${phoneNumber}:`, error);
      return null;
    }
  }

  async unblockPhoneNumber(phoneNumber: string): Promise<void> {
    try {
      const blacklistKey = `blacklist:${phoneNumber}`;
      const rateLimitKey = `rate_limit:${phoneNumber}`;
      
      await this.redis.del(blacklistKey);
      await this.redis.del(rateLimitKey);
      
      this.logger.log(`Phone ${phoneNumber} unblocked manually`);
    } catch (error) {
      this.logger.error(`Failed to unblock phone ${phoneNumber}:`, error);
    }
  }

  async cleanupExpiredBlocks(): Promise<void> {
    try {
      // Redis maneja automáticamente la expiración con TTL
      // Esta función puede usarse para limpieza adicional si es necesario
      this.logger.log('Rate limit cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup expired blocks:', error);
    }
  }

  // Métodos adicionales para administración
  async getBlockedPhones(): Promise<BlacklistedPhone[]> {
    try {
      const pattern = 'blacklist:*';
      const keys = await this.redis.keys(pattern);
      const blockedPhones: BlacklistedPhone[] = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          blockedPhones.push(JSON.parse(data));
        }
      }

      return blockedPhones;
    } catch (error) {
      this.logger.error('Failed to get blocked phones:', error);
      return [];
    }
  }

  async getRateLimitStats(phoneNumber: string): Promise<{ count: number; ttl: number }> {
    try {
      const key = `rate_limit:${phoneNumber}`;
      const count = await this.redis.get(key);
      const ttl = await this.redis.ttl(key);
      
      return {
        count: count ? parseInt(count) : 0,
        ttl: ttl || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get rate limit stats for ${phoneNumber}:`, error);
      return { count: 0, ttl: 0 };
    }
  }
} 