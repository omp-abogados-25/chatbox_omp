import { Injectable } from '@nestjs/common';
import { 
  AbstractFindFunctionDetailsByPositionIdRepository, 
  FunctionDetailItem
} from '../../domain/repositories';

@Injectable()
export class FindFunctionDetailsByPositionIdUseCase {
  constructor(
    private readonly repository: AbstractFindFunctionDetailsByPositionIdRepository,
  ) {}

  async execute(positionId: string): Promise<FunctionDetailItem[]> {
    return this.repository.execute(positionId);
  }
} 