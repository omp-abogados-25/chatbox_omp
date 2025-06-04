import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

/**
 * DTO para la solicitud de actualización de una Posición.
 * Todos los campos son opcionales.
 */
export class UpdatePositionRequestDto {
  @ApiPropertyOptional({
    description: 'El nuevo nombre del cargo o posición.',
    example: 'Ingeniero de Software Principal',
    type: String,
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'El nombre del cargo debe ser una cadena de texto.' })
  @Length(3, 100, { message: 'El nombre del cargo debe tener entre 3 y 100 caracteres.' })
  name?: string;

  @ApiPropertyOptional({
    description: 'La nueva descripción detallada del cargo.',
    example: 'Liderar el equipo de desarrollo backend y definir la arquitectura...',
    type: String,
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @Length(0, 500, { message: 'La descripción no puede exceder los 500 caracteres.' })
  description?: string | null;
} 