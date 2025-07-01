import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdentifyAndAssignUserDto {
  @ApiProperty({
    description: 'Número de WhatsApp del solicitante',
    example: '+573001234567',
  })
  @IsString()
  @IsNotEmpty()
  whatsappNumber: string;

  @ApiProperty({
    description: 'Número de documento de identidad del usuario',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  identificationNumber: string;
}

export class IdentifyAndAssignUserResponseDto {
  @ApiProperty({
    description: 'Información del usuario identificado',
    example: {
      id: 'uuid-del-usuario',
      full_name: 'Juan Pérez García',
      email: 'juan.perez@empresa.com',
      identification_number: '12345678',
      position: {
        id: 'uuid-del-cargo',
        name: 'Desarrollador Senior'
      }
    }
  })
  user: {
    id: string;
    full_name: string;
    email: string;
    identification_number: string;
    position?: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({
    description: 'Lista de solicitudes asignadas al usuario',
    type: 'array',
  })
  assignedRequests: any[];

  @ApiProperty({
    description: 'Número total de solicitudes asignadas',
    example: 3,
  })
  totalAssigned: number;
} 