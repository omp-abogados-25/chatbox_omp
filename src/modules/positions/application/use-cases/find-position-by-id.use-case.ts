import { AbstractFindPositionByIdRepository, Position } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class FindPositionByIdUseCase {
  constructor(
    @Inject(AbstractFindPositionByIdRepository)
    private readonly positionFinderById: AbstractFindPositionByIdRepository,
  ) {}

  async execute(id: string): Promise<Position | null> {
    const position = await this.positionFinderById.execute(id);
    if (!position) {
      return null;
    }
    return position;
  }
} 