import { Module } from '@nestjs/common';
import { WhatsappWebhookClientsModule } from './clients/whatsapp-webhook-clients.module';
import { WhatsappWebhookRepositoriesModule } from './repositories/whatsapp-webhook-repositories.module';
import { WhatsappWebhookServicesModule } from './services/whatsapp-webhook-services.module';

@Module({
  imports: [
    WhatsappWebhookClientsModule,
    WhatsappWebhookRepositoriesModule,
    WhatsappWebhookServicesModule,
  ],
  exports: [
    WhatsappWebhookClientsModule,
    WhatsappWebhookRepositoriesModule,
    WhatsappWebhookServicesModule,
  ],
})
export class WhatsappWebhookInfrastructureModule {}




