import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PasswordResetService } from './services/password-reset.service';
import { PasswordResetEmailService } from './services/password-reset-email.service';
import { EmailModule } from './email.module';

const passwordResetServiceProviders = [
  PasswordResetService,
  PasswordResetEmailService,
  {
    provide: 'IPasswordResetService',
    useClass: PasswordResetService,
  },
  {
    provide: 'IPasswordResetEmailService', 
    useClass: PasswordResetEmailService,
  },
];

@Module({
  imports: [ConfigModule, EmailModule], 
  providers: passwordResetServiceProviders,
  exports: [
    'IPasswordResetService',
    'IPasswordResetEmailService',
    PasswordResetService,
    PasswordResetEmailService,
  ],
})
export class PasswordResetModule {} 