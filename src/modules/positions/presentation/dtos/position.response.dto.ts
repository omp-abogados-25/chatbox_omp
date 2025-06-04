import { ApiProperty } from '@nestjs/swagger';

export class PositionResponseDto {
  @ApiProperty({
    description: 'El identificador único del cargo (UUID).',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'El nombre del cargo o posición.',
    example: 'Desarrollador Backend Senior',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Una descripción detallada del cargo.',
    example: 'Responsable del desarrollo y mantenimiento de los servicios backend...',
    required: false,
    type: String,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'La fecha y hora en que se creó el registro del cargo.',
    example: '2023-10-27T10:30:00.000Z',
    type: Date,
  })
  created_at: Date;

  @ApiProperty({
    description: 'La fecha y hora de la última actualización del registro del cargo.',
    example: '2023-10-28T12:45:00.000Z',
    type: Date,
  })
  updated_at: Date;
} 