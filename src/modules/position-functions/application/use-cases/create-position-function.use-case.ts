import { AbstractCreatePositionFunctionRepository, CreatePositionFunctionInput, PositionFunction } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class CreatePositionFunctionUseCase {
  constructor(
    @Inject(AbstractCreatePositionFunctionRepository)
    private readonly repository: AbstractCreatePositionFunctionRepository,
  ) {}

  async execute(data: CreatePositionFunctionInput): Promise<PositionFunction> {
    return this.repository.execute(data);
  }
} 