import { AbstractCreatePositionRepository, CreatePositionInput, Position } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class CreatePositionUseCase {
  constructor(
    @Inject(AbstractCreatePositionRepository)
    private readonly positionCreator: AbstractCreatePositionRepository,
  ) {}

  async execute(data: CreatePositionInput): Promise<Position> {
    const position = await this.positionCreator.execute(data);
    return position;
  }
} 