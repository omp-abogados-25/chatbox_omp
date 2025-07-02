import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { SessionTrace, SessionTraceData, SessionTraceStatus } from '../../domain';
import { SessionTraceRepository } from '../../domain/interfaces/session-trace.repository.interface';

@Injectable()
export class SessionTraceRepositoryImpl implements SessionTraceRepository {
  private readonly logger = new Logger(SessionTraceRepositoryImpl.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(sessionTrace: SessionTrace): Promise<SessionTrace> {
    try {
      const data = sessionTrace.toData();
      const created = await this.prisma.sessionTrace.create({
        data: {
          id: data.id,
          phone_number: data.phone_number,
          session_id: data.session_id,
          status: data.status,
          document_number: data.document_number,
          user_id: data.user_id,
          certificate_request_id: data.certificate_request_id,
          step_description: data.step_description,
          metadata: data.metadata,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      });

      return SessionTrace.fromData({
        id: created.id,
        phone_number: created.phone_number,
        session_id: created.session_id,
        status: created.status as SessionTraceStatus,
        document_number: created.document_number,
        user_id: created.user_id,
        certificate_request_id: created.certificate_request_id,
        step_description: created.step_description,
        metadata: created.metadata,
        created_at: created.created_at,
        updated_at: created.updated_at,
      });
    } catch (error) {
      this.logger.error(`Error creating session trace:`, error);
      throw error;
    }
  }

  async update(sessionTrace: SessionTrace): Promise<SessionTrace> {
    try {
      const data = sessionTrace.toData();
      const updated = await this.prisma.sessionTrace.update({
        where: { id: data.id },
        data: {
          status: data.status,
          document_number: data.document_number,
          user_id: data.user_id,
          certificate_request_id: data.certificate_request_id,
          step_description: data.step_description,
          metadata: data.metadata,
          updated_at: new Date(),
        },
      });

      return SessionTrace.fromData({
        id: updated.id,
        phone_number: updated.phone_number,
        session_id: updated.session_id,
        status: updated.status as SessionTraceStatus,
        document_number: updated.document_number,
        user_id: updated.user_id,
        certificate_request_id: updated.certificate_request_id,
        step_description: updated.step_description,
        metadata: updated.metadata,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      });
    } catch (error) {
      this.logger.error(`Error updating session trace ${sessionTrace.id}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<SessionTrace | null> {
    try {
      const trace = await this.prisma.sessionTrace.findUnique({
        where: { id },
      });

      if (!trace) return null;

      return SessionTrace.fromData({
        id: trace.id,
        phone_number: trace.phone_number,
        session_id: trace.session_id,
        status: trace.status as SessionTraceStatus,
        document_number: trace.document_number,
        user_id: trace.user_id,
        certificate_request_id: trace.certificate_request_id,
        step_description: trace.step_description,
        metadata: trace.metadata,
        created_at: trace.created_at,
        updated_at: trace.updated_at,
      });
    } catch (error) {
      this.logger.error(`Error finding session trace by id ${id}:`, error);
      throw error;
    }
  }

  async findBySessionId(sessionId: string): Promise<SessionTrace[]> {
    try {
      const traces = await this.prisma.sessionTrace.findMany({
        where: { session_id: sessionId },
        orderBy: { created_at: 'desc' },
      });

      return traces.map(trace => SessionTrace.fromData({
        id: trace.id,
        phone_number: trace.phone_number,
        session_id: trace.session_id,
        status: trace.status as SessionTraceStatus,
        document_number: trace.document_number,
        user_id: trace.user_id,
        certificate_request_id: trace.certificate_request_id,
        step_description: trace.step_description,
        metadata: trace.metadata,
        created_at: trace.created_at,
        updated_at: trace.updated_at,
      }));
    } catch (error) {
      this.logger.error(`Error finding session traces by session id ${sessionId}:`, error);
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<SessionTrace[]> {
    try {
      const traces = await this.prisma.sessionTrace.findMany({
        where: { phone_number: phoneNumber },
        orderBy: { created_at: 'desc' },
      });

      return traces.map(trace => SessionTrace.fromData({
        id: trace.id,
        phone_number: trace.phone_number,
        session_id: trace.session_id,
        status: trace.status as SessionTraceStatus,
        document_number: trace.document_number,
        user_id: trace.user_id,
        certificate_request_id: trace.certificate_request_id,
        step_description: trace.step_description,
        metadata: trace.metadata,
        created_at: trace.created_at,
        updated_at: trace.updated_at,
      }));
    } catch (error) {
      this.logger.error(`Error finding session traces by phone number ${phoneNumber}:`, error);
      throw error;
    }
  }

  async findActiveByPhoneNumber(phoneNumber: string): Promise<SessionTrace | null> {
    try {
      const activeStatuses = [
        SessionTraceStatus.INICIADA,
        SessionTraceStatus.EN_PROGRESO,
        SessionTraceStatus.AUTENTICADA,
        SessionTraceStatus.PROCESANDO_CERTIFICADO
      ];

      const trace = await this.prisma.sessionTrace.findFirst({
        where: {
          phone_number: phoneNumber,
          status: { in: activeStatuses },
        },
        orderBy: { created_at: 'desc' },
      });

      if (!trace) return null;

      return SessionTrace.fromData({
        id: trace.id,
        phone_number: trace.phone_number,
        session_id: trace.session_id,
        status: trace.status as SessionTraceStatus,
        document_number: trace.document_number,
        user_id: trace.user_id,
        certificate_request_id: trace.certificate_request_id,
        step_description: trace.step_description,
        metadata: trace.metadata,
        created_at: trace.created_at,
        updated_at: trace.updated_at,
      });
    } catch (error) {
      this.logger.error(`Error finding active session trace by phone number ${phoneNumber}:`, error);
      throw error;
    }
  }

  async findByStatus(status: SessionTraceStatus): Promise<SessionTrace[]> {
    try {
      const traces = await this.prisma.sessionTrace.findMany({
        where: { status },
        orderBy: { created_at: 'desc' },
      });

      return traces.map(trace => SessionTrace.fromData({
        id: trace.id,
        phone_number: trace.phone_number,
        session_id: trace.session_id,
        status: trace.status as SessionTraceStatus,
        document_number: trace.document_number,
        user_id: trace.user_id,
        certificate_request_id: trace.certificate_request_id,
        step_description: trace.step_description,
        metadata: trace.metadata,
        created_at: trace.created_at,
        updated_at: trace.updated_at,
      }));
    } catch (error) {
      this.logger.error(`Error finding session traces by status ${status}:`, error);
      throw error;
    }
  }

  async findByCertificateRequestId(certificateRequestId: string): Promise<SessionTrace[]> {
    try {
      const traces = await this.prisma.sessionTrace.findMany({
        where: { certificate_request_id: certificateRequestId },
        orderBy: { created_at: 'desc' },
      });

      return traces.map(trace => SessionTrace.fromData({
        id: trace.id,
        phone_number: trace.phone_number,
        session_id: trace.session_id,
        status: trace.status as SessionTraceStatus,
        document_number: trace.document_number,
        user_id: trace.user_id,
        certificate_request_id: trace.certificate_request_id,
        step_description: trace.step_description,
        metadata: trace.metadata,
        created_at: trace.created_at,
        updated_at: trace.updated_at,
      }));
    } catch (error) {
      this.logger.error(`Error finding session traces by certificate request id ${certificateRequestId}:`, error);
      throw error;
    }
  }

  async updateStatus(id: string, status: SessionTraceStatus, description?: string): Promise<void> {
    try {
      await this.prisma.sessionTrace.update({
        where: { id },
        data: {
          status,
          step_description: description || undefined,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error updating status for session trace ${id}:`, error);
      throw error;
    }
  }

  async assignUser(id: string, userId: string): Promise<void> {
    try {
      await this.prisma.sessionTrace.update({
        where: { id },
        data: {
          user_id: userId,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error assigning user ${userId} to session trace ${id}:`, error);
      throw error;
    }
  }

  async assignCertificateRequest(id: string, certificateRequestId: string): Promise<void> {
    try {
      await this.prisma.sessionTrace.update({
        where: { id },
        data: {
          certificate_request_id: certificateRequestId,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error assigning certificate request ${certificateRequestId} to session trace ${id}:`, error);
      throw error;
    }
  }

  async markAsExpired(phoneNumber: string, reason?: string): Promise<void> {
    try {
      const activeStatuses = [
        SessionTraceStatus.INICIADA,
        SessionTraceStatus.EN_PROGRESO,
        SessionTraceStatus.AUTENTICADA,
        SessionTraceStatus.PROCESANDO_CERTIFICADO
      ];

      await this.prisma.sessionTrace.updateMany({
        where: {
          phone_number: phoneNumber,
          status: { in: activeStatuses },
        },
        data: {
          status: SessionTraceStatus.EXPIRADA,
          step_description: reason || 'Sesión expirada por inactividad',
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error marking sessions as expired for phone number ${phoneNumber}:`, error);
      throw error;
    }
  }

  async getUniquePhoneNumbers(): Promise<string[]> {
    try {
      const result = await this.prisma.sessionTrace.groupBy({
        by: ['phone_number'],
        _count: {
          phone_number: true,
        },
      });

      return result.map(item => item.phone_number);
    } catch (error) {
      this.logger.error('Error getting unique phone numbers:', error);
      throw error;
    }
  }

  async getTraceStatistics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    expiredSessions: number;
    byStatus: Record<SessionTraceStatus, number>;
  }> {
    try {
      const totalSessions = await this.prisma.sessionTrace.count();
      
      const activeStatuses = [
        SessionTraceStatus.INICIADA,
        SessionTraceStatus.EN_PROGRESO,
        SessionTraceStatus.AUTENTICADA,
        SessionTraceStatus.PROCESANDO_CERTIFICADO
      ];

      const activeSessions = await this.prisma.sessionTrace.count({
        where: { status: { in: activeStatuses } },
      });

      const completedSessions = await this.prisma.sessionTrace.count({
        where: { status: SessionTraceStatus.FINALIZADA },
      });

      const expiredSessions = await this.prisma.sessionTrace.count({
        where: { status: SessionTraceStatus.EXPIRADA },
      });

      // Obtener conteos por status
      const statusCounts = await this.prisma.sessionTrace.groupBy({
        by: ['status'],
        _count: { status: true },
      });

      const byStatus = {} as Record<SessionTraceStatus, number>;
      Object.values(SessionTraceStatus).forEach(status => {
        byStatus[status] = 0;
      });

      statusCounts.forEach(({ status, _count }) => {
        byStatus[status as SessionTraceStatus] = _count.status;
      });

      return {
        totalSessions,
        activeSessions,
        completedSessions,
        expiredSessions,
        byStatus,
      };
    } catch (error) {
      this.logger.error(`Error getting trace statistics:`, error);
      throw error;
    }
  }
} 