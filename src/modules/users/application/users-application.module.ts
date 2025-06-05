import { Module } from '@nestjs/common';
import { UsersUseCasesModule } from './use-cases/users-use-cases.module';

@Module({
  imports: [UsersUseCasesModule],
  exports: [UsersUseCasesModule],
})
export class UsersApplicationModule {} 