import { AbstractFindAllPositionFunctionsRepository, PositionFunction } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class FindAllPositionFunctionsUseCase {
  constructor(
    @Inject(AbstractFindAllPositionFunctionsRepository)
    private readonly repository: AbstractFindAllPositionFunctionsRepository,
  ) {}

  async execute(): Promise<PositionFunction[]> {
    return this.repository.execute();
  }
} 