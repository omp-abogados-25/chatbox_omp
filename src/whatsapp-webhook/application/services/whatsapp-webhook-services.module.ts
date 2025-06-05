import { Module } from '@nestjs/common';
import { EchoMessageService, SessionManagerService, ClientService, ConversationService } from '.';
import { ChatTranscriptionService } from './chat-transcription.service';
import { MfaConversationFlowService } from './mfa-conversation-flow.service';
import { CertificateConversationFlowService } from './certificate-conversation-flow.service';
import { InitialAuthenticationFlowService } from './initial-authentication-flow.service';
import { WhatsappWebhookClientsModule } from '../../infrastructure';
import { EmailModule } from '../../infrastructure/email.module';
import { WhatsappWebhookServicesModule as InfraServicesModule } from '../../infrastructure/services/whatsapp-webhook-services.module';
import { UsersApplicationModule } from '../../../modules/users/application/users-application.module';
import { PositionFunctionModule } from '../../../modules/position-functions';
import { PositionsApplicationModule } from '../../../modules/positions/application/positions-application.module';

const services = [
  EchoMessageService,
  SessionManagerService,
  ClientService,
  ConversationService,
  ChatTranscriptionService,
  InitialAuthenticationFlowService,
  MfaConversationFlowService,
  CertificateConversationFlowService,
];

@Module({
  imports: [
    WhatsappWebhookClientsModule, 
    EmailModule,
    InfraServicesModule, // Importar servicios de infraestructura (MFA, Rate Limiting)
    UsersApplicationModule,
    PositionFunctionModule,
    PositionsApplicationModule,
  ],
  providers: services,
  exports: services,
})
export class WhatsappWebhookServicesModule {}
