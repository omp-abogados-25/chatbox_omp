import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../integrations/prisma/prisma.module';
import { UsersInfrastructureModule } from '../../users/infrastructure';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenService } from '../application/services/refresh-token.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET') || 'default-access-secret',
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    UsersInfrastructureModule,
  ],
  providers: [
    JwtStrategy,
    RefreshTokenService,
  ],
  exports: [
    JwtStrategy,
    RefreshTokenService,
    PassportModule,
    JwtModule,
  ],
})
export class AuthInfrastructureModule {} 