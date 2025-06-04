import { Module } from '@nestjs/common';
import { EchoMessageService, SessionManagerService, ClientService, ConversationService } from '.';
import { ChatTranscriptionService } from './chat-transcription.service';
import { WhatsappWebhookClientsModule } from '../../infrastructure';
import { EmailModule } from '../../infrastructure/email.module';
import { WhatsappWebhookServicesModule as InfraServicesModule } from '../../infrastructure/services/whatsapp-webhook-services.module';

const services = [
  EchoMessageService,
  SessionManagerService,
  ClientService,
  ConversationService,
  ChatTranscriptionService,
];

@Module({
  imports: [
    WhatsappWebhookClientsModule, 
    EmailModule,
    InfraServicesModule, // Importar servicios de infraestructura (MFA, Rate Limiting)
  ],
  providers: services,
  exports: services,
})
export class WhatsappWebhookServicesModule {}
