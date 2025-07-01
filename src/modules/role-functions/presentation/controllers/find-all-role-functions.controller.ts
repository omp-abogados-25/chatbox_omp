import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { FindAllRoleFunctionsUseCase } from '../../application/use-cases';
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
@Controller('role-functions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FindAllRoleFunctionsController {
  constructor(
    private readonly findAllRoleFunctionsUseCase: FindAllRoleFunctionsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todas las funciones de rol', description: 'Recupera una lista de todas las funciones de rol registradas.' })
  @ApiOkResponse({ description: 'Lista de funciones de rol recuperada exitosamente.', type: [RoleFunctionResponseDto] })
  async findAll(): Promise<RoleFunctionResponseDto[]> {
    const roleFunctionsDomain = await this.findAllRoleFunctionsUseCase.execute();
    return roleFunctionsDomain.map(mapDomainToResponseDto);
  }
} 