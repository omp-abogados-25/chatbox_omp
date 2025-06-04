import { Module } from '@nestjs/common';
import { RoleFunctionsApplicationModule } from '../../application';
import { 
  CreateRoleFunctionController, 
  FindAllRoleFunctionsController, 
  FindRoleFunctionByIdController, 
  UpdateRoleFunctionController, 
  DeleteRoleFunctionController 
} from '.';

@Module({
  imports: [RoleFunctionsApplicationModule],
  controllers: [
    CreateRoleFunctionController,
    FindAllRoleFunctionsController,
    FindRoleFunctionByIdController,
    UpdateRoleFunctionController,
    DeleteRoleFunctionController,
  ],
})
export class RoleFunctionsControllersModule {} 