import { Module } from '@nestjs/common';
import { PositionFunctionsRepositoriesModule } from './repositories';

@Module({
  imports: [
    PositionFunctionsRepositoriesModule,
  ],
  exports: [
    PositionFunctionsRepositoriesModule,
  ],
})
export class PositionFunctionsInfrastructureModule {} 