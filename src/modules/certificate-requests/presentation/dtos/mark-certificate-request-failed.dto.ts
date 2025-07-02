import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkCertificateRequestFailedDto {
  @ApiProperty({
    description: 'Mensaje de error detallado',
    example: 'No se pudo generar el certificado: faltan datos del empleado',
  })
  @IsString()
  @IsNotEmpty()
  errorMessage: string;
} 