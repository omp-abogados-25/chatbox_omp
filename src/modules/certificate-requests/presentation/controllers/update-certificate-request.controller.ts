import { Controller, Put, Param, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { UpdateCertificateRequestUseCase } from '../../application/use-cases';
import { UpdateCertificateRequestDto, CertificateRequestResponseDto } from '../dtos';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

@ApiTags('Certificate Requests')
@Controller('certificate-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UpdateCertificateRequestController {
  constructor(
    private readonly updateCertificateRequestUseCase: UpdateCertificateRequestUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ 
    summary: 'Actualizar una solicitud de certificado',
    description: 'Actualiza los datos de una solicitud de certificado existente'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la solicitud de certificado',
    example: 'uuid-de-la-solicitud',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Solicitud actualizada exitosamente',
    type: CertificateRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Solicitud no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos o solicitud no se puede actualizar',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de acceso requerido',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCertificateRequestDto
  ): Promise<CertificateRequestResponseDto> {
    const certificateRequest = await this.updateCertificateRequestUseCase.execute({
      id,
      requester_name: updateDto.requester_name,
      requester_document: updateDto.requester_document,
      certificate_type: updateDto.certificate_type,
      request_data: updateDto.request_data,
      interaction_messages: updateDto.interaction_messages,
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