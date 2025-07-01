import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ 
    description: 'Correo electrónico del usuario', 
    example: 'usuario@ejemplo.com' 
  })
  @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío.' })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido.' })
  @IsString({ message: 'El correo electrónico debe ser una cadena de texto.' })
  email: string;

  @ApiProperty({ 
    description: 'Contraseña del usuario', 
    example: 'miPassword123!' 
  })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @Length(6, 100, { message: 'La contraseña debe tener entre 6 y 100 caracteres.' })
  password: string;
} 