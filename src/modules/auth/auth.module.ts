import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthPresentationModule } from './presentation/auth-presentation.module';
import { AuthApplicationModule } from './application/auth-application.module';
import { AuthInfrastructureModule } from './infrastructure/auth-infrastructure.module';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';

@Module({
  imports: [
    AuthInfrastructureModule,
    AuthApplicationModule,
    AuthPresentationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthInfrastructureModule],
})
export class AuthModule {} 