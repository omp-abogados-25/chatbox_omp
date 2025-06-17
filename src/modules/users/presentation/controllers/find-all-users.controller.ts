import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { FindAllUsersUseCase } from '../../application/use-cases';
import { UserResponseDto } from '../dtos';
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
    positionId: domainEntity.positionId,
    created_at: domainEntity.created_at,
    updated_at: domainEntity.updated_at,
  };
}

@ApiTags('Users')
@Controller('integrations/users')
export class FindAllUsersController {
  constructor(
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los usuarios', description: 'Recupera una lista de todos los usuarios registrados.' })
  @ApiOkResponse({ description: 'Lista de usuarios recuperada exitosamente.', type: [UserResponseDto] })
  async findAll(): Promise<UserResponseDto[]> {
    const domainEntities = await this.findAllUsersUseCase.execute();
    return domainEntities.map(mapDomainToResponseDto);
  }
} 