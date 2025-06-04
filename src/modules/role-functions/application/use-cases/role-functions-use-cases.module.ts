import { Module } from '@nestjs/common';
import { RoleFunctionsInfrastructureModule } from '../../infrastructure';
import { 
  CreateRoleFunctionUseCase, 
  FindAllRoleFunctionsUseCase, 
  FindRoleFunctionByIdUseCase, 
  UpdateRoleFunctionUseCase, 
  DeleteRoleFunctionUseCase 
} from '.';

const useCases = [
  CreateRoleFunctionUseCase,
  FindAllRoleFunctionsUseCase,
  FindRoleFunctionByIdUseCase,
  UpdateRoleFunctionUseCase,
  DeleteRoleFunctionUseCase,
];

@Module({
  imports: [RoleFunctionsInfrastructureModule],
  providers: useCases,
  exports: useCases,
})
export class RoleFunctionsUseCasesModule {} 