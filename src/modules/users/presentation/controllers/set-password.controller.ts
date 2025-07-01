import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { Public } from '../../../auth/infrastructure/decorators/public.decorator';
import { SetPasswordUseCase } from '../../application/use-cases';
import { SetPasswordRequestDto, UserResponseDto } from '../dtos';
import { User } from '../../domain/entities';

function mapDomainToResponseDto(domainEntity: User): UserResponseDto {
  if (!domainEntity) return null;
  return {
    id: domainEntity.id,
    full_name: domainEntity.full_name,
    identification_number: domainEntity.identification_number,
    issuing_place: domainEntity.issuing_place,
    email: domainEntity.email,
    entry_date: domainEntity.entry_date,
    salary: domainEntity.salary,
    transportation_allowance: domainEntity.transportation_allowance,
    gender: domainEntity.gender,
    can_login: domainEntity.can_login,
    password: null, // Por seguridad, no devolver la contraseña encriptada
    positionId: domainEntity.positionId,
    created_at: domainEntity.created_at,
    updated_at: domainEntity.updated_at,
  };
}

@ApiTags('users')
@Controller('users')
@Public()
export class SetPasswordController {
  constructor(private readonly setPasswordUseCase: SetPasswordUseCase) {}

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Establecer contraseña de usuario',
    description: 'Establece una nueva contraseña para un usuario específico. La contraseña se encripta automáticamente y se habilita el login para el usuario.' 
  })
  @ApiOkResponse({ 
    description: 'Contraseña establecida exitosamente',
    type: UserResponseDto 
  })
  @ApiBadRequestResponse({ 
    description: 'Datos inválidos (contraseñas no coinciden, formato incorrecto, etc.)' 
  })
  @ApiNotFoundResponse({ 
    description: 'Usuario no encontrado' 
  })
  async setPassword(@Body() setPasswordDto: SetPasswordRequestDto): Promise<UserResponseDto> {
    const updatedUser = await this.setPasswordUseCase.execute({
      userId: setPasswordDto.userId,
      password: setPasswordDto.password,
      confirmPassword: setPasswordDto.confirmPassword,
    });

    return mapDomainToResponseDto(updatedUser);
  }
} 