import { Module } from '@nestjs/common';
import { PositionsUsesCasesModule } from './use-cases';

@Module({
  imports: [
    PositionsUsesCasesModule,
  ],
  exports: [
    PositionsUsesCasesModule,
  ],
})
export class PositionsApplicationModule {}