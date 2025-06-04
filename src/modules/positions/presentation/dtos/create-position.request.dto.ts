import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

/**
 * DTO para la solicitud de creación de una Posición.
 */
export class CreatePositionRequestDto {
  @ApiProperty({
    description: 'El nombre del cargo o posición.',
    example: 'Desarrollador Backend Senior',
    type: String,
    minLength: 3,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'El nombre del cargo no puede estar vacío.' })
  @IsString({ message: 'El nombre del cargo debe ser una cadena de texto.' })
  @Length(3, 100, { message: 'El nombre del cargo debe tener entre 3 y 100 caracteres.' })
  name: string;

  @ApiPropertyOptional({
    description: 'Una descripción detallada del cargo (opcional).',
    example: 'Responsable del desarrollo y mantenimiento de los servicios backend...',
    type: String,
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @Length(0, 500, { message: 'La descripción no puede exceder los 500 caracteres.' })
  description?: string | null;
} 