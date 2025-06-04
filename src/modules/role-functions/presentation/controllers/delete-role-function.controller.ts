import { Controller, Delete, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';
import { DeleteRoleFunctionUseCase } from '../../application/use-cases';
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
export class DeleteRoleFunctionController {
  constructor(
    private readonly deleteRoleFunctionUseCase: DeleteRoleFunctionUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una función de rol', description: 'Elimina una función de rol existente basada en su ID.' })
  @ApiParam({ name: 'id', description: 'El ID de la función de rol a eliminar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'La función de rol ha sido eliminada exitosamente.', type: RoleFunctionResponseDto })
  @ApiNotFoundResponse({ description: 'La función de rol con el ID especificado no fue encontrada para eliminar.' })
  async delete(@Param('id') id: string): Promise<RoleFunctionResponseDto> {
    const deletedRoleFunctionDomain = await this.deleteRoleFunctionUseCase.execute(id);
    if (!deletedRoleFunctionDomain) {
      throw new NotFoundException(`RoleFunction with ID "${id}" not found for deletion`);
    }
    return mapDomainToResponseDto(deletedRoleFunctionDomain);
  }
} 