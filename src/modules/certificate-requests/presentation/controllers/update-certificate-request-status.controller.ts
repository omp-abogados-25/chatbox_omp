import { Controller, Patch, Param, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { UpdateCertificateRequestStatusUseCase } from '../../application/use-cases';
import { UpdateCertificateRequestStatusDto, CertificateRequestResponseDto } from '../dtos';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

@ApiTags('Certificate Requests')
@Controller('certificate-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UpdateCertificateRequestStatusController {
  constructor(
    private readonly updateStatusUseCase: UpdateCertificateRequestStatusUseCase,
  ) {}

  @Patch(':id/status')
  @ApiOperation({ 
    summary: 'Actualizar el estado de una solicitud',
    description: 'Cambia el estado de una solicitud de certificado'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la solicitud de certificado',
    example: 'uuid-de-la-solicitud',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado actualizado exitosamente',
    type: CertificateRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Solicitud no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Transición de estado no permitida',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de acceso requerido',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCertificateRequestStatusDto,
    @CurrentUser() user: any
  ): Promise<CertificateRequestResponseDto> {
    const certificateRequest = await this.updateStatusUseCase.execute({
      id,
      status: updateStatusDto.status,
      userId: updateStatusDto.userId || user?.id,
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