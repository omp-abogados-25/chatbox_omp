import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { CreateRoleFunctionUseCase } from '../../application/use-cases';
import { CreateRoleFunctionRequestDto, RoleFunctionResponseDto } from '../dtos';
import { RoleFunction } from '../../domain/entities';

function mapDomainToResponseDto(domainEntity: RoleFunction): RoleFunctionResponseDto {
  if (!domainEntity) return null;
  return {
    id: domainEntity.id,
    details: domainEntity.details,
    notes: domainEntity.notes,
    created_at: domainEntity.created_at,
    updated_at: domainEntity.updated_at,
  };
}

@ApiTags('Role Functions')
@Controller('integrations/role-functions')
export class CreateRoleFunctionController {
  constructor(
    private readonly createRoleFunctionUseCase: CreateRoleFunctionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva función de rol', description: 'Registra una nueva función de rol en el sistema.' })
  @ApiCreatedResponse({ description: 'La función de rol ha sido creada exitosamente.', type: RoleFunctionResponseDto })
  @ApiBadRequestResponse({ description: 'Los datos proporcionados para crear la función de rol son inválidos.' })
  async create(@Body() createRoleFunctionDto: CreateRoleFunctionRequestDto[]): Promise<RoleFunctionResponseDto> {
    // const newRoleFunctionDomain = await this.createRoleFunctionUseCase.execute(createRoleFunctionDto);
    // return mapDomainToResponseDto(newRoleFunctionDomain);
    let newRoleFunctionDomain;
    for (const roleFunction of createRoleFunctionDto) {
      newRoleFunctionDomain = await this.createRoleFunctionUseCase.execute(roleFunction);
    }
    return mapDomainToResponseDto(newRoleFunctionDomain);
  }
} 