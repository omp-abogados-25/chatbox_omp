import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

/**
 * DTO para la solicitud de actualización de una Función de Rol.
 * Todos los campos son opcionales.
 */
export class UpdateRoleFunctionRequestDto {
  @ApiPropertyOptional({
    description: 'Los nuevos detalles o descripción principal de la función.',
    example: 'Gestionar y optimizar reportes de ventas existentes',
    type: String,
    minLength: 3,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Los detalles de la función deben ser una cadena de texto.' })
  @Length(3, 255, { message: 'Los detalles de la función deben tener entre 3 y 255 caracteres.' })
  details?: string;

  @ApiPropertyOptional({
    description: 'Las nuevas notas o descripción adicional de la función.',
    example: 'Incluye la revisión de KPIs y la propuesta de mejoras.',
    type: String,
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto.' })
  @Length(0, 500, { message: 'Las notas no pueden exceder los 500 caracteres.' })
  notes?: string | null;
} 