import { ApiProperty } from '@nestjs/swagger';

export class RoleFunctionResponseDto {
  @ApiProperty({
    description: 'El identificador único de la función (UUID).',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Los detalles o descripción principal de la función.',
    example: 'Gestionar reportes de ventas',
    type: String,
  })
  details: string;

  @ApiProperty({
    description: 'Notas o descripción adicional de la función.',
    example: 'Esta función incluye la generación de reportes diarios y mensuales.',
    required: false,
    type: String,
    nullable: true,
  })
  notes?: string | null;

  @ApiProperty({
    description: 'La fecha y hora en que se creó el registro de la función.',
    example: '2023-10-27T10:30:00.000Z',
    type: Date,
  })
  created_at: Date;

  @ApiProperty({
    description: 'La fecha y hora de la última actualización del registro de la función.',
    example: '2023-10-28T12:45:00.000Z',
    type: Date,
  })
  updated_at: Date;
} 