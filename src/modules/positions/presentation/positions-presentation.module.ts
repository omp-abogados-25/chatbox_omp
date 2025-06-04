import { Module } from '@nestjs/common';
import { PositionsControllersModule } from './controllers';
@Module({
  imports: [PositionsControllersModule],
})
export class PositionsPresentationModule {}