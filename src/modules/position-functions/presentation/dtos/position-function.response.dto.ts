import { ApiProperty } from '@nestjs/swagger';

export class PositionFunctionResponseDto {
  @ApiProperty({
    description: 'El identificador único de la relación Posición-Función (UUID).',
    example: 'f1g2h3i4-j5k6-l7m8-n9o0-p1q2r3s4t5u6',
    type: String,
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'El UUID de la Posición vinculada.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    type: String,
    format: 'uuid',
  })
  positionId: string;

  @ApiProperty({
    description: 'El UUID de la Función de Rol vinculada.',
    example: 'e0f1g2h3-i4j5-k6l7-m8n9-o0p1q2r3s4t5',
    type: String,
    format: 'uuid',
  })
  roleFunctionId: string;

  @ApiProperty({
    description: 'La fecha y hora en que se creó el registro de la relación.',
    example: '2023-10-27T10:30:00.000Z',
    type: Date,
  })
  created_at: Date;

  @ApiProperty({
    description: 'La fecha y hora de la última actualización del registro de la relación.',
    example: '2023-10-28T12:45:00.000Z',
    type: Date,
  })
  updated_at: Date;
} 