import { Module } from '@nestjs/common';
import { PositionFunctionsInfrastructureModule } from '../../infrastructure';
import { 
  CreatePositionFunctionUseCase, 
  FindAllPositionFunctionsUseCase, 
  FindPositionFunctionByIdUseCase, 
  UpdatePositionFunctionUseCase, 
  DeletePositionFunctionUseCase,
  FindFunctionDetailsByPositionIdUseCase,
} from './index';

const useCases = [
  CreatePositionFunctionUseCase,
  FindAllPositionFunctionsUseCase,
  FindPositionFunctionByIdUseCase,
  UpdatePositionFunctionUseCase,
  DeletePositionFunctionUseCase,
  FindFunctionDetailsByPositionIdUseCase,
];

@Module({
  imports: [PositionFunctionsInfrastructureModule],
  providers: useCases,
  exports: useCases,
})
export class PositionFunctionsUseCasesModule {} 