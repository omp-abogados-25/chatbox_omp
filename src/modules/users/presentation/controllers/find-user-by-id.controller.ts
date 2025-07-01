import { Controller, Get, Param, HttpCode, HttpStatus, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { FindUserByIdUseCase } from '../../application/use-cases';
import { UserResponseDto } from '../dtos';
import { User } from '../../domain/entities';

// Esta función de mapeo se puede mover a un archivo de utilidades si se usa en muchos lugares
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
    password: domainEntity.password,
    positionId: domainEntity.positionId,
    created_at: domainEntity.created_at,
    updated_at: domainEntity.updated_at,
  };
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FindUserByIdController {
  constructor(
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un usuario por ID', description: 'Recupera los detalles de un usuario específico por su ID.' })
  @ApiParam({ name: 'id', description: 'El ID del usuario a recuperar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Usuario recuperado exitosamente.', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'El usuario no fue encontrado.' })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const domainEntity = await this.findUserByIdUseCase.execute(id);
    if (!domainEntity) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return mapDomainToResponseDto(domainEntity);
  }
} 