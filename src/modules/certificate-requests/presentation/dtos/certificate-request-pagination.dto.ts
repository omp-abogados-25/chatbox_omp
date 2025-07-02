import { IsNumber, IsOptional, IsString, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class CertificateRequestPaginationDto {
  @ApiPropertyOptional({
    description: 'Número de página (empezando desde 1)',
    example: 1,
    minimum: 1,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 1;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 1 : parsed;
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 10;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 10 : parsed;
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    example: 'created_at',
    enum: [
      'created_at',
      'updated_at',
      'whatsapp_number',
      'certificate_type',
      'status',
      'requester_name',
      'processing_started_at',
      'processing_ended_at'
    ],
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 'created_at';
    return value;
  })
  @IsString()
  @IsOptional()
  orderBy?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Dirección de ordenamiento',
    enum: SortDirection,
    example: SortDirection.DESC,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return SortDirection.DESC;
    return value === 'asc' ? SortDirection.ASC : SortDirection.DESC;
  })
  @IsEnum(SortDirection)
  @IsOptional()
  orderDirection?: SortDirection = SortDirection.DESC;
} 