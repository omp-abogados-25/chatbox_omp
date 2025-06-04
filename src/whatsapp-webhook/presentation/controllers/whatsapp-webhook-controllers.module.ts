import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WhatsappWebhookApplicationModule } from 'src/whatsapp-webhook/application';

const controllers = [WebhookController];

@Module({
    imports: [WhatsappWebhookApplicationModule],
    controllers: controllers,
})
export class WhatsappWebhookControllersModule {}



