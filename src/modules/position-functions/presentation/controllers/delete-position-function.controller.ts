import { Controller, Delete, Param, HttpCode, HttpStatus, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { DeletePositionFunctionUseCase } from '../../application/use-cases';
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
@Controller('position-functions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeletePositionFunctionController {
  constructor(
    private readonly deletePositionFunctionUseCase: DeletePositionFunctionUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una relación posición-función', description: 'Elimina una vinculación existente.' })
  @ApiParam({ name: 'id', description: 'El ID de la relación a eliminar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'La relación ha sido eliminada exitosamente.', type: PositionFunctionResponseDto })
  @ApiNotFoundResponse({ description: 'La relación no fue encontrada.' })
  async delete(@Param('id') id: string): Promise<PositionFunctionResponseDto> {
    const deletedDomainEntity = await this.deletePositionFunctionUseCase.execute(id);
    if (!deletedDomainEntity) {
      throw new NotFoundException(`PositionFunction with ID "${id}" not found for deletion`);
    }
    return mapDomainToResponseDto(deletedDomainEntity);
  }
} 