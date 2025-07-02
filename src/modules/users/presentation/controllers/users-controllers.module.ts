import { Module } from '@nestjs/common';
import { UsersApplicationModule } from '../../application';
import { 
  CreateUserController, 
  FindAllUsersController, 
  FindUserByIdController, 
  UpdateUserController, 
  DeleteUserController,
  SetPasswordController
} from '.';

@Module({
  imports: [UsersApplicationModule],
  controllers: [
    CreateUserController,
    FindAllUsersController,
    FindUserByIdController,
    UpdateUserController,
    DeleteUserController,
    SetPasswordController,
  ],
})
export class UsersControllersModule {} 