import { Module } from '@nestjs/common';
import { AuthInfrastructureModule } from '../infrastructure/auth-infrastructure.module';
import { UsersInfrastructureModule } from '../../users/infrastructure/users-infrastructure.module';
import { PasswordResetModule } from '../../../whatsapp-webhook/infrastructure/password-reset.module';
import { UserActivationModule } from '../../../whatsapp-webhook/infrastructure/user-activation.module';
import { AuthService } from './services/auth.service';

@Module({
  imports: [AuthInfrastructureModule, UsersInfrastructureModule, PasswordResetModule, UserActivationModule],
  providers: [AuthService],
  exports: [AuthService, PasswordResetModule, UserActivationModule, UsersInfrastructureModule],
})
export class AuthApplicationModule {} 