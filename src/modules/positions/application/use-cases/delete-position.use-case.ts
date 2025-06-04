import { AbstractDeletePositionRepository, Position } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class DeletePositionUseCase {
  constructor(
    @Inject(AbstractDeletePositionRepository)
    private readonly positionDeleter: AbstractDeletePositionRepository,
  ) {}

  async execute(id: string): Promise<Position | null> {
    const position = await this.positionDeleter.execute(id);
    if (!position) {
      return null;
    }
    return position;
  }
} 