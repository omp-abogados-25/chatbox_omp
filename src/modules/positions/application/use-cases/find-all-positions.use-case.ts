import { AbstractFindAllPositionsRepository, Position } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class FindAllPositionsUseCase {
  constructor(
    @Inject(AbstractFindAllPositionsRepository)
    private readonly positionFinder: AbstractFindAllPositionsRepository,
  ) {}

  async execute(): Promise<Position[]> {
    const positions = await this.positionFinder.execute();
    return positions;
  }
} 