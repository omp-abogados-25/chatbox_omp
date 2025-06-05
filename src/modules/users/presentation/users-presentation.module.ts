import { Module } from '@nestjs/common';
import { UsersControllersModule } from './controllers';

@Module({
  imports: [UsersControllersModule],
  exports: [UsersControllersModule],
})
export class UsersPresentationModule {} 