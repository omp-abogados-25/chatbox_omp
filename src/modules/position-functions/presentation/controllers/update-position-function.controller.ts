import { Controller, Put, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiParam } from '@nestjs/swagger';
import { UpdatePositionFunctionUseCase } from '../../application/use-cases';
import { UpdatePositionFunctionRequestDto, PositionFunctionResponseDto } from '../dtos';
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
export class UpdatePositionFunctionController {
  constructor(
    private readonly updatePositionFunctionUseCase: UpdatePositionFunctionUseCase,
  ) {}

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una relación posición-función existente', description: 'Actualiza los detalles de una vinculación.' })
  @ApiParam({ name: 'id', description: 'El ID de la relación a actualizar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'La relación ha sido actualizada exitosamente.', type: PositionFunctionResponseDto })
  @ApiNotFoundResponse({ description: 'La relación no fue encontrada.' })
  @ApiBadRequestResponse({ description: 'Los datos proporcionados son inválidos.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePositionFunctionRequestDto,
  ): Promise<PositionFunctionResponseDto> {
    const updatedDomainEntity = await this.updatePositionFunctionUseCase.execute(id, updateDto);
    if (!updatedDomainEntity) {
      throw new NotFoundException(`PositionFunction with ID "${id}" not found for update`);
    }
    return mapDomainToResponseDto(updatedDomainEntity);
  }
} 