import { AbstractUpdatePositionFunctionRepository, UpdatePositionFunctionInput, PositionFunction } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class UpdatePositionFunctionUseCase {
  constructor(
    @Inject(AbstractUpdatePositionFunctionRepository)
    private readonly repository: AbstractUpdatePositionFunctionRepository,
  ) {}

  async execute(id: string, data: UpdatePositionFunctionInput): Promise<PositionFunction | null> {
    const result = await this.repository.execute(id, data);
    if (!result) {
      return null;
    }
    return result;
  }
} 