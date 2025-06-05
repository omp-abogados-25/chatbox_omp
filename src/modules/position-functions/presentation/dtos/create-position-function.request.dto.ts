import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePositionFunctionRequestDto {
  @ApiProperty({
    description: 'El UUID de la Posición a vincular.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    type: String,
    format: 'uuid',
  })
  @IsNotEmpty({ message: 'El ID de la posición no puede estar vacío.' })
  @IsUUID('4', { message: 'El ID de la posición debe ser un UUID válido.' })
  positionId: string;

  @ApiProperty({
    description: 'El UUID de la Función de Rol a vincular.',
    example: 'e0f1g2h3-i4j5-k6l7-m8n9-o0p1q2r3s4t5',
    type: String,
    format: 'uuid',
  })
  @IsNotEmpty({ message: 'El ID de la función de rol no puede estar vacío.' })
  @IsUUID('4', { message: 'El ID de la función de rol debe ser un UUID válido.' })
  roleFunctionId: string;
} 