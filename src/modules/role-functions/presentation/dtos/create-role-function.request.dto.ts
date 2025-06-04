import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

/**
 * DTO para la solicitud de creación de una Función de Rol.
 */
export class CreateRoleFunctionRequestDto {
  @ApiProperty({
    description: 'Los detalles o descripción principal de la función.',
    example: 'Gestionar reportes de ventas',
    type: String,
    minLength: 3,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Los detalles de la función no pueden estar vacíos.' })
  @IsString({ message: 'Los detalles de la función deben ser una cadena de texto.' })
  @Length(3, 255, { message: 'Los detalles de la función deben tener entre 3 y 255 caracteres.' })
  details: string;

  @ApiPropertyOptional({
    description: 'Notas o descripción adicional de la función (opcional).',
    example: 'Esta función incluye la generación de reportes diarios y mensuales.',
    type: String,
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto.' })
  @Length(0, 500, { message: 'Las notas no pueden exceder los 500 caracteres.' })
  notes?: string | null;
} 