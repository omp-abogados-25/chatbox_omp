import { PositionFunction } from '../entities';

export interface CreatePositionFunctionInput {
  positionId: string;
  roleFunctionId: string;
}

export interface UpdatePositionFunctionInput {
  positionId?: string;
  roleFunctionId?: string;
}

export abstract class AbstractCreatePositionFunctionRepository {
  abstract execute(data: CreatePositionFunctionInput): Promise<PositionFunction>;
}

export abstract class AbstractFindAllPositionFunctionsRepository {
  abstract execute(): Promise<PositionFunction[]>;
}

export abstract class AbstractFindPositionFunctionByIdRepository {
  abstract execute(id: string): Promise<PositionFunction | null>;
}

export abstract class AbstractUpdatePositionFunctionRepository {
  abstract execute(id: string, data: UpdatePositionFunctionInput): Promise<PositionFunction | null>;
}

export abstract class AbstractDeletePositionFunctionRepository {
  abstract execute(id: string): Promise<PositionFunction | null>;
}

export interface FunctionDetailItem {
  details: string;
  notes: string | null; 
}

export abstract class AbstractFindFunctionDetailsByPositionIdRepository {
  abstract execute(positionId: string): Promise<FunctionDetailItem[]>;
} 