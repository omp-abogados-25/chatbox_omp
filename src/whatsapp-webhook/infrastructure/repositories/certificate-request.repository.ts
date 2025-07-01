import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { 
  CertificateRequest, 
  CertificateRequestData, 
  CertificateRequestStatus 
} from '../../domain/entities/certificate-request.entity';
import {
  CertificateRequestRepository,
  CertificateRequestFilters,
  CertificateRequestPagination,
  PaginatedCertificateRequests
} from '../../domain/interfaces/certificate-request-repository.interface';

@Injectable()
export class PrismaCertificateRequestRepository implements CertificateRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    whatsapp_number: string,
    certificate_type: string,
    requester_name?: string,
    requester_document?: string,
    request_data?: any,
    interaction_messages?: any
  ): Promise<CertificateRequest> {
    const dbCertificateRequest = await this.prisma.certificateRequest.create({
      data: {
        whatsapp_number,
        certificate_type,
        requester_name,
        requester_document,
        request_data,
        interaction_messages,
        status: CertificateRequestStatus.PENDING,
        document_sent: false,
        is_completed: false,
      },
    });

    return this.mapToDomain(dbCertificateRequest);
  }

  async findById(id: string): Promise<CertificateRequest | null> {
    const dbCertificateRequest = await this.prisma.certificateRequest.findUnique({
      where: { id },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return dbCertificateRequest ? this.mapToDomain(dbCertificateRequest) : null;
  }

  async findByWhatsAppNumber(whatsapp_number: string): Promise<CertificateRequest[]> {
    const dbCertificateRequests = await this.prisma.certificateRequest.findMany({
      where: { whatsapp_number },
      orderBy: { created_at: 'desc' },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return dbCertificateRequests.map(req => this.mapToDomain(req));
  }

  async findAll(
    filters?: CertificateRequestFilters,
    pagination?: CertificateRequestPagination
  ): Promise<PaginatedCertificateRequests> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(pagination);

    const [total, data] = await Promise.all([
      this.prisma.certificateRequest.count({ where }),
      this.prisma.certificateRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          processed_by_user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map(req => this.mapToDomain(req)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(id: string, updates: Partial<CertificateRequest>): Promise<CertificateRequest> {
    const updateData = this.mapToUpdateData(updates);
    
    const dbCertificateRequest = await this.prisma.certificateRequest.update({
      where: { id },
      data: updateData,
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return this.mapToDomain(dbCertificateRequest);
  }

  async updateStatus(id: string, status: CertificateRequestStatus, userId?: string): Promise<CertificateRequest> {
    const updateData: any = { status };
    
    if (status === CertificateRequestStatus.IN_PROGRESS) {
      updateData.processing_started_at = new Date();
      if (userId) {
        updateData.processed_by_user_id = userId;
      }
    }

    const dbCertificateRequest = await this.prisma.certificateRequest.update({
      where: { id },
      data: updateData,
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return this.mapToDomain(dbCertificateRequest);
  }

  async markAsCompleted(
    id: string, 
    documentPath?: string, 
    completionReason?: string
  ): Promise<CertificateRequest> {
    const dbCertificateRequest = await this.prisma.certificateRequest.update({
      where: { id },
      data: {
        status: CertificateRequestStatus.COMPLETED,
        is_completed: true,
        document_generated: documentPath,
        completion_reason: completionReason || 'Procesado exitosamente',
        processing_ended_at: new Date(),
      },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return this.mapToDomain(dbCertificateRequest);
  }

  async markAsFailed(id: string, errorMessage: string): Promise<CertificateRequest> {
    const dbCertificateRequest = await this.prisma.certificateRequest.update({
      where: { id },
      data: {
        status: CertificateRequestStatus.FAILED,
        is_completed: true,
        error_message: errorMessage,
        completion_reason: 'Error en el procesamiento',
        processing_ended_at: new Date(),
      },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return this.mapToDomain(dbCertificateRequest);
  }

  async markDocumentAsSent(id: string): Promise<CertificateRequest> {
    const dbCertificateRequest = await this.prisma.certificateRequest.update({
      where: { id },
      data: { document_sent: true },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return this.mapToDomain(dbCertificateRequest);
  }

  async updateInteractionMessages(id: string, messages: any): Promise<CertificateRequest> {
    const dbCertificateRequest = await this.prisma.certificateRequest.update({
      where: { id },
      data: { interaction_messages: messages },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return this.mapToDomain(dbCertificateRequest);
  }

  async updateRequestData(id: string, data: any): Promise<CertificateRequest> {
    const existing = await this.prisma.certificateRequest.findUnique({
      where: { id },
      select: { request_data: true },
    });

    const existingData = (existing?.request_data as Record<string, any>) || {};
    const mergedData = { ...existingData, ...data };

    const dbCertificateRequest = await this.prisma.certificateRequest.update({
      where: { id },
      data: { request_data: mergedData },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return this.mapToDomain(dbCertificateRequest);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.certificateRequest.delete({
      where: { id },
    });
  }

  async getStatistics(dateFrom?: Date, dateTo?: Date): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
    waiting_info: number;
    documents_generated: number;
    documents_sent: number;
  }> {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = dateFrom;
      if (dateTo) where.created_at.lte = dateTo;
    }

    const [
      total,
      pending,
      in_progress,
      completed,
      failed,
      cancelled,
      waiting_info,
      documents_generated,
      documents_sent,
    ] = await Promise.all([
      this.prisma.certificateRequest.count({ where }),
      this.prisma.certificateRequest.count({ where: { ...where, status: CertificateRequestStatus.PENDING } }),
      this.prisma.certificateRequest.count({ where: { ...where, status: CertificateRequestStatus.IN_PROGRESS } }),
      this.prisma.certificateRequest.count({ where: { ...where, status: CertificateRequestStatus.COMPLETED } }),
      this.prisma.certificateRequest.count({ where: { ...where, status: CertificateRequestStatus.FAILED } }),
      this.prisma.certificateRequest.count({ where: { ...where, status: CertificateRequestStatus.CANCELLED } }),
      this.prisma.certificateRequest.count({ where: { ...where, status: CertificateRequestStatus.WAITING_INFO } }),
      this.prisma.certificateRequest.count({ where: { ...where, document_generated: { not: null } } }),
      this.prisma.certificateRequest.count({ where: { ...where, document_sent: true } }),
    ]);

    return {
      total,
      pending,
      in_progress,
      completed,
      failed,
      cancelled,
      waiting_info,
      documents_generated,
      documents_sent,
    };
  }

  async findPendingRequests(limit?: number): Promise<CertificateRequest[]> {
    const dbCertificateRequests = await this.prisma.certificateRequest.findMany({
      where: {
        OR: [
          { status: CertificateRequestStatus.PENDING },
          { status: CertificateRequestStatus.WAITING_INFO },
        ],
      },
      orderBy: { created_at: 'asc' },
      take: limit,
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return dbCertificateRequests.map(req => this.mapToDomain(req));
  }

  async findByCertificateType(certificateType: string): Promise<CertificateRequest[]> {
    const dbCertificateRequests = await this.prisma.certificateRequest.findMany({
      where: { certificate_type: certificateType },
      orderBy: { created_at: 'desc' },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return dbCertificateRequests.map(req => this.mapToDomain(req));
  }

  async search(searchTerm: string, pagination?: CertificateRequestPagination): Promise<PaginatedCertificateRequests> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { whatsapp_number: { contains: searchTerm, mode: 'insensitive' as const } },
        { requester_name: { contains: searchTerm, mode: 'insensitive' as const } },
        { requester_document: { contains: searchTerm, mode: 'insensitive' as const } },
        { certificate_type: { contains: searchTerm, mode: 'insensitive' as const } },
        { completion_reason: { contains: searchTerm, mode: 'insensitive' as const } },
      ],
    };

    const orderBy = this.buildOrderBy(pagination);

    const [total, data] = await Promise.all([
      this.prisma.certificateRequest.count({ where }),
      this.prisma.certificateRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          processed_by_user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map(req => this.mapToDomain(req)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async assignRequesterUser(id: string, userId: string): Promise<CertificateRequest> {
    const dbCertificateRequest = await this.prisma.certificateRequest.update({
      where: { id },
      data: { requester_user_id: userId },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        requester_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            identification_number: true,
          },
        },
      },
    });

    return this.mapToDomain(dbCertificateRequest);
  }

  async assignRequesterUserByWhatsApp(whatsappNumber: string, userId: string): Promise<CertificateRequest[]> {
    // Actualizar todas las solicitudes del número de WhatsApp que no tengan usuario asignado
    await this.prisma.certificateRequest.updateMany({
      where: {
        whatsapp_number: whatsappNumber,
        requester_user_id: null,
      },
      data: { requester_user_id: userId },
    });

    // Obtener las solicitudes actualizadas
    const dbCertificateRequests = await this.prisma.certificateRequest.findMany({
      where: { 
        whatsapp_number: whatsappNumber,
        requester_user_id: userId,
      },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        requester_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            identification_number: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return dbCertificateRequests.map(req => this.mapToDomain(req));
  }

  async findUserByIdentificationNumber(identificationNumber: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { identification_number: identificationNumber },
      select: {
        id: true,
        full_name: true,
        email: true,
        identification_number: true,
        position: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

  async findByRequesterUserId(userId: string): Promise<CertificateRequest[]> {
    const dbCertificateRequests = await this.prisma.certificateRequest.findMany({
      where: { requester_user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        processed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        requester_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            identification_number: true,
          },
        },
      },
    });

    return dbCertificateRequests.map(req => this.mapToDomain(req));
  }

  // Métodos auxiliares privados
  private buildWhereClause(filters?: CertificateRequestFilters): any {
    if (!filters) return {};

    const where: any = {};

    if (filters.whatsapp_number) {
      where.whatsapp_number = filters.whatsapp_number;
    }

    if (filters.certificate_type) {
      where.certificate_type = filters.certificate_type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.requester_user_id) {
      where.requester_user_id = filters.requester_user_id;
    }

    if (filters.processed_by_user_id) {
      where.processed_by_user_id = filters.processed_by_user_id;
    }

    if (filters.is_completed !== undefined) {
      where.is_completed = filters.is_completed;
    }

    if (filters.document_sent !== undefined) {
      where.document_sent = filters.document_sent;
    }

    if (filters.date_from || filters.date_to) {
      where.created_at = {};
      if (filters.date_from) where.created_at.gte = filters.date_from;
      if (filters.date_to) where.created_at.lte = filters.date_to;
    }

    if (filters.search) {
      where.OR = [
        { whatsapp_number: { contains: filters.search, mode: 'insensitive' } },
        { requester_name: { contains: filters.search, mode: 'insensitive' } },
        { requester_document: { contains: filters.search, mode: 'insensitive' } },
        { certificate_type: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(pagination?: CertificateRequestPagination): any {
    if (!pagination?.orderBy) {
      return { created_at: 'desc' };
    }

    return {
      [pagination.orderBy]: pagination.orderDirection || 'desc',
    };
  }

  private mapToDomain(dbCertificateRequest: any): CertificateRequest {
    const data: CertificateRequestData = {
      id: dbCertificateRequest.id,
      whatsapp_number: dbCertificateRequest.whatsapp_number,
      requester_name: dbCertificateRequest.requester_name,
      requester_document: dbCertificateRequest.requester_document,
      certificate_type: dbCertificateRequest.certificate_type,
      request_data: dbCertificateRequest.request_data,
      interaction_messages: dbCertificateRequest.interaction_messages,
      status: dbCertificateRequest.status as CertificateRequestStatus,
      document_generated: dbCertificateRequest.document_generated,
      document_sent: dbCertificateRequest.document_sent,
      is_completed: dbCertificateRequest.is_completed,
      completion_reason: dbCertificateRequest.completion_reason,
      error_message: dbCertificateRequest.error_message,
      requester_user_id: dbCertificateRequest.requester_user_id,
      processed_by_user_id: dbCertificateRequest.processed_by_user_id,
      processing_started_at: dbCertificateRequest.processing_started_at,
      processing_ended_at: dbCertificateRequest.processing_ended_at,
      created_at: dbCertificateRequest.created_at,
      updated_at: dbCertificateRequest.updated_at,
    };

    return CertificateRequest.fromData(data);
  }

  private mapToUpdateData(updates: Partial<CertificateRequest>): any {
    const updateData: any = {};

    // Solo mapear campos que se pueden actualizar directamente
    const allowedUpdates = [
      'requester_name',
      'requester_document',
      'certificate_type',
      'request_data',
      'interaction_messages',
      'status',
      'document_generated',
      'document_sent',
      'is_completed',
      'completion_reason',
      'error_message',
      'processed_by_user_id',
      'processing_started_at',
      'processing_ended_at',
    ];

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedUpdates.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    });

    return updateData;
  }
} 