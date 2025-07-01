import { Controller, Get, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { FindAllCertificateRequestsUseCase } from '../../application/use-cases';
import { 
  CertificateRequestResponseDto 
} from '../dtos';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';
import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateRequestStatus } from '../../../../whatsapp-webhook/domain/entities';

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class CertificateRequestQueryDto {
  // Parámetros de paginación
  @ApiPropertyOptional({
    description: 'Número de página (empezando desde 1)',
    example: 1,
    minimum: 1,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 1;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 1 : parsed;
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 10;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 10 : parsed;
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    example: 'created_at',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 'created_at';
    return value;
  })
  @IsString()
  @IsOptional()
  orderBy?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Dirección de ordenamiento',
    enum: SortDirection,
    example: SortDirection.DESC,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return SortDirection.DESC;
    return value === 'asc' ? SortDirection.ASC : SortDirection.DESC;
  })
  @IsEnum(SortDirection)
  @IsOptional()
  orderDirection?: SortDirection = SortDirection.DESC;

  // Parámetros de filtros
  @ApiPropertyOptional({
    description: 'Número de WhatsApp del solicitante',
    example: '+573001234567',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return value;
  })
  @IsString()
  @IsOptional()
  whatsapp_number?: string;

  @ApiPropertyOptional({
    description: 'Tipo de certificado',
    example: 'Certificado Laboral',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return value;
  })
  @IsString()
  @IsOptional()
  certificate_type?: string;

  @ApiPropertyOptional({
    description: 'Estado de la solicitud',
    enum: CertificateRequestStatus,
    example: CertificateRequestStatus.PENDING,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return value;
  })
  @IsEnum(CertificateRequestStatus)
  @IsOptional()
  status?: CertificateRequestStatus;

  @ApiPropertyOptional({
    description: 'ID del usuario que procesó la solicitud',
    example: 'uuid-del-usuario',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return value;
  })
  @IsString()
  @IsOptional()
  processed_by_user_id?: string;

  @ApiPropertyOptional({
    description: 'Indica si la solicitud está completada',
    example: true,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  @IsOptional()
  is_completed?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el documento fue enviado',
    example: false,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  @IsOptional()
  document_sent?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha desde (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return value;
  })
  @IsDateString()
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return value;
  })
  @IsDateString()
  @IsOptional()
  date_to?: string;

  @ApiPropertyOptional({
    description: 'Término de búsqueda general (nombre, documento, tipo, etc.)',
    example: 'Juan certificado',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return value;
  })
  @IsString()
  @IsOptional()
  search?: string;
}

export class PaginatedCertificateRequestsResponseDto {
  data: CertificateRequestResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@ApiTags('Certificate Requests')
@Controller('certificate-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FindAllCertificateRequestsController {
  constructor(
    private readonly findAllCertificateRequestsUseCase: FindAllCertificateRequestsUseCase,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todas las solicitudes de certificados',
    description: 'Obtiene una lista paginada de solicitudes de certificados con filtros opcionales'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de solicitudes obtenida exitosamente',
    type: PaginatedCertificateRequestsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de acceso requerido',
  })
  async findAll(
    @Query() query: CertificateRequestQueryDto
  ): Promise<PaginatedCertificateRequestsResponseDto> {
    // Separar filtros de paginación
    const filters = {
      whatsapp_number: query.whatsapp_number,
      certificate_type: query.certificate_type,
      status: query.status,
      processed_by_user_id: query.processed_by_user_id,
      is_completed: query.is_completed,
      document_sent: query.document_sent,
      date_from: query.date_from ? new Date(query.date_from) : undefined,
      date_to: query.date_to ? new Date(query.date_to) : undefined,
      search: query.search,
    };

    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
      orderBy: query.orderBy || 'created_at',
      orderDirection: query.orderDirection || SortDirection.DESC,
    };

    const result = await this.findAllCertificateRequestsUseCase.execute({
      filters,
      pagination,
    });

    return {
      data: result.data.map(request => this.mapToResponseDto(request)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private mapToResponseDto(certificateRequest: CertificateRequest): CertificateRequestResponseDto {
    return {
      id: certificateRequest.id,
      whatsapp_number: certificateRequest.whatsapp_number,
      requester_name: certificateRequest.requester_name,
      requester_document: certificateRequest.requester_document,
      certificate_type: certificateRequest.certificate_type,
      request_data: certificateRequest.request_data,
      interaction_messages: certificateRequest.interaction_messages,
      status: certificateRequest.status,
      document_generated: certificateRequest.document_generated,
      document_sent: certificateRequest.document_sent,
      is_completed: certificateRequest.is_completed,
      completion_reason: certificateRequest.completion_reason,
      error_message: certificateRequest.error_message,
      processed_by_user_id: certificateRequest.processed_by_user_id,
      processing_started_at: certificateRequest.processing_started_at,
      processing_ended_at: certificateRequest.processing_ended_at,
      created_at: certificateRequest.created_at,
      updated_at: certificateRequest.updated_at,
    };
  }
} 