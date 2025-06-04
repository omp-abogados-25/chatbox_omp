import { Module } from '@nestjs/common';
import { MessageRepository } from '.';
import { WhatsappWebhookClientsModule } from '../clients';

const repositories = [
    MessageRepository,
    {
        provide: 'IMessageRepository',
        useClass: MessageRepository,
    }
];

@Module({
    imports: [WhatsappWebhookClientsModule],
    providers: repositories,
    exports: repositories,
})
export class WhatsappWebhookRepositoriesModule {}


