import { Module } from '@nestjs/common';
import { PositionFunctionsApplicationModule } from '../../application';
import { 
  CreatePositionFunctionController, 
  FindAllPositionFunctionsController, 
  FindPositionFunctionByIdController, 
  UpdatePositionFunctionController, 
  DeletePositionFunctionController 
} from './index';

@Module({
  imports: [PositionFunctionsApplicationModule],
  controllers: [
    CreatePositionFunctionController,
    FindAllPositionFunctionsController,
    FindPositionFunctionByIdController,
    UpdatePositionFunctionController,
    DeletePositionFunctionController,
  ],
})
export class PositionFunctionsControllersModule {} 