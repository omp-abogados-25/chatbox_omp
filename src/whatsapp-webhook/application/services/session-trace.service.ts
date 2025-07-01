import { Injectable, Inject, Logger } from '@nestjs/common';
import { SessionTrace, SessionTraceStatus } from '../../domain';
import { SessionTraceRepository } from '../../domain/interfaces/session-trace.repository.interface';

@Injectable()
export class SessionTraceService {
  private readonly logger = new Logger(SessionTraceService.name);

  constructor(
    @Inject('SessionTraceRepository') 
    private readonly sessionTraceRepository: SessionTraceRepository,
  ) {}

  /**
   * Inicia una nueva sesión y crea la primera traza
   */
  async startSessionTrace(
    phoneNumber: string, 
    sessionId: string, 
    stepDescription: string = 'Solicitud iniciada - esperando número de documento'
  ): Promise<SessionTrace> {
    try {
      // Primero marcar cualquier sesión previa como expirada
      await this.markPreviousSessionsAsExpired(phoneNumber);

      // Crear nueva traza
      const sessionTrace = SessionTrace.create(
        phoneNumber,
        sessionId,
        SessionTraceStatus.INICIADA,
        stepDescription
      );

      const createdTrace = await this.sessionTraceRepository.create(sessionTrace);
      
      this.logger.log(`🟢 Nueva sesión iniciada: ${sessionId} para ${phoneNumber}`);
      return createdTrace;
    } catch (error) {
      this.logger.error(`❌ Error al iniciar traza de sesión para ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Crea nueva traza con estado EN_PROGRESO (cuando se envía OTP)
   */
  async markSessionInProgress(
    phoneNumber: string,
    documentNumber?: string,
    stepDescription: string = 'OTP enviado - verificación en progreso'
  ): Promise<void> {
    try {
      const activeTrace = await this.sessionTraceRepository.findActiveByPhoneNumber(phoneNumber);
      
      if (activeTrace) {
        // Crear NUEVA traza para el cambio de estado
        const progressTrace = SessionTrace.create(
          phoneNumber,
          activeTrace.sessionId, // Mismo sessionId
          SessionTraceStatus.EN_PROGRESO,
          stepDescription,
          documentNumber,
          {
            previousTraceId: activeTrace.id,
            documentNumber: documentNumber,
            otpSentAt: new Date()
          }
        );

        // Asignar usuario si ya está identificado
        if (activeTrace.userId) {
          progressTrace.assignUser(activeTrace.userId);
        }

        await this.sessionTraceRepository.create(progressTrace);
        this.logger.log(`🔄 Nueva traza EN_PROGRESO creada para sesión ${activeTrace.sessionId}`);
      } else {
        this.logger.warn(`⚠️ No se encontró sesión activa para ${phoneNumber}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error al crear traza en progreso para ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Crea nueva traza con estado AUTENTICADA (cuando se completa MFA)
   */
  async markSessionAuthenticated(
    phoneNumber: string,
    userId?: string,
    stepDescription: string = 'Usuario autenticado exitosamente'
  ): Promise<void> {
    try {
      const activeTrace = await this.sessionTraceRepository.findActiveByPhoneNumber(phoneNumber);
      
      if (activeTrace) {
        // Crear NUEVA traza para el estado autenticado
        const authenticatedTrace = SessionTrace.create(
          phoneNumber,
          activeTrace.sessionId, // Mismo sessionId
          SessionTraceStatus.AUTENTICADA,
          stepDescription,
          activeTrace.documentNumber,
          {
            previousTraceId: activeTrace.id,
            userId: userId,
            authenticatedAt: new Date(),
            mfaCompleted: true
          }
        );

        // Asignar usuario autenticado
        if (userId) {
          authenticatedTrace.assignUser(userId);
        }

        await this.sessionTraceRepository.create(authenticatedTrace);
        this.logger.log(`✅ Nueva traza AUTENTICADA creada para sesión ${activeTrace.sessionId} - usuario ${userId}`);
      } else {
        this.logger.warn(`⚠️ No se encontró sesión activa para ${phoneNumber}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error al crear traza autenticada para ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Crea nueva traza para procesamiento de certificado
   */
  async markProcessingCertificate(
    phoneNumber: string,
    certificateRequestId: string,
    certificateType: string
  ): Promise<void> {
    try {
      const activeTrace = await this.sessionTraceRepository.findActiveByPhoneNumber(phoneNumber);
      
      if (activeTrace) {
        const stepDescription = `Procesando certificado: ${certificateType}`;
        
        // Crear NUEVA traza para el procesamiento del certificado
        const processingTrace = SessionTrace.create(
          phoneNumber,
          activeTrace.sessionId, // Mismo sessionId
          SessionTraceStatus.PROCESANDO_CERTIFICADO,
          stepDescription,
          activeTrace.documentNumber,
          {
            previousTraceId: activeTrace.id,
            certificateType,
            certificateRequestId,
            processingStartedAt: new Date()
          }
        );

        // Asignar usuario y certificado
        if (activeTrace.userId) {
          processingTrace.assignUser(activeTrace.userId);
        }
        processingTrace.assignCertificateRequest(certificateRequestId);

        await this.sessionTraceRepository.create(processingTrace);
        this.logger.log(`📄 Nueva traza PROCESANDO_CERTIFICADO creada para sesión ${activeTrace.sessionId} - certificado ${certificateRequestId}`);
      } else {
        this.logger.warn(`⚠️ No se encontró sesión activa para ${phoneNumber}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error al crear traza de procesamiento para ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Crea nueva traza de finalización de sesión
   */
  async finishSession(
    phoneNumber: string,
    reason: string = 'Sesión finalizada por el usuario'
  ): Promise<void> {
    try {
      const activeTrace = await this.sessionTraceRepository.findActiveByPhoneNumber(phoneNumber);
      
      if (activeTrace) {
        // Crear NUEVA traza para la finalización
        const finishedTrace = SessionTrace.create(
          phoneNumber,
          activeTrace.sessionId, // Mismo sessionId
          SessionTraceStatus.FINALIZADA,
          reason,
          activeTrace.documentNumber,
          {
            previousTraceId: activeTrace.id,
            finishedAt: new Date(),
            finishReason: reason,
            sessionDuration: Date.now() - new Date(activeTrace.createdAt).getTime()
          }
        );

        // Asignar usuario y certificado si existen
        if (activeTrace.userId) {
          finishedTrace.assignUser(activeTrace.userId);
        }
        if (activeTrace.certificateRequestId) {
          finishedTrace.assignCertificateRequest(activeTrace.certificateRequestId);
        }

        await this.sessionTraceRepository.create(finishedTrace);
        this.logger.log(`🏁 Nueva traza FINALIZADA creada para sesión ${activeTrace.sessionId}: ${reason}`);
      } else {
        this.logger.warn(`⚠️ No se encontró sesión activa para finalizar: ${phoneNumber}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error al crear traza de finalización para ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Crea nueva traza de expiración de sesión
   */
  async markSessionExpired(
    phoneNumber: string,
    reason: string = 'Sesión expirada por inactividad (5 minutos)'
  ): Promise<void> {
    try {
      const activeTrace = await this.sessionTraceRepository.findActiveByPhoneNumber(phoneNumber);
      
      if (activeTrace) {
        // Crear NUEVA traza para la expiración
        const expiredTrace = SessionTrace.create(
          phoneNumber,
          activeTrace.sessionId, // Mismo sessionId
          SessionTraceStatus.EXPIRADA,
          reason,
          activeTrace.documentNumber,
          {
            previousTraceId: activeTrace.id,
            expiredAt: new Date(),
            expiredReason: reason,
            sessionDuration: Date.now() - new Date(activeTrace.createdAt).getTime(),
            timeoutOccurred: true
          }
        );

        // Asignar usuario y certificado si existen
        if (activeTrace.userId) {
          expiredTrace.assignUser(activeTrace.userId);
        }
        if (activeTrace.certificateRequestId) {
          expiredTrace.assignCertificateRequest(activeTrace.certificateRequestId);
        }

        await this.sessionTraceRepository.create(expiredTrace);
        this.logger.log(`⏰ Nueva traza EXPIRADA creada para sesión ${activeTrace.sessionId}: ${reason}`);
      } else {
        this.logger.log(`⏰ No se encontró sesión activa para expirar: ${phoneNumber}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error al crear traza de expiración para ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva traza para un certificado adicional en la misma sesión
   */
  async addCertificateToSession(
    phoneNumber: string,
    certificateRequestId: string,
    certificateType: string
  ): Promise<SessionTrace | null> {
    try {
      const activeTrace = await this.sessionTraceRepository.findActiveByPhoneNumber(phoneNumber);
      
      if (!activeTrace) {
        this.logger.warn(`⚠️ No se encontró sesión activa para agregar certificado: ${phoneNumber}`);
        return null;
      }

      // Crear nueva traza para el certificado adicional con el mismo sessionId
      const additionalTrace = SessionTrace.create(
        phoneNumber,
        activeTrace.sessionId, // Mismo sessionId para mantener la trazabilidad
        SessionTraceStatus.PROCESANDO_CERTIFICADO,
        `Certificado adicional: ${certificateType}`,
        activeTrace.documentNumber,
        {
          previousTraceId: activeTrace.id,
          certificateType,
          certificateRequestId,
          isAdditionalCertificate: true,
          processingStartedAt: new Date()
        }
      );

      // Asignar datos conocidos de la sesión activa
      if (activeTrace.userId) {
        additionalTrace.assignUser(activeTrace.userId);
      }
      additionalTrace.assignCertificateRequest(certificateRequestId);

      const createdTrace = await this.sessionTraceRepository.create(additionalTrace);
      
      this.logger.log(`📄+ Nueva traza certificado adicional creada para sesión ${activeTrace.sessionId}: ${certificateRequestId}`);
      return createdTrace;
    } catch (error) {
      this.logger.error(`❌ Error al crear traza certificado adicional para ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las trazas de una sesión específica
   */
  async getSessionTraces(sessionId: string): Promise<SessionTrace[]> {
    try {
      return await this.sessionTraceRepository.findBySessionId(sessionId);
    } catch (error) {
      this.logger.error(`❌ Error al obtener trazas de sesión ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de trazas de un número de teléfono
   */
  async getPhoneTraceHistory(phoneNumber: string): Promise<SessionTrace[]> {
    try {
      return await this.sessionTraceRepository.findByPhoneNumber(phoneNumber);
    } catch (error) {
      this.logger.error(`❌ Error al obtener historial de trazas para ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene números de teléfono únicos que tienen trazas de sesión
   */
  async getUniquePhoneNumbers(): Promise<string[]> {
    try {
      return await this.sessionTraceRepository.getUniquePhoneNumbers();
    } catch (error) {
      this.logger.error(`❌ Error al obtener números únicos de teléfono:`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de trazabilidad
   */
  async getTraceStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    expiredSessions: number;
    byStatus: Record<SessionTraceStatus, number>;
  }> {
    try {
      return await this.sessionTraceRepository.getTraceStatistics();
    } catch (error) {
      this.logger.error(`❌ Error al obtener estadísticas de trazas:`, error);
      throw error;
    }
  }

  /**
   * Crea trazas de expiración para sesiones previas antes de crear una nueva
   */
  private async markPreviousSessionsAsExpired(phoneNumber: string): Promise<void> {
    try {
      const existingTrace = await this.sessionTraceRepository.findActiveByPhoneNumber(phoneNumber);
      
      if (existingTrace) {
        // Crear nueva traza de expiración para la sesión previa
        const expiredTrace = SessionTrace.create(
          phoneNumber,
          existingTrace.sessionId,
          SessionTraceStatus.EXPIRADA,
          'Sesión anterior expirada al iniciar nueva sesión',
          existingTrace.documentNumber,
          {
            previousTraceId: existingTrace.id,
            expiredAt: new Date(),
            expiredReason: 'Nueva sesión iniciada',
            automaticExpiration: true
          }
        );

        // Asignar datos de la sesión previa
        if (existingTrace.userId) {
          expiredTrace.assignUser(existingTrace.userId);
        }
        if (existingTrace.certificateRequestId) {
          expiredTrace.assignCertificateRequest(existingTrace.certificateRequestId);
        }

        await this.sessionTraceRepository.create(expiredTrace);
        this.logger.log(`🔄 Nueva traza EXPIRADA creada para sesión previa ${existingTrace.sessionId} de ${phoneNumber}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error al crear traza de expiración para sesiones previas de ${phoneNumber}:`, error);
      // No lanzamos el error para no interrumpir la creación de la nueva sesión
    }
  }
} 