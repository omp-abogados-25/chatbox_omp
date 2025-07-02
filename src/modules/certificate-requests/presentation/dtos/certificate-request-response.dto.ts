import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateRequestStatus } from '../../../../whatsapp-webhook/domain/entities';

export class CertificateRequestResponseDto {
  @ApiProperty({
    description: 'ID único de la solicitud',
    example: 'uuid-de-la-solicitud',
  })
  id: string;

  @ApiProperty({
    description: 'Número de WhatsApp que realizó la solicitud',
    example: '+573001234567',
  })
  whatsapp_number: string;

  @ApiPropertyOptional({
    description: 'Nombre del solicitante',
    example: 'Juan Pérez',
  })
  requester_name?: string;

  @ApiPropertyOptional({
    description: 'Documento del solicitante',
    example: '12345678',
  })
  requester_document?: string;

  @ApiProperty({
    description: 'Tipo de certificado solicitado',
    example: 'Certificado Laboral',
  })
  certificate_type: string;

  @ApiPropertyOptional({
    description: 'Datos adicionales de la solicitud',
  })
  request_data?: any;

  @ApiPropertyOptional({
    description: 'Historial de mensajes de la interacción',
  })
  interaction_messages?: any;

  @ApiProperty({
    description: 'Estado actual de la solicitud',
    enum: CertificateRequestStatus,
    example: CertificateRequestStatus.PENDING,
  })
  status: CertificateRequestStatus;

  @ApiPropertyOptional({
    description: 'Ruta o URL del documento generado',
    example: '/documents/certificado-laboral-12345.pdf',
  })
  document_generated?: string;

  @ApiProperty({
    description: 'Indica si el documento fue enviado',
    example: false,
  })
  document_sent: boolean;

  @ApiProperty({
    description: 'Indica si la solicitud finalizó',
    example: false,
  })
  is_completed: boolean;

  @ApiPropertyOptional({
    description: 'Razón de finalización',
    example: 'Procesado exitosamente',
  })
  completion_reason?: string;

  @ApiPropertyOptional({
    description: 'Mensaje de error si la solicitud falló',
    example: 'Error al generar el documento',
  })
  error_message?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario solicitante',
    example: 'uuid-del-usuario-solicitante',
  })
  requester_user_id?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario que procesó la solicitud',
    example: 'uuid-del-usuario',
  })
  processed_by_user_id?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de inicio del procesamiento',
    example: '2024-01-15T10:30:00.000Z',
  })
  processing_started_at?: Date;

  @ApiPropertyOptional({
    description: 'Fecha y hora de finalización del procesamiento',
    example: '2024-01-15T10:45:00.000Z',
  })
  processing_ended_at?: Date;

  @ApiProperty({
    description: 'Fecha de creación de la solicitud',
    example: '2024-01-15T10:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-15T10:45:00.000Z',
  })
  updated_at: Date;
} 