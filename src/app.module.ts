import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappWebhookPresentationModule } from './whatsapp-webhook/presentation';
import { PositionModule } from './modules/positions';
import { PrismaModule } from './integrations/prisma';
import { RoleFunctionModule } from './modules/role-functions';

const presentationModules = [PrismaModule, WhatsappWebhookPresentationModule, PositionModule, RoleFunctionModule];

@Module({
  imports: presentationModules,
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
