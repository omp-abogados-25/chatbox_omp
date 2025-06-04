import { Module } from '@nestjs/common';
import { RoleFunctionsRepositoriesModule } from './repositories';

@Module({
  imports: [RoleFunctionsRepositoriesModule,],
  exports: [RoleFunctionsRepositoriesModule],
})
export class RoleFunctionsInfrastructureModule {} 