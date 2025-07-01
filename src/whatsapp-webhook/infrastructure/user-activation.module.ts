import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserActivationService } from './services/user-activation.service';
import { UserActivationEmailService } from './services/user-activation-email.service';
import { EmailModule } from './email.module';

@Module({
  imports: [ConfigModule, EmailModule],
  providers: [
    {
      provide: 'IUserActivationService',
      useClass: UserActivationService,
    },
    {
      provide: 'IUserActivationEmailService',
      useClass: UserActivationEmailService,
    },
  ],
  exports: ['IUserActivationService', 'IUserActivationEmailService'],
})
export class UserActivationModule {} 