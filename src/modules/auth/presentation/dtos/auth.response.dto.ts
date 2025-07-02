import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ 
    description: 'ID del usuario', 
    example: 'uuid-del-usuario' 
  })
  id: string;

  @ApiProperty({ 
    description: 'Correo electrónico del usuario', 
    example: 'usuario@ejemplo.com' 
  })
  email: string;

  @ApiProperty({ 
    description: 'Nombre completo del usuario', 
    example: 'Juan Pérez' 
  })
  full_name: string;

  @ApiProperty({ 
    description: 'Indica si el usuario puede iniciar sesión', 
    example: true 
  })
  can_login: boolean;
}

export class AuthResponseDto {
  @ApiProperty({ 
    description: 'Token de acceso JWT', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  access_token: string;

  @ApiProperty({ 
    description: 'Token de renovación', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  refresh_token: string;

  @ApiProperty({ 
    description: 'Tiempo de expiración en segundos', 
    example: 3600 
  })
  expires_in: number;

  @ApiProperty({ 
    description: 'Tipo de token', 
    example: 'Bearer' 
  })
  token_type: string;

  @ApiProperty({ 
    description: 'Información del usuario autenticado' 
  })
  user: AuthUserResponseDto;
}

export class LogoutResponseDto {
  @ApiProperty({ 
    description: 'Mensaje de confirmación', 
    example: 'Sesión cerrada exitosamente' 
  })
  message: string;

  @ApiProperty({ 
    description: 'Estado de la operación', 
    example: true 
  })
  success: boolean;
} 