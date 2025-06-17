import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'Identificador único del usuario (UUID).', example: 'c3d4e5f6-g7h8-9012-3456-7890abcdef12' })
  id: string;

  @ApiProperty({ description: 'Nombre Completo del usuario.', example: 'Juan Pérez' })
  full_name: string;

  @ApiProperty({ description: 'Cédula del usuario.', example: '1234567890' })
  identification_number: string;

  @ApiProperty({ description: 'Lugar de Expedición de la cédula.', example: 'Bogotá D.C.' })
  issuing_place: string;

  @ApiProperty({ description: 'Correo electrónico del usuario.', example: 'juan.perez@example.com' })
  email: string;

  @ApiProperty({ description: 'Fecha de Ingreso del usuario a la empresa.', example: '2023-01-15' })
  entry_date: string;

  @ApiProperty({ description: 'Salario del usuario.', example: '3500000' })
  salary: string;

  @ApiProperty({ description: 'Auxilio de Transporte del usuario.', example: '140000' })
  transportation_allowance: string;

  @ApiProperty({ 
    description: 'Género del usuario. M = Masculino, F = Femenino', 
    example: 'M'
  })
  gender: string;

  @ApiPropertyOptional({
    description: 'ID del Cargo asignado al usuario (UUID).',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    format: 'uuid',
    nullable: true,
  })
  positionId?: string | null;

  @ApiProperty({ description: 'Fecha de creación del registro.', example: '2023-10-27T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ description: 'Fecha de última actualización del registro.', example: '2023-10-28T12:45:00.000Z' })
  updated_at: Date;
} 