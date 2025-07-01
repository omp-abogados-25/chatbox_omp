import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenRequestDto {
  @ApiProperty({ 
    description: 'Refresh token para renovar el access token', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  @IsNotEmpty({ message: 'El refresh token no puede estar vacío.' })
  @IsString({ message: 'El refresh token debe ser una cadena de texto.' })
  refresh_token: string;
} 