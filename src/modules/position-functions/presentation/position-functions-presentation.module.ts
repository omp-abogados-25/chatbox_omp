import { Module } from '@nestjs/common';
import { PositionFunctionsControllersModule } from './controllers';

@Module({
  imports: [PositionFunctionsControllersModule],
})
export class PositionFunctionsPresentationModule {} 