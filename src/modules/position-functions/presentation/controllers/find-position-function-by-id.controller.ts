import { Controller, Get, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';
import { FindPositionFunctionByIdUseCase } from '../../application/use-cases';
import { PositionFunctionResponseDto } from '../dtos';
import { PositionFunction } from '../../domain/entities';

function mapDomainToResponseDto(domainEntity: PositionFunction): PositionFunctionResponseDto {
  if (!domainEntity) return null;
  return {
    id: domainEntity.id,
    positionId: domainEntity.positionId,
    roleFunctionId: domainEntity.roleFunctionId,
    created_at: domainEntity.created_at,
    updated_at: domainEntity.updated_at,
  };
}

@ApiTags('Position Functions')
@Controller('integrations/position-functions')
export class FindPositionFunctionByIdController {
  constructor(
    private readonly findPositionFunctionByIdUseCase: FindPositionFunctionByIdUseCase,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener una relación posición-función por su ID', description: 'Recupera una vinculación específica.' })
  @ApiParam({ name: 'id', description: 'El ID de la relación (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Relación recuperada exitosamente.', type: PositionFunctionResponseDto })
  @ApiNotFoundResponse({ description: 'La relación con el ID especificado no fue encontrada.' })
  async findById(@Param('id') id: string): Promise<PositionFunctionResponseDto> {
    const domainEntity = await this.findPositionFunctionByIdUseCase.execute(id);
    if (!domainEntity) {
      throw new NotFoundException(`PositionFunction with ID "${id}" not found`);
    }
    return mapDomainToResponseDto(domainEntity);
  }
} 