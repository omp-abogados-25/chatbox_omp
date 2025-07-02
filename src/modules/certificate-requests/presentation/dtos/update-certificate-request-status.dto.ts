import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateRequestStatus } from '../../../../whatsapp-webhook/domain/entities';

export class UpdateCertificateRequestStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la solicitud',
    enum: CertificateRequestStatus,
    example: CertificateRequestStatus.IN_PROGRESS,
  })
  @IsEnum(CertificateRequestStatus)
  status: CertificateRequestStatus;

  @ApiPropertyOptional({
    description: 'ID del usuario que está procesando la solicitud',
    example: 'uuid-del-usuario',
  })
  @IsString()
  @IsOptional()
  userId?: string;
} 