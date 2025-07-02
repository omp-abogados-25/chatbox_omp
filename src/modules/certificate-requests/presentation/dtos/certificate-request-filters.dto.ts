import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CertificateRequestStatus } from '../../../../whatsapp-webhook/domain/entities';

export class CertificateRequestFiltersDto {
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