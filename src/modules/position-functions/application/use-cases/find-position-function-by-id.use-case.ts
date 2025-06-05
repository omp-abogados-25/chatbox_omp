import { AbstractFindPositionFunctionByIdRepository, PositionFunction } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class FindPositionFunctionByIdUseCase {
  constructor(
    @Inject(AbstractFindPositionFunctionByIdRepository)
    private readonly repository: AbstractFindPositionFunctionByIdRepository,
  ) {}

  async execute(id: string): Promise<PositionFunction | null> {
    const result = await this.repository.execute(id);
    if (!result) {
      return null;
    }
    return result;
  }
} 