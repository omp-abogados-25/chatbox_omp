import { SessionTrace } from '../entities/session-trace.entity';
import { SessionTraceStatus } from '../enums/session-trace-status.enum';

export interface SessionTraceRepository {
  /**
   * Crea una nueva traza de sesión
   */
  create(sessionTrace: SessionTrace): Promise<SessionTrace>;

  /**
   * Actualiza una traza de sesión existente
   */
  update(sessionTrace: SessionTrace): Promise<SessionTrace>;

  /**
   * Busca una traza por ID
   */
  findById(id: string): Promise<SessionTrace | null>;

  /**
   * Busca todas las trazas de una sesión específica
   */
  findBySessionId(sessionId: string): Promise<SessionTrace[]>;

  /**
   * Busca todas las trazas de un número de teléfono
   */
  findByPhoneNumber(phoneNumber: string): Promise<SessionTrace[]>;

  /**
   * Busca la traza activa más reciente de un número de teléfono
   */
  findActiveByPhoneNumber(phoneNumber: string): Promise<SessionTrace | null>;

  /**
   * Busca trazas por estado
   */
  findByStatus(status: SessionTraceStatus): Promise<SessionTrace[]>;

  /**
   * Busca trazas asociadas a un certificate request
   */
  findByCertificateRequestId(certificateRequestId: string): Promise<SessionTrace[]>;

  /**
   * Actualiza el estado de una traza
   */
  updateStatus(id: string, status: SessionTraceStatus, description?: string): Promise<void>;

  /**
   * Asigna un usuario a una traza
   */
  assignUser(id: string, userId: string): Promise<void>;

  /**
   * Asigna un certificate request a una traza
   */
  assignCertificateRequest(id: string, certificateRequestId: string): Promise<void>;

  /**
   * Marca trazas como expiradas para un teléfono específico
   */
  markAsExpired(phoneNumber: string, reason?: string): Promise<void>;

  /**
   * Obtiene números de teléfono únicos que tienen trazas de sesión
   */
  getUniquePhoneNumbers(): Promise<string[]>;

  /**
   * Obtiene estadísticas de trazabilidad
   */
  getTraceStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    expiredSessions: number;
    byStatus: Record<SessionTraceStatus, number>;
  }>;
} 