import { Controller, Get, Query, Param, Logger, UseGuards, Inject } from '@nestjs/common';
import { SessionTraceService } from '../../application/services/session-trace.service';
import { SessionTrace, SessionTraceStatus } from '../../domain';
import { JwtAuthGuard } from 'src/modules/auth';
import { PrismaService } from '../../../integrations/prisma/prisma.service';

interface DateFilterQuery {
  startDate?: string;
  endDate?: string;
}

@Controller('session-traces')
@UseGuards(JwtAuthGuard)
export class SessionTraceController {
  private readonly logger = new Logger(SessionTraceController.name);

  constructor(
    private readonly sessionTraceService: SessionTraceService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Obtiene todas las sesiones agrupadas por session_id
   * Muestra cada sesión como una entrada separada
   * Filtrado por rango de fechas opcional
   */
  @Get('latest-by-phone')
  async getLatestTracesByPhone(@Query() query: DateFilterQuery) {
    try {
      this.logger.log('Getting all sessions with their traces', query);
      
      // Obtener números únicos de teléfono
      const phoneNumbers = await this.sessionTraceService.getUniquePhoneNumbers();
      const allSessions = [];

      for (const phoneNumber of phoneNumbers) {
        // Obtener todas las trazas del teléfono
        const traces = await this.sessionTraceService.getPhoneTraceHistory(phoneNumber);
        
        if (traces.length > 0) {
          // Agrupar trazas por session_id
          const sessionGroups = this.groupTracesBySession(traces);
          
          // Crear una entrada por cada sesión
          for (const [sessionId, sessionTraces] of sessionGroups.entries()) {
            const latestTrace = sessionTraces[sessionTraces.length - 1]; // Última traza de la sesión
            const firstTrace = sessionTraces[0]; // Primera traza de la sesión
            
            // Obtener información real del usuario si tenemos el documento
            const documentNumber = latestTrace.metadata?.requester_document || latestTrace.documentNumber;
            let userInfo = null;
            if (documentNumber) {
              userInfo = await this.getUserByDocument(documentNumber);
            }
            
            // Construir el objeto de sesión
            const sessionData = {
              id: sessionId, // Usar session_id como ID principal
              whatsapp_number: phoneNumber,
              requester_name: userInfo?.full_name || latestTrace.metadata?.requester_name || null,
              requester_document: documentNumber || null,
              requester_email: userInfo?.email || null,
              certificate_type: this.mapCertificateType(latestTrace.metadata?.certificate_type || 'unknown'),
              status: this.mapTraceStatusToRequestStatus(latestTrace.status),
              document_sent: latestTrace.status === SessionTraceStatus.FINALIZADA,
              is_completed: latestTrace.status === SessionTraceStatus.FINALIZADA,
              created_at: this.formatDateForClient(firstTrace.createdAt), // Inicio de la sesión
              updated_at: this.formatDateForClient(latestTrace.updatedAt), // Última actividad
              full_name: userInfo?.full_name || latestTrace.metadata?.requester_name || null,
              identification_number: documentNumber || null,
              
              // Información específica de trazabilidad
              currentTraceStatus: latestTrace.status,
              sessionStarted: this.formatDateForClient(firstTrace.createdAt),
              sessionCompleted: latestTrace.status === SessionTraceStatus.FINALIZADA ? this.formatDateForClient(latestTrace.updatedAt) : null,
              totalSteps: sessionTraces.length,
              hasActiveSession: this.isActiveStatus(latestTrace.status),
              lastTraceDescription: latestTrace.stepDescription,
              sessionId: sessionId,
              
              // Todas las trazas de la sesión
              sessionTraces: sessionTraces.map(trace => ({
                id: trace.id,
                session_id: trace.sessionId,
                status: trace.status,
                step_description: trace.stepDescription,
                created_at: this.formatDateForClient(trace.createdAt),
                updated_at: this.formatDateForClient(trace.updatedAt),
                metadata: trace.metadata,
              })),
            };

            allSessions.push(sessionData);
          }
        }
      }

      // Aplicar filtros de fecha si se proporcionan
      let filteredSessions = allSessions;
      if (query.startDate || query.endDate) {
        filteredSessions = this.applyDateFilter(allSessions, query.startDate, query.endDate);
        this.logger.log(`Applied date filter: ${filteredSessions.length} sessions remaining after filtering`);
      }

      // Ordenar por fecha de última actividad (más recientes primero)
      filteredSessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      this.logger.log(`Retrieved ${filteredSessions.length} sessions from ${phoneNumbers.length} phone numbers`);
      return filteredSessions;

    } catch (error) {
      this.logger.error('Error getting sessions by phone:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las solicitudes con su información de trazabilidad
   * Esta es la vista principal que combina certificate_requests con session_traces
   */
  @Get()
  async getAllWithTraceability() {
    try {
      this.logger.log('Getting all certificate requests with traceability information');
      
      // Obtener estadísticas de trazabilidad para contexto
      const statistics = await this.sessionTraceService.getTraceStatistics();
      
      // Por ahora, necesitamos obtener todas las trazas y agruparlas por sesión
      // Esto se puede optimizar más adelante con consultas específicas
      
      // Obtener todas las trazas agrupadas por teléfono para construir las "solicitudes"
      const phoneNumbers = await this.getUniquePhoneNumbers();
      const requestsWithTrace = [];

      for (const phoneNumber of phoneNumbers) {
        const traces = await this.sessionTraceService.getPhoneTraceHistory(phoneNumber);
        
        if (traces.length > 0) {
          // Agrupar trazas por sesión
          const sessionGroups = this.groupTracesBySession(traces);
          
          for (const [sessionId, sessionTraces] of sessionGroups.entries()) {
            const latestTrace = sessionTraces[sessionTraces.length - 1];
            const firstTrace = sessionTraces[0];
            
                          // Construir el objeto de solicitud con trazabilidad
              const requestWithTrace = {
                id: sessionId,
                whatsapp_number: phoneNumber,
                requester_name: latestTrace.metadata?.requester_name || null,
                requester_document: latestTrace.metadata?.requester_document || null,
                certificate_type: latestTrace.metadata?.certificate_type || 'unknown',
                status: this.mapTraceStatusToRequestStatus(latestTrace.status),
                document_sent: latestTrace.status === SessionTraceStatus.FINALIZADA,
                is_completed: latestTrace.status === SessionTraceStatus.FINALIZADA,
                created_at: this.formatDateForClient(firstTrace.createdAt),
                updated_at: this.formatDateForClient(latestTrace.updatedAt),
                full_name: latestTrace.metadata?.requester_name || null,
                identification_number: latestTrace.metadata?.requester_document || null,
                
                // Información de trazabilidad
                sessionTraces: sessionTraces.map(trace => ({
                  id: trace.id,
                  session_id: trace.sessionId,
                  status: trace.status,
                  step_description: trace.stepDescription,
                  created_at: this.formatDateForClient(trace.createdAt),
                  updated_at: this.formatDateForClient(trace.updatedAt),
                  metadata: trace.metadata,
                })),
                currentTraceStatus: latestTrace.status,
                sessionStarted: this.formatDateForClient(firstTrace.createdAt),
                sessionCompleted: latestTrace.status === SessionTraceStatus.FINALIZADA ? this.formatDateForClient(latestTrace.updatedAt) : null,
                totalSteps: sessionTraces.length,
                hasActiveSession: this.isActiveStatus(latestTrace.status),
              };

            requestsWithTrace.push(requestWithTrace);
          }
        }
      }

      // Ordenar por fecha de creación (más recientes primero)
      requestsWithTrace.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      this.logger.log(`Retrieved ${requestsWithTrace.length} requests with traceability`);
      return requestsWithTrace;

    } catch (error) {
      this.logger.error('Error getting requests with traceability:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de trazabilidad
   * Filtrado por rango de fechas opcional
   */
  @Get('statistics/overview')
  async getTraceabilityStatistics(@Query() query: DateFilterQuery) {
    try {
      this.logger.log('Getting traceability statistics', query);
      
      // Si hay filtros de fecha, obtener datos filtrados, sino usar el servicio original
      if (query.startDate || query.endDate) {
        // Obtener todas las sesiones y aplicar filtros para generar estadísticas
        const allSessions = await this.getLatestTracesByPhone(query);
        const statistics = this.generateStatisticsFromSessions(allSessions);
        return statistics;
      } else {
        // Usar estadísticas del servicio (más eficiente cuando no hay filtros)
        const statistics = await this.sessionTraceService.getTraceStatistics();
        
        return {
          totalRequests: statistics.totalSessions,
          requestsWithTraces: statistics.totalSessions,
          activeSessionsCount: statistics.activeSessions,
          completedSessionsCount: statistics.completedSessions,
          expiredSessionsCount: statistics.expiredSessions,
          averageStepsPerRequest: statistics.totalSessions > 0 ? 
            Object.values(statistics.byStatus).reduce((sum, count) => sum + count, 0) / statistics.totalSessions : 0,
          statusDistribution: statistics.byStatus,
        };
      }
    } catch (error) {
      this.logger.error('Error getting traceability statistics:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de trazas por teléfono
   */
  @Get('phone/:phoneNumber/history')
  async getTraceHistoryByPhone(@Param('phoneNumber') phoneNumber: string) {
    try {
      this.logger.log(`Getting trace history for phone: ${phoneNumber}`);
      const traces = await this.sessionTraceService.getPhoneTraceHistory(phoneNumber);
      
      return traces.map(trace => ({
        id: trace.id,
        session_id: trace.sessionId,
        status: trace.status,
        step_description: trace.stepDescription,
        created_at: this.formatDateForClient(trace.createdAt),
        updated_at: this.formatDateForClient(trace.updatedAt),
        metadata: trace.metadata,
      }));
    } catch (error) {
      this.logger.error(`Error getting trace history for phone ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene una solicitud específica con su trazabilidad
   */
  @Get(':sessionId')
  async getByIdWithTraceability(@Param('sessionId') sessionId: string) {
    try {
      this.logger.log(`Getting request with traceability for session: ${sessionId}`);
      const traces = await this.sessionTraceService.getSessionTraces(sessionId);
      
      if (traces.length === 0) {
        return null;
      }

      const latestTrace = traces[traces.length - 1];
      const firstTrace = traces[0];
      
      return {
        id: sessionId,
        whatsapp_number: firstTrace.phoneNumber,
        requester_name: latestTrace.metadata?.requester_name || null,
        requester_document: latestTrace.metadata?.requester_document || null,
        certificate_type: latestTrace.metadata?.certificate_type || 'unknown',
        status: this.mapTraceStatusToRequestStatus(latestTrace.status),
        document_sent: latestTrace.status === SessionTraceStatus.FINALIZADA,
        is_completed: latestTrace.status === SessionTraceStatus.FINALIZADA,
        created_at: this.formatDateForClient(firstTrace.createdAt),
        updated_at: this.formatDateForClient(latestTrace.updatedAt),
        full_name: latestTrace.metadata?.requester_name || null,
        identification_number: latestTrace.metadata?.requester_document || null,
        
        // Información de trazabilidad
        sessionTraces: traces.map(trace => ({
          id: trace.id,
          session_id: trace.sessionId,
          status: trace.status,
          step_description: trace.stepDescription,
          created_at: this.formatDateForClient(trace.createdAt),
          updated_at: this.formatDateForClient(trace.updatedAt),
          metadata: trace.metadata,
        })),
        currentTraceStatus: latestTrace.status,
        sessionStarted: this.formatDateForClient(firstTrace.createdAt),
        sessionCompleted: latestTrace.status === SessionTraceStatus.FINALIZADA ? this.formatDateForClient(latestTrace.updatedAt) : null,
        totalSteps: traces.length,
        hasActiveSession: this.isActiveStatus(latestTrace.status),
      };
    } catch (error) {
      this.logger.error(`Error getting request with traceability for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private async getUniquePhoneNumbers(): Promise<string[]> {
    return await this.sessionTraceService.getUniquePhoneNumbers();
  }

  private async getUserByDocument(documentNumber: string): Promise<{ full_name: string; email: string } | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          identification_number: documentNumber
        },
        select: {
          full_name: true,
          email: true
        }
      });

      return user;
    } catch (error) {
      this.logger.error(`Error getting user by document ${documentNumber}:`, error);
      return null;
    }
  }

  private groupTracesBySession(traces: SessionTrace[]): Map<string, SessionTrace[]> {
    const sessionGroups = new Map<string, SessionTrace[]>();
    
    for (const trace of traces) {
      const sessionId = trace.sessionId;
      if (!sessionGroups.has(sessionId)) {
        sessionGroups.set(sessionId, []);
      }
      sessionGroups.get(sessionId)!.push(trace);
    }
    
    // Ordenar trazas dentro de cada sesión por fecha de creación
    for (const [sessionId, sessionTraces] of sessionGroups.entries()) {
      sessionTraces.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    
    return sessionGroups;
  }

  private mapTraceStatusToRequestStatus(traceStatus: SessionTraceStatus): string {
    switch (traceStatus) {
      case SessionTraceStatus.INICIADA:
        return 'PENDING';
      case SessionTraceStatus.EN_PROGRESO:
      case SessionTraceStatus.AUTENTICADA:
      case SessionTraceStatus.PROCESANDO_CERTIFICADO:
        return 'IN_PROGRESS';
      case SessionTraceStatus.FINALIZADA:
        return 'COMPLETED';
      case SessionTraceStatus.EXPIRADA:
        return 'EXPIRED';
      default:
        return 'UNKNOWN';
    }
  }

  private mapCertificateType(certificateType: string): string {
    switch (certificateType?.toLowerCase()) {
      case 'with_salary':
      case 'con_sueldo':
      case 'laboral_con_sueldo':
        return 'Laboral con sueldo';
      case 'without_salary':
      case 'sin_sueldo':
      case 'laboral_sin_sueldo':
        return 'Laboral sin sueldo';
      case 'with_functions':
      case 'con_funciones':
      case 'certificado_con_funciones':
        return 'Certificado con funciones';
      case 'unknown':
      default:
        return 'Tipo no definido';
    }
  }

  private isActiveStatus(status: SessionTraceStatus): boolean {
    return [
      SessionTraceStatus.INICIADA,
      SessionTraceStatus.EN_PROGRESO,
      SessionTraceStatus.AUTENTICADA,
      SessionTraceStatus.PROCESANDO_CERTIFICADO
    ].includes(status);
  }

  /**
   * Aplica filtros de fecha a las sesiones
   */
  private applyDateFilter(sessions: any[], startDate?: string, endDate?: string): any[] {
    this.logger.log(`Applying date filter. Start: ${startDate}, End: ${endDate}`);
    this.logger.log(`Total sessions before filter: ${sessions.length}`);
    
    const filtered = sessions.filter(session => {
      // Usar la fecha de última actividad de la sesión (updated_at)
      const sessionDateTime = new Date(session.updated_at);
      
      // Extraer la fecha en la zona horaria local (no UTC)
      const year = sessionDateTime.getFullYear();
      const month = String(sessionDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(sessionDateTime.getDate()).padStart(2, '0');
      const sessionDateOnly = `${year}-${month}-${day}`; // YYYY-MM-DD en zona horaria local
      
      // Debug: Log de cada sesión
      this.logger.log(`Session ${session.id}: updated_at=${session.updated_at}, dateOnly=${sessionDateOnly}, startDate=${startDate}, endDate=${endDate}`);
      
      // Aplicar filtro de fecha inicio
      if (startDate) {
        if (sessionDateOnly < startDate) {
          this.logger.log(`Session ${session.id} filtered out: ${sessionDateOnly} < ${startDate}`);
          return false;
        }
      }
      
      // Aplicar filtro de fecha fin
      if (endDate) {
        if (sessionDateOnly > endDate) {
          this.logger.log(`Session ${session.id} filtered out: ${sessionDateOnly} > ${endDate}`);
          return false;
        }
      }
      
      this.logger.log(`Session ${session.id} passed filter`);
      return true;
    });
    
    this.logger.log(`Total sessions after filter: ${filtered.length}`);
    return filtered;
  }

  /**
   * Formatea una fecha para el cliente manteniendo la zona horaria local
   */
  private formatDateForClient(date: Date): string {
    // La fecha viene de la BD en UTC, necesitamos convertirla a la zona horaria local del servidor
    // Colombia es GMT-5, por lo que restamos 5 horas
    const colombianDate = new Date(date.getTime() - (5 * 60 * 60 * 1000));
    return colombianDate.toISOString();
  }

  /**
   * Genera estadísticas a partir de un array de sesiones
   */
  private generateStatisticsFromSessions(sessions: any[]): any {
    const statusDistribution: Record<string, number> = {};
    let activeSessionsCount = 0;
    let completedSessionsCount = 0;
    let expiredSessionsCount = 0;
    let totalSteps = 0;

    sessions.forEach(session => {
      // Contar por estado actual de traza
      const status = session.currentTraceStatus;
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      
      // Contar por categorías
      if (session.hasActiveSession) {
        activeSessionsCount++;
      }
      if (session.currentTraceStatus === SessionTraceStatus.FINALIZADA) {
        completedSessionsCount++;
      }
      if (session.currentTraceStatus === SessionTraceStatus.EXPIRADA) {
        expiredSessionsCount++;
      }
      
      // Sumar pasos totales
      totalSteps += session.totalSteps || 0;
    });

    return {
      totalRequests: sessions.length,
      requestsWithTraces: sessions.length,
      activeSessionsCount,
      completedSessionsCount,
      expiredSessionsCount,
      averageStepsPerRequest: sessions.length > 0 ? totalSteps / sessions.length : 0,
      statusDistribution,
    };
  }
} 