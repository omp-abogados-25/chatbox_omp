import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdatePositionFunctionRequestDto {
  @ApiPropertyOptional({
    description: 'El nuevo UUID de la Posición a vincular (opcional).',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la posición debe ser un UUID válido.' })
  positionId?: string;

  @ApiPropertyOptional({
    description: 'El nuevo UUID de la Función de Rol a vincular (opcional).',
    example: 'e0f1g2h3-i4j5-k6l7-m8n9-o0p1q2r3s4t5',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la función de rol debe ser un UUID válido.' })
  roleFunctionId?: string;
} 