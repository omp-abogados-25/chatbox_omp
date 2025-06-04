import { Module } from '@nestjs/common';
import { RoleFunctionsControllersModule } from './controllers';

@Module({
  imports: [RoleFunctionsControllersModule],
})
export class RoleFunctionsPresentationModule {} 