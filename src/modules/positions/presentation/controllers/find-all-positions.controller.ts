import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { FindAllPositionsUseCase } from '../../application/use-cases';
import { PositionResponseDto } from '../dtos';
import { Position } from '../../domain/entities';

// Función de ayuda para mapear la entidad del Dominio al DTO de Respuesta
function mapDomainToResponseDto(domainEntity: Position): PositionResponseDto {
  if (!domainEntity) return null;
  return {
    id: domainEntity.id,
    name: domainEntity.name,
    description: domainEntity.description,
    created_at: domainEntity.created_at,
    updated_at: domainEntity.updated_at,
  };
}

@ApiTags('Positions')
@Controller('integrations/positions')
export class FindAllPositionsController {
  constructor(
    private readonly findAllPositionsUseCase: FindAllPositionsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los cargos', description: 'Recupera una lista de todos los cargos registrados.' })
  @ApiOkResponse({ description: 'Lista de cargos recuperada exitosamente.', type: [PositionResponseDto] })
  async findAll(): Promise<PositionResponseDto[]> {
    const positionsDomain = await this.findAllPositionsUseCase.execute();
    return positionsDomain.map(mapDomainToResponseDto);
  }
} 