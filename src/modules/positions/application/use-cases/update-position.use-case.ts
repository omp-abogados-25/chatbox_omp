import { AbstractUpdatePositionRepository, UpdatePositionInput, Position } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class UpdatePositionUseCase {
  constructor(
    @Inject(AbstractUpdatePositionRepository)
    private readonly positionUpdater: AbstractUpdatePositionRepository,
  ) {}

  async execute(id: string, data: UpdatePositionInput): Promise<Position | null> {
    const position = await this.positionUpdater.execute(id, data);
    if (!position) {
      return null;
    }
    return position;
  }
} 