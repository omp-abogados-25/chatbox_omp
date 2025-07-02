import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsUUID, Matches } from 'class-validator';

export class SetPasswordRequestDto {
  @ApiProperty({ 
    description: 'ID del usuario (UUID)', 
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    format: 'uuid'
  })
  @IsNotEmpty({ message: 'El ID del usuario no puede estar vacío.' })
  @IsUUID('4', { message: 'El ID del usuario debe ser un UUID válido.' })
  userId: string;

  @ApiProperty({ 
    description: 'Nueva contraseña del usuario', 
    example: 'MiPassword123!' 
  })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @Length(6, 100, { message: 'La contraseña debe tener entre 6 y 100 caracteres.' })
  password: string;

  @ApiProperty({ 
    description: 'Confirmación de la contraseña', 
    example: 'MiPassword123!' 
  })
  @IsNotEmpty({ message: 'La confirmación de contraseña no puede estar vacía.' })
  @IsString({ message: 'La confirmación de contraseña debe ser una cadena de texto.' })
  @Length(6, 100, { message: 'La confirmación de contraseña debe tener entre 6 y 100 caracteres.' })
  confirmPassword: string;
} 