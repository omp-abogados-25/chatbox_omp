import { Module, Injectable, Logger } from '@nestjs/common';
import { MemoryMfaService } from './memory-mfa.service';
import { MemoryCacheService } from './memory-cache.service';
import { MessageAnalysisService } from './message-analysis.service';
import { WhatsAppProfileService } from './whatsapp-profile.service';
import { IRateLimitService, RateLimitInfo, BlacklistedPhone } from '../../domain';
import { EmailModule } from '../email.module';
import { ConfigModule } from '@nestjs/config';

/**
 * @fileoverview Servicio de rate limiting en memoria para desarrollo
 * 
 * Implementa protección contra abuso específicamente para solicitudes MFA:
 * - NO bloquea conversación normal (mensajes, selecciones de menú)
 * - SÍ bloquea múltiples solicitudes de códigos TOTP
 * - Bloqueos temporales (30 min) y permanentes escalados
 * - Limpieza automática al completar MFA exitosamente
 * 
 * @author Sistema de Certificados Laborales
 * @version 1.0.0
 * @since 2024-12
 */
@Injectable()
class MemoryRateLimitService implements IRateLimitService {
  private readonly logger = new Logger(MemoryRateLimitService.name);
  private readonly RATE_LIMIT_WINDOW = 600; // 10 minutos (como dijiste)
  private readonly MAX_REQUESTS_PER_WINDOW = 3; // 3 solicitudes de código MFA máximo
  private readonly BLOCK_DURATION = 1800; // 30 minutos de bloqueo (más razonable)

  constructor(private readonly cache: MemoryCacheService) {
  }

  async checkRateLimit(phoneNumber: string): Promise<RateLimitInfo> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW * 1000);
    
    const isBlocked = await this.isPhoneBlocked(phoneNumber);
    if (isBlocked) {
      return {
        phoneNumber,
        requestCount: this.MAX_REQUESTS_PER_WINDOW + 1,
        windowStart,
        isBlocked: true,
      };
    }

    const key = `rate_limit:${phoneNumber}`;
    const currentCount = await this.cache.get(key);
    const requestCount = currentCount ? parseInt(currentCount) : 0;

    return {
      phoneNumber,
      requestCount,
      windowStart,
      isBlocked: requestCount >= this.MAX_REQUESTS_PER_WINDOW,
    };
  }

  async incrementRequestCount(phoneNumber: string): Promise<void> {
    const key = `rate_limit:${phoneNumber}`;
    const newCount = await this.cache.incr(key);
    await this.cache.expire(key, this.RATE_LIMIT_WINDOW);

    if (newCount >= this.MAX_REQUESTS_PER_WINDOW) {
      await this.blockPhoneNumber(
        phoneNumber, 
        `Demasiadas solicitudes de códigos MFA: ${newCount} en ${this.RATE_LIMIT_WINDOW/60} minutos`
      );
    }
  }

  async blockPhoneNumber(phoneNumber: string, reason: string, duration?: number): Promise<void> {
    const blockDuration = duration || this.BLOCK_DURATION;
    const blacklistedPhone: BlacklistedPhone = {
      phoneNumber,
      reason,
      blockedAt: new Date(),
      expiresAt: new Date(Date.now() + blockDuration * 1000),
      attempts: 1,
    };

    await this.cache.setex(`blacklist:${phoneNumber}`, blockDuration, JSON.stringify(blacklistedPhone));
  }

  async isPhoneBlocked(phoneNumber: string): Promise<boolean> {
    const blacklistedData = await this.cache.get(`blacklist:${phoneNumber}`);
    return !!blacklistedData;
  }

  async getBlacklistedPhone(phoneNumber: string): Promise<BlacklistedPhone | null> {
    const blacklistedData = await this.cache.get(`blacklist:${phoneNumber}`);
    return blacklistedData ? JSON.parse(blacklistedData) : null;
  }

  async unblockPhoneNumber(phoneNumber: string): Promise<void> {
    await this.cache.del(`blacklist:${phoneNumber}`);
    await this.cache.del(`rate_limit:${phoneNumber}`);
  }

  async cleanupExpiredBlocks(): Promise<void> {
    // El cache en memoria maneja la expiración automáticamente
  }
}

@Module({
  imports: [
    EmailModule,
    ConfigModule
  ],
  providers: [
    MemoryCacheService,
    {
      provide: 'IMfaService',
      useClass: MemoryMfaService,
    },
    {
      provide: 'IRateLimitService',
      useClass: MemoryRateLimitService,
    },
    {
      provide: 'IMessageAnalysisService',
      useClass: MessageAnalysisService,
    },
    {
      provide: 'IWhatsAppProfileService',
      useClass: WhatsAppProfileService,
    },
  ],
  exports: [
    'IMfaService',
    'IRateLimitService',
    'IMessageAnalysisService',
    'IWhatsAppProfileService',
  ],
})
export class WhatsappWebhookServicesModule {} 