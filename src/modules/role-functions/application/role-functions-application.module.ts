import { Module } from '@nestjs/common';
import { RoleFunctionsUseCasesModule } from './use-cases';

@Module({
  imports: [
    RoleFunctionsUseCasesModule,
  ],
  exports: [
    RoleFunctionsUseCasesModule,
  ],
})
export class RoleFunctionsApplicationModule {} 