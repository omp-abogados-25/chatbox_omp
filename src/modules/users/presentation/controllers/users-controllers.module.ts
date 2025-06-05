import { Module } from '@nestjs/common';
import { UsersApplicationModule } from '../../application';
import { 
  CreateUserController, 
  FindAllUsersController, 
  FindUserByIdController, 
  UpdateUserController, 
  DeleteUserController 
} from '.';

@Module({
  imports: [UsersApplicationModule],
  controllers: [
    CreateUserController,
    FindAllUsersController,
    FindUserByIdController,
    UpdateUserController,
    DeleteUserController,
  ],
})
export class UsersControllersModule {} 