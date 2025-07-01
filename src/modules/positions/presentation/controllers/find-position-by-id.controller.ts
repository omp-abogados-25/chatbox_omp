import { Controller, Get, Param, HttpCode, HttpStatus, NotFoundException, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { FindPositionByIdUseCase } from '../../application/use-cases';
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
@Controller('positions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FindPositionByIdController {
  constructor(
    private readonly findPositionByIdUseCase: FindPositionByIdUseCase,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un cargo por su ID', description: 'Recupera un cargo específico basado en su ID.' })
  @ApiParam({ name: 'id', description: 'El ID del cargo a recuperar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Cargo recuperado exitosamente.', type: PositionResponseDto })
  @ApiNotFoundResponse({ description: 'El cargo con el ID especificado no fue encontrado.' })
  async findById(@Param('id') id: string): Promise<PositionResponseDto> {
    const positionDomain = await this.findPositionByIdUseCase.execute(id);
    if (!positionDomain) {
      throw new NotFoundException(`Position with ID "${id}" not found`);
    }
    return mapDomainToResponseDto(positionDomain);
  }
} 