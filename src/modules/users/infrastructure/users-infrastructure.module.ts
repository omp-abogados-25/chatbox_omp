import { Module } from '@nestjs/common';
import { UsersRepositoriesModule } from './repositories';

@Module({
  imports: [UsersRepositoriesModule],
  exports: [UsersRepositoriesModule],
})
export class UsersInfrastructureModule {} 