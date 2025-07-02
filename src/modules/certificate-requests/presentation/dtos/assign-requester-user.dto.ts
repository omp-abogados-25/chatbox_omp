import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRequesterUserDto {
  @ApiProperty({
    description: 'ID del usuario solicitante',
    example: 'uuid-del-usuario-solicitante',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
} 