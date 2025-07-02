import { Module } from '@nestjs/common';
import { AuthApplicationModule } from '../application/auth-application.module';
import { AuthController } from './controllers/auth.controller';
import { PasswordResetController } from './controllers/password-reset.controller';
import { UserActivationController } from './controllers/user-activation.controller';

@Module({
  imports: [AuthApplicationModule],
  controllers: [AuthController, PasswordResetController, UserActivationController],
})
export class AuthPresentationModule {} 