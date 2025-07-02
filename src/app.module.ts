import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappWebhookPresentationModule } from './whatsapp-webhook/presentation';
import { PositionModule } from './modules/positions';
import { PrismaModule } from './integrations/prisma';
import { RoleFunctionModule } from './modules/role-functions';
import { PositionFunctionModule } from './modules/position-functions';
import { UserModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { CertificateRequestsModule } from './modules/certificate-requests';

const presentationModules = [PrismaModule, WhatsappWebhookPresentationModule, PositionModule, RoleFunctionModule, PositionFunctionModule, UserModule, AuthModule, CertificateRequestsModule];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ...presentationModules
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
