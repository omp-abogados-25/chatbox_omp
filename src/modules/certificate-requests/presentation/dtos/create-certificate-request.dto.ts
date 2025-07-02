import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificateRequestDto {
  @ApiProperty({
    description: 'Número de WhatsApp que realizó la solicitud',
    example: '+573001234567',
  })
  @IsString()
  @IsNotEmpty()
  whatsapp_number: string;

  @ApiProperty({
    description: 'Tipo de certificado solicitado',
    example: 'Certificado Laboral',
  })
  @IsString()
  @IsNotEmpty()
  certificate_type: string;

  @ApiPropertyOptional({
    description: 'Nombre del solicitante',
    example: 'Juan Pérez',
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
    description: 'Datos adicionales de la solicitud en formato JSON',
    example: { departamento: 'Recursos Humanos', urgente: true },
  })
  @IsObject()
  @IsOptional()
  request_data?: any;

  @ApiPropertyOptional({
    description: 'Historial de mensajes de la interacción',
    example: [
      { role: 'user', message: 'Necesito un certificado laboral' },
      { role: 'bot', message: '¿Para qué fecha lo necesita?' }
    ],
  })
  @IsObject()
  @IsOptional()
  interaction_messages?: any;
} 