import { Controller, Delete, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';
import { DeleteUserUseCase } from '../../application/use-cases';
import { UserResponseDto } from '../dtos';
import { User } from '../../domain/entities';

function mapDomainToResponseDto(domainEntity: User): UserResponseDto {
  if (!domainEntity) return null;
  return {
    id: domainEntity.id,
    full_name: domainEntity.full_name,
    identification_number: domainEntity.identification_number,
    issuing_place: domainEntity.issuing_place,
    email: domainEntity.email,
    entry_date: domainEntity.entry_date,
    salary: domainEntity.salary,
    transportation_allowance: domainEntity.transportation_allowance,
    gender: domainEntity.gender,
    positionId: domainEntity.positionId,
    created_at: domainEntity.created_at,
    updated_at: domainEntity.updated_at,
  };
}

@ApiTags('Users')
@Controller('integrations/users')
export class DeleteUserController {
  constructor(
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un usuario', description: 'Elimina un usuario existente.' })
  @ApiParam({ name: 'id', description: 'El ID del usuario a eliminar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'El usuario ha sido eliminado exitosamente.', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'El usuario no fue encontrado.' })
  async delete(@Param('id') id: string): Promise<UserResponseDto> {
    const deletedDomainEntity = await this.deleteUserUseCase.execute(id);
    if (!deletedDomainEntity) {
      throw new NotFoundException(`User with ID "${id}" not found for deletion`);
    }
    return mapDomainToResponseDto(deletedDomainEntity);
  }
} 