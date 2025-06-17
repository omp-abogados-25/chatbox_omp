import { Controller, Put, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiParam } from '@nestjs/swagger';
import { UpdateUserUseCase } from '../../application/use-cases';
import { UpdateUserRequestDto, UserResponseDto } from '../dtos';
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
export class UpdateUserController {
  constructor(
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un usuario existente', description: 'Actualiza los detalles de un usuario existente.' })
  @ApiParam({ name: 'id', description: 'El ID del usuario a actualizar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'El usuario ha sido actualizado exitosamente.', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'El usuario no fue encontrado.' })
  @ApiBadRequestResponse({ description: 'Los datos proporcionados son inválidos.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    const updatedDomainEntity = await this.updateUserUseCase.execute(id, updateDto);
    if (!updatedDomainEntity) {
      throw new NotFoundException(`User with ID "${id}" not found for update`);
    }
    return mapDomainToResponseDto(updatedDomainEntity);
  }
} 