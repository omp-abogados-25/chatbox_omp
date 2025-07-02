import { Controller, Put, Param, Body, HttpCode, HttpStatus, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { UpdateRoleFunctionUseCase } from '../../application/use-cases'; // Asumimos que existirá
import { UpdateRoleFunctionRequestDto, RoleFunctionResponseDto } from '../dtos';
import { RoleFunction } from '../../domain/entities'; // Asumimos que existirá la entidad RoleFunction

// Función de ayuda para mapear la entidad del Dominio al DTO de Respuesta
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
@Controller('role-functions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UpdateRoleFunctionController {
  constructor(
    private readonly updateRoleFunctionUseCase: UpdateRoleFunctionUseCase, // Se inyectará el caso de uso
  ) {}

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una función de rol existente', description: 'Actualiza los detalles de una función de rol existente basada en su ID.' })
  @ApiParam({ name: 'id', description: 'El ID de la función de rol a actualizar (UUID)', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'La función de rol ha sido actualizada exitosamente.', type: RoleFunctionResponseDto })
  @ApiNotFoundResponse({ description: 'La función de rol con el ID especificado no fue encontrada para actualizar.' })
  @ApiBadRequestResponse({ description: 'Los datos proporcionados para actualizar la función de rol son inválidos.' })
  async update(
    @Param('id') id: string,
    @Body() updateRoleFunctionDto: UpdateRoleFunctionRequestDto,
  ): Promise<RoleFunctionResponseDto> {
    const updatedRoleFunctionDomain = await this.updateRoleFunctionUseCase.execute(id, updateRoleFunctionDto);
    if (!updatedRoleFunctionDomain) {
      throw new NotFoundException(`RoleFunction with ID "${id}" not found for update`);
    }
    return mapDomainToResponseDto(updatedRoleFunctionDomain);
  }
} 