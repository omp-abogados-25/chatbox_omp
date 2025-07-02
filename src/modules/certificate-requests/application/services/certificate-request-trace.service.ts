import { Injectable, Inject, Logger } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { SessionTraceRepository } from '../../../../whatsapp-webhook/domain/interfaces/session-trace.repository.interface';
import { SessionTraceStatus } from '../../../../whatsapp-webhook/domain';

export interface CertificateRequestWithTrace {
  id: string;
  whatsapp_number: string;
  requester_name?: string;
  requester_document?: string;
  certificate_type: string;
  status: string;
  document_sent: boolean;
  is_completed: boolean;
  created_at: Date;
  updated_at: Date;
  // Información de trazabilidad
  sessionTraces: {
    id: string;
    session_id: string;
    status: SessionTraceStatus;
    step_description: string;
    created_at: Date;
    updated_at: Date;
    metadata?: any;
  }[];
  // Estado calculado de la trazabilidad
  currentTraceStatus?: SessionTraceStatus;
  sessionStarted?: Date;
  sessionCompleted?: Date;
  totalSteps?: number;
  hasActiveSession?: boolean;
}

@Injectable()
export class CertificateRequestTraceService {
  private readonly logger = new Logger(CertificateRequestTraceService.name);

  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
    @Inject('SessionTraceRepository')
    private readonly sessionTraceRepository: SessionTraceRepository,
  ) {}

  /**
   * Obtiene todas las solicitudes con su respectiva trazabilidad
   */
  async findAllWithTraceability(): Promise<CertificateRequestWithTrace[]> {
    try {
      // Obtener todas las solicitudes
      const requestsResult = await this.certificateRequestRepository.findAll();
      
      // Extraer el array de solicitudes del resultado paginado
      const requests = Array.isArray(requestsResult) ? requestsResult : requestsResult.data || [];
      
      // Para cada solicitud, obtener sus trazas
      const requestsWithTraces = await Promise.all(
        requests.map(async (request) => {
          const traces = await this.sessionTraceRepository.findByCertificateRequestId(request.id);
          
          // Calcular estado actual de trazabilidad
          const traceAnalysis = this.analyzeTraces(traces);
          
          return {
            id: request.id,
            whatsapp_number: request.whatsapp_number,
            requester_name: request.requester_name,
            requester_document: request.requester_document,
            certificate_type: request.certificate_type,
            status: request.status,
            document_sent: request.document_sent,
            is_completed: request.is_completed,
            created_at: request.created_at,
            updated_at: request.updated_at,
            sessionTraces: traces.map(trace => ({
              id: trace.id,
              session_id: trace.sessionId,
              status: trace.status,
              step_description: trace.stepDescription,
              created_at: trace.createdAt,
              updated_at: trace.updatedAt,
              metadata: trace.metadata,
            })),
            ...traceAnalysis,
          };
        })
      );

      return requestsWithTraces;
    } catch (error) {
      this.logger.error('Error obteniendo solicitudes con trazabilidad:', error);
      throw error;
    }
  }

  /**
   * Obtiene una solicitud específica con su trazabilidad
   */
  async findByIdWithTraceability(id: string): Promise<CertificateRequestWithTrace | null> {
    try {
      const request = await this.certificateRequestRepository.findById(id);
      if (!request) return null;

      const traces = await this.sessionTraceRepository.findByCertificateRequestId(id);
      const traceAnalysis = this.analyzeTraces(traces);

      return {
        id: request.id,
        whatsapp_number: request.whatsapp_number,
        requester_name: request.requester_name,
        requester_document: request.requester_document,
        certificate_type: request.certificate_type,
        status: request.status,
        document_sent: request.document_sent,
        is_completed: request.is_completed,
        created_at: request.created_at,
        updated_at: request.updated_at,
        sessionTraces: traces.map(trace => ({
          id: trace.id,
          session_id: trace.sessionId,
          status: trace.status,
          step_description: trace.stepDescription,
          created_at: trace.createdAt,
          updated_at: trace.updatedAt,
          metadata: trace.metadata,
        })),
        ...traceAnalysis,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo solicitud ${id} con trazabilidad:`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de trazabilidad por solicitudes
   */
  async getTraceabilityStatistics(): Promise<{
    totalRequests: number;
    requestsWithTraces: number;
    activeSessionsCount: number;
    completedSessionsCount: number;
    expiredSessionsCount: number;
    averageStepsPerRequest: number;
    statusDistribution: Record<string, number>;
  }> {
    try {
      const requests = await this.findAllWithTraceability();
      
      const totalRequests = requests.length;
      const requestsWithTraces = requests.filter(r => r.sessionTraces.length > 0).length;
      const activeSessionsCount = requests.filter(r => r.hasActiveSession).length;
      const completedSessionsCount = requests.filter(r => 
        r.currentTraceStatus === SessionTraceStatus.FINALIZADA
      ).length;
      const expiredSessionsCount = requests.filter(r => 
        r.currentTraceStatus === SessionTraceStatus.EXPIRADA
      ).length;

      const totalSteps = requests.reduce((sum, r) => sum + (r.totalSteps || 0), 0);
      const averageStepsPerRequest = requestsWithTraces > 0 ? totalSteps / requestsWithTraces : 0;

      // Distribución por status de certificado
      const statusDistribution = requests.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRequests,
        requestsWithTraces,
        activeSessionsCount,
        completedSessionsCount,
        expiredSessionsCount,
        averageStepsPerRequest: Math.round(averageStepsPerRequest * 100) / 100,
        statusDistribution,
      };
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas de trazabilidad:', error);
      throw error;
    }
  }

  /**
   * Analiza las trazas de una solicitud para calcular métricas
   * Ahora considera que cada cambio de estado es un registro separado
   */
  private analyzeTraces(traces: any[]): {
    currentTraceStatus?: SessionTraceStatus;
    sessionStarted?: Date;
    sessionCompleted?: Date;
    totalSteps: number;
    hasActiveSession: boolean;
  } {
    if (traces.length === 0) {
      return {
        totalSteps: 0,
        hasActiveSession: false,
      };
    }

    // Ordenar trazas por fecha de creación para obtener la cronología
    const sortedTraces = traces.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // El estado más reciente es la última traza creada (no actualizada)
    const mostRecentTrace = sortedTraces[sortedTraces.length - 1];
    const currentTraceStatus = mostRecentTrace.status;
    
    // La sesión comenzó con la primera traza
    const sessionStarted = sortedTraces[0].createdAt;
    
    // Buscar cuándo se completó la sesión (última traza de finalización o expiración)
    const completedTrace = [...sortedTraces].reverse().find(t => 
      t.status === SessionTraceStatus.FINALIZADA || 
      t.status === SessionTraceStatus.EXPIRADA
    );
    const sessionCompleted = completedTrace?.createdAt; // Usar createdAt porque cada registro es independiente

    // Verificar si hay sesión activa basado en el estado más reciente
    const activeStatuses = [
      SessionTraceStatus.INICIADA,
      SessionTraceStatus.EN_PROGRESO,
      SessionTraceStatus.AUTENTICADA,
      SessionTraceStatus.PROCESANDO_CERTIFICADO,
    ];
    const hasActiveSession = activeStatuses.includes(currentTraceStatus);

    return {
      currentTraceStatus,
      sessionStarted,
      sessionCompleted,
      totalSteps: traces.length,
      hasActiveSession,
    };
  }

  /**
   * Obtiene el historial completo de trazas por número de teléfono
   */
  async getTraceHistoryByPhone(phoneNumber: string): Promise<any[]> {
    try {
      const traces = await this.sessionTraceRepository.findByPhoneNumber(phoneNumber);
      return traces.map(trace => ({
        id: trace.id,
        session_id: trace.sessionId,
        status: trace.status,
        document_number: trace.documentNumber,
        certificate_request_id: trace.certificateRequestId,
        step_description: trace.stepDescription,
        metadata: trace.metadata,
        created_at: trace.createdAt,
        updated_at: trace.updatedAt,
      }));
    } catch (error) {
      this.logger.error(`Error obteniendo historial de trazas para ${phoneNumber}:`, error);
      throw error;
    }
  }
} 