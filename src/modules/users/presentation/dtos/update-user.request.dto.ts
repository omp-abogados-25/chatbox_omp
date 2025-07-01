import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length, IsUUID, IsBoolean, ValidateIf, IsNotEmpty } from 'class-validator';

export class UpdateUserRequestDto {
  @ApiPropertyOptional({ description: 'Nombre Completo del usuario.', example: 'Juan Alberto Pérez' })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  full_name?: string;

  @ApiPropertyOptional({ description: 'Cédula del usuario.', example: '1098765432' })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  identification_number?: string;

  @ApiPropertyOptional({ description: 'Lugar de Expedición de la cédula.', example: 'Medellín' })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  issuing_place?: string;

  @ApiPropertyOptional({ description: 'Fecha de Ingreso del usuario.', example: '2023-02-01' })
  @IsOptional()
  @IsString()
  entry_date?: string;

  @ApiPropertyOptional({ description: 'Salario del usuario.', example: '3600000' })
  @IsOptional()
  @IsString()
  salary?: string;

  @ApiPropertyOptional({ description: 'Auxilio de Transporte del usuario.', example: '150000' })
  @IsOptional()
  @IsString()
  transportation_allowance?: string;

  @ApiPropertyOptional({
    description: 'Género del usuario. M = Masculino, F = Femenino',
    example: 'M',
  })
  @IsOptional()
  @IsString({ message: 'El género debe ser una cadena de texto.' })
  gender?: string;

  @ApiPropertyOptional({
    description: 'Indica si el usuario puede iniciar sesión',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo can_login debe ser un valor booleano.' })
  can_login?: boolean;

  @ApiPropertyOptional({
    description: 'Contraseña del usuario (obligatoria si can_login es true)',
    example: 'password123',
  })
  @IsOptional()
  @ValidateIf((obj) => obj.can_login === true)
  @IsNotEmpty({ message: 'La contraseña es obligatoria cuando el usuario puede iniciar sesión.' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @Length(6, 100, { message: 'La contraseña debe tener entre 6 y 100 caracteres.' })
  password?: string;

  @ApiPropertyOptional({
    description: 'ID del Cargo asignado al usuario (UUID).',
    example: 'b2c3d4e5-f6g7-8901-2345-67890abcdef1',
    format: 'uuid',
    nullable: true, 
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del cargo debe ser un UUID válido.' })
  positionId?: string | null;
} 