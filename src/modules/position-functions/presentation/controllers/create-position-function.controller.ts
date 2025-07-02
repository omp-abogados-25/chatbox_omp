import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
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
@Controller('position-functions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreatePositionFunctionController {
  constructor(
    private readonly createPositionFunctionUseCase: CreatePositionFunctionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva relación entre posición y función', description: 'Registra una nueva vinculación entre una posición y una función de rol.' })
  @ApiCreatedResponse({ description: 'Las relaciones han sido creadas exitosamente.', type: [PositionFunctionResponseDto] })
  @ApiBadRequestResponse({ description: 'Los datos proporcionados son inválidos.' })
  async create(@Body() createDto: CreatePositionFunctionRequestDto): Promise<PositionFunctionResponseDto> {
    const newDomainEntity = await this.createPositionFunctionUseCase.execute(createDto);
    return mapDomainToResponseDto(newDomainEntity);
  }
} 