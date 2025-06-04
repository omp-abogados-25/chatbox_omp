import { Module } from '@nestjs/common';
import { PositionsRepositoriesModule } from './repositories';

@Module({
  imports: [
    PositionsRepositoriesModule,
  ],
  exports: [
    PositionsRepositoriesModule, 
  ],
})
export class PositionsInfrastructureModule {} 