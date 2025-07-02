import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Length, IsUUID, IsEmail, IsBoolean, ValidateIf } from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({ description: 'Nombre Completo del usuario.', example: 'Juan Pérez' })
  @IsNotEmpty({ message: 'El nombre completo no puede estar vacío.' })
  @IsString()
  @Length(3, 100)
  full_name: string;

  @ApiProperty({ description: 'Cédula del usuario.', example: '1234567890' })
  @IsNotEmpty({ message: 'El número de identificación no puede estar vacío.' })
  @IsString()
  @Length(5, 20)
  identification_number: string;

  @ApiProperty({ description: 'Lugar de Expedición de la cédula.', example: 'Bogotá D.C.' })
  @IsNotEmpty({ message: 'El lugar de expedición no puede estar vacío.' })
  @IsString()
  @Length(3, 100)
  issuing_place: string;

  @ApiProperty({ description: 'Correo electrónico del usuario.', example: 'juan.perez@example.com' })
  @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío.' })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido.' })
  @IsString()
  @Length(5, 100, { message: 'El correo electrónico debe tener entre 5 y 100 caracteres.' })
  email: string;

  @ApiProperty({ description: 'Fecha de Ingreso del usuario a la empresa.', example: '2023-01-15' })
  @IsNotEmpty({ message: 'La fecha de ingreso no puede estar vacía.' })
  @IsString() // O IsDateString si se requiere un formato de fecha específico y validación
  entry_date: string;

  @ApiProperty({ description: 'Salario del usuario.', example: '3500000' })
  @IsNotEmpty({ message: 'El salario no puede estar vacío.' })
  @IsString() // O IsNumberString si se espera un número como cadena
  salary: string;

  @ApiProperty({ description: 'Auxilio de Transporte del usuario.', example: '140000' })
  @IsNotEmpty({ message: 'El auxilio de transporte no puede estar vacío.' })
  @IsString() // O IsNumberString
  transportation_allowance: string;

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
    description: 'ID del Cargo asignado al usuario (opcional, UUID).',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del cargo debe ser un UUID válido.' })
  positionId?: string | null;
} 