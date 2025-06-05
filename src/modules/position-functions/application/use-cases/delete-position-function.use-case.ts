import { AbstractDeletePositionFunctionRepository, PositionFunction } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class DeletePositionFunctionUseCase {
  constructor(
    @Inject(AbstractDeletePositionFunctionRepository)
    private readonly repository: AbstractDeletePositionFunctionRepository,
  ) {}

  async execute(id: string): Promise<PositionFunction | null> {
    const result = await this.repository.execute(id);
    if (!result) {
      return null;
    }
    return result;
  }
} 