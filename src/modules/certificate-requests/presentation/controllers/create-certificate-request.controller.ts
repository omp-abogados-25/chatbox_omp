import { Controller, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CreateCertificateRequestUseCase } from '../../application/use-cases';
import { CreateCertificateRequestDto, CertificateRequestResponseDto } from '../dtos';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

@ApiTags('Certificate Requests')
@Controller('certificate-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreateCertificateRequestController {
  constructor(
    private readonly createCertificateRequestUseCase: CreateCertificateRequestUseCase,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Crear una nueva solicitud de certificado',
    description: 'Crea una nueva solicitud de certificado desde WhatsApp'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Solicitud de certificado creada exitosamente',
    type: CertificateRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de acceso requerido',
  })
  async create(@Body() createDto: CreateCertificateRequestDto): Promise<CertificateRequestResponseDto> {
    const certificateRequest = await this.createCertificateRequestUseCase.execute({
      whatsapp_number: createDto.whatsapp_number,
      certificate_type: createDto.certificate_type,
      requester_name: createDto.requester_name,
      requester_document: createDto.requester_document,
      request_data: createDto.request_data,
      interaction_messages: createDto.interaction_messages,
    });

    return this.mapToResponseDto(certificateRequest);
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