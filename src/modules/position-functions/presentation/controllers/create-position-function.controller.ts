import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { CreatePositionFunctionUseCase } from '../../application/use-cases';
import { CreatePositionFunctionRequestDto, PositionFunctionResponseDto } from '../dtos';
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
export class CreatePositionFunctionController {
  constructor(
    private readonly createPositionFunctionUseCase: CreatePositionFunctionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva relación entre posición y función', description: 'Registra una nueva vinculación entre una posición y una función de rol.' })
  @ApiCreatedResponse({ description: 'Las relaciones han sido creadas exitosamente.', type: [PositionFunctionResponseDto] })
  @ApiBadRequestResponse({ description: 'Los datos proporcionados son inválidos.' })
  async create(@Body() createDtos: CreatePositionFunctionRequestDto[]): Promise<PositionFunctionResponseDto[]> {
    const createdEntities: PositionFunctionResponseDto[] = [];
    for (const createDto of createDtos) {
      const newDomainEntity = await this.createPositionFunctionUseCase.execute(createDto);
      createdEntities.push(mapDomainToResponseDto(newDomainEntity));
    }
    return createdEntities;
  }
} 