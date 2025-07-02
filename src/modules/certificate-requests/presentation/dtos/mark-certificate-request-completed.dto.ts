import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkCertificateRequestCompletedDto {
  @ApiPropertyOptional({
    description: 'Ruta o URL del documento generado',
    example: '/documents/certificado-laboral-12345.pdf',
  })
  @IsString()
  @IsOptional()
  documentPath?: string;

  @ApiPropertyOptional({
    description: 'Razón de completación',
    example: 'Certificado laboral generado y enviado exitosamente',
  })
  @IsString()
  @IsOptional()
  completionReason?: string;
} 