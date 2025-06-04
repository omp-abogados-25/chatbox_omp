import { Controller, Delete, Param, HttpCode, HttpStatus, NotFoundException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';
import { DeletePositionUseCase } from '../../application/use-cases';
import { PositionResponseDto } from '../dtos'; // Aún se usa para el tipo de respuesta en Swagger y el mapeo
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
export class DeletePositionController {
  constructor(
    private readonly deletePositionUseCase: DeletePositionUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.OK) // O HttpStatus.NO_CONTENT si prefieres no devolver cuerpo
  @ApiOperation({ summary: 'Eliminar un cargo', description: 'Elimina un cargo existente basado en su ID.' })
  @ApiParam({ name: 'id', description: 'El ID del cargo a eliminar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'El cargo ha sido eliminado exitosamente.', type: PositionResponseDto })
  @ApiNotFoundResponse({ description: 'El cargo con el ID especificado no fue encontrado para eliminar.' })
  async delete(@Param('id') id: string): Promise<PositionResponseDto> { 
    const deletedPositionDomain = await this.deletePositionUseCase.execute(id);
    if (!deletedPositionDomain) {
      throw new NotFoundException(`Position with ID "${id}" not found for deletion`);
    }
    // Es común devolver el objeto eliminado, o simplemente un estado 204 No Content.
    // Si se opta por 204, el tipo de retorno sería Promise<void> y no se devolvería cuerpo.
    return mapDomainToResponseDto(deletedPositionDomain);
  }
} 