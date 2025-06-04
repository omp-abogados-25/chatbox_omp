import { Module } from '@nestjs/common';
import { PositionsApplicationModule } from '../../application';
import { CreatePositionController, FindAllPositionsController, FindPositionByIdController, UpdatePositionController, DeletePositionController } from './index';


@Module({
  imports: [PositionsApplicationModule],
  controllers: [
    CreatePositionController,
    FindAllPositionsController,
    FindPositionByIdController,
    UpdatePositionController,
    DeletePositionController,
  ],
})
export class PositionsControllersModule {} 