import { Controller, Put, Param, Body, HttpCode, HttpStatus, NotFoundException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiParam } from '@nestjs/swagger';
import { UpdatePositionUseCase } from '../../application/use-cases';
import { UpdatePositionRequestDto, PositionResponseDto } from '../dtos';
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
export class UpdatePositionController {
  constructor(
    private readonly updatePositionUseCase: UpdatePositionUseCase,
  ) {}

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un cargo existente', description: 'Actualiza los detalles de un cargo existente basado en su ID.' })
  @ApiParam({ name: 'id', description: 'El ID del cargo a actualizar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'El cargo ha sido actualizado exitosamente.', type: PositionResponseDto })
  @ApiNotFoundResponse({ description: 'El cargo con el ID especificado no fue encontrado para actualizar.' })
  @ApiBadRequestResponse({ description: 'Los datos proporcionados para actualizar el cargo son inválidos.' })
  async update(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionRequestDto,
  ): Promise<PositionResponseDto> {
    const updatedPositionDomain = await this.updatePositionUseCase.execute(id, updatePositionDto);
    if (!updatedPositionDomain) {
      throw new NotFoundException(`Position with ID "${id}" not found for update`);
    }
    return mapDomainToResponseDto(updatedPositionDomain);
  }
} 