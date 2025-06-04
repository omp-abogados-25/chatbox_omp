import { Module } from '@nestjs/common';
import { WhatsappWebhookServicesModule } from './services';
import { WhatsappWebhookUsesCasesModule } from './uses-cases';
import { WhatsappWebhookInfrastructureModule } from '../infrastructure/whatsapp-webhook-infrastructure.module';

const modules = [
  WhatsappWebhookServicesModule, 
  WhatsappWebhookUsesCasesModule,
  WhatsappWebhookInfrastructureModule
];

@Module({
  imports: modules,
  exports: modules,
})
export class WhatsappWebhookApplicationModule {}
