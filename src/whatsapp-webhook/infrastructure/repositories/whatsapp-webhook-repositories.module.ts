import { Module } from '@nestjs/common';
import { MessageRepository } from '.';
import { PrismaCertificateRequestRepository } from './certificate-request.repository';
import { SessionTraceRepositoryImpl } from './session-trace.repository';
import { WhatsappWebhookClientsModule } from '../clients';
import { PrismaModule } from '../../../integrations/prisma';

const repositories = [
    MessageRepository,
    {
        provide: 'IMessageRepository',
        useClass: MessageRepository,
    },
    PrismaCertificateRequestRepository,
    {
        provide: 'CertificateRequestRepository',
        useClass: PrismaCertificateRequestRepository,
    },
    SessionTraceRepositoryImpl,
    {
        provide: 'SessionTraceRepository',
        useClass: SessionTraceRepositoryImpl,
    }
];

@Module({
    imports: [
        WhatsappWebhookClientsModule,
        PrismaModule,
    ],
    providers: repositories,
    exports: repositories,
})
export class WhatsappWebhookRepositoriesModule {}


