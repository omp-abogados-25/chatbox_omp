import { Controller, Get, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';
import { FindRoleFunctionByIdUseCase } from '../../application/use-cases';
import { RoleFunctionResponseDto } from '../dtos';
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
export class FindRoleFunctionByIdController {
  constructor(
    private readonly findRoleFunctionByIdUseCase: FindRoleFunctionByIdUseCase,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener una función de rol por su ID', description: 'Recupera una función de rol específica basada en su ID.' })
  @ApiParam({ name: 'id', description: 'El ID de la función de rol a recuperar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Función de rol recuperada exitosamente.', type: RoleFunctionResponseDto })
  @ApiNotFoundResponse({ description: 'La función de rol con el ID especificado no fue encontrada.' })
  async findById(@Param('id') id: string): Promise<RoleFunctionResponseDto> {
    const roleFunctionDomain = await this.findRoleFunctionByIdUseCase.execute(id);
    if (!roleFunctionDomain) {
      throw new NotFoundException(`RoleFunction with ID "${id}" not found`);
    }
    return mapDomainToResponseDto(roleFunctionDomain);
  }
} 