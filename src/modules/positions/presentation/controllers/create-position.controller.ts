import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { CreatePositionUseCase } from '../../application/use-cases';
import { CreatePositionRequestDto, PositionResponseDto } from '../dtos';
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
export class CreatePositionController {
  constructor(
    private readonly createPositionUseCase: CreatePositionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo cargo', description: 'Registra un nuevo cargo en el sistema.' })
  @ApiCreatedResponse({ description: 'El cargo ha sido creado exitosamente.', type: PositionResponseDto })
  @ApiBadRequestResponse({ description: 'Los datos proporcionados para crear el cargo son inválidos.' })
  async create(@Body() createPositionDto: CreatePositionRequestDto): Promise<PositionResponseDto> {
    const newPositionDomain = await this.createPositionUseCase.execute(createPositionDto);
    return mapDomainToResponseDto(newPositionDomain);
  }
} 