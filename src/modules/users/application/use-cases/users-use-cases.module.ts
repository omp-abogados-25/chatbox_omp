import { Module } from '@nestjs/common';
import { UsersInfrastructureModule } from '../../infrastructure/users-infrastructure.module';
import { CreateUserUseCase } from './create-user.use-case';
import { FindAllUsersUseCase } from './find-all-users.use-case';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { UpdateUserUseCase } from './update-user.use-case';
import { DeleteUserUseCase } from './delete-user.use-case';
import { FindUserByIdentificationNumberUseCase } from './find-user-by-identification-number.use-case';
import { SetPasswordUseCase } from './set-password.use-case';

@Module({
  imports: [UsersInfrastructureModule],
  providers: [
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    FindUserByIdentificationNumberUseCase,
    SetPasswordUseCase,
  ],
  exports: [
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    FindUserByIdentificationNumberUseCase,
    SetPasswordUseCase,
  ],
})
export class UsersUseCasesModule {} 