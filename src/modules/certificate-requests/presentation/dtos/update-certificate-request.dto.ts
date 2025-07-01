import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCertificateRequestDto {
  @ApiPropertyOptional({
    description: 'Nombre del solicitante',
    example: 'Juan Pérez García',
  })
  @IsString()
  @IsOptional()
  requester_name?: string;

  @ApiPropertyOptional({
    description: 'Documento del solicitante',
    example: '12345678',
  })
  @IsString()
  @IsOptional()
  requester_document?: string;

  @ApiPropertyOptional({
    description: 'Tipo de certificado solicitado',
    example: 'Certificado de Ingresos y Retenciones',
  })
  @IsString()
  @IsOptional()
  certificate_type?: string;

  @ApiPropertyOptional({
    description: 'Datos adicionales de la solicitud en formato JSON',
    example: { departamento: 'Contabilidad', urgente: false },
  })
  @IsObject()
  @IsOptional()
  request_data?: any;

  @ApiPropertyOptional({
    description: 'Historial de mensajes de la interacción',
    example: [
      { role: 'user', message: 'Necesito cambiar el tipo de certificado' },
      { role: 'bot', message: 'Por favor especifique el nuevo tipo' }
    ],
  })
  @IsObject()
  @IsOptional()
  interaction_messages?: any;
} 