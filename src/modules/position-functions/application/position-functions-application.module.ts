import { Module } from '@nestjs/common';
import { PositionFunctionsUseCasesModule } from './use-cases';

@Module({
  imports: [
    PositionFunctionsUseCasesModule,
  ],
  exports: [
    PositionFunctionsUseCasesModule,
  ],
})
export class PositionFunctionsApplicationModule {} 