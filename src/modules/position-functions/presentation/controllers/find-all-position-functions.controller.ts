import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { FindAllPositionFunctionsUseCase } from '../../application/use-cases';
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
export class FindAllPositionFunctionsController {
  constructor(
    private readonly findAllPositionFunctionsUseCase: FindAllPositionFunctionsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todas las relaciones posición-función', description: 'Recupera una lista de todas las vinculaciones.' })
  @ApiOkResponse({ description: 'Lista recuperada exitosamente.', type: [PositionFunctionResponseDto] })
  async findAll(): Promise<PositionFunctionResponseDto[]> {
    const domainEntities = await this.findAllPositionFunctionsUseCase.execute();
    return domainEntities.map(mapDomainToResponseDto);
  }
} 