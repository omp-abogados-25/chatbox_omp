import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { CreateUserUseCase } from '../../application/use-cases';
import { CreateUserRequestDto, UserResponseDto } from '../dtos';
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
export class CreateUserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo usuario', description: 'Registra un nuevo usuario en el sistema.' })
  @ApiCreatedResponse({ description: 'El usuario ha sido creado exitosamente.', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Los datos proporcionados son inválidos.' })
  async create(@Body() createDto: CreateUserRequestDto[]): Promise<UserResponseDto> {
    //const newDomainEntity = await this.createUserUseCase.execute(createDto);
    //return mapDomainToResponseDto(newDomainEntity);

    let newDomainEntity;
    for (const user of createDto) {
      newDomainEntity = await this.createUserUseCase.execute(user);
    }
    return mapDomainToResponseDto(newDomainEntity);
  }
} 