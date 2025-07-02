import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { SessionTraceController } from './session-trace.controller';
import { WhatsappWebhookApplicationModule } from 'src/whatsapp-webhook/application';

const controllers = [WebhookController, SessionTraceController];

@Module({
    imports: [WhatsappWebhookApplicationModule],
    controllers: controllers,
})
export class WhatsappWebhookControllersModule {}



