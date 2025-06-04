import { Module } from '@nestjs/common';
import { HandleIncomingMessageUseCase } from '.';
import { WhatsappWebhookServicesModule } from '../services';
import { WhatsappWebhookRepositoriesModule } from '../../infrastructure';

const usesCases = [HandleIncomingMessageUseCase];

@Module({
  imports: [WhatsappWebhookServicesModule, WhatsappWebhookRepositoriesModule],
  providers: usesCases,
  exports: usesCases,
})
export class WhatsappWebhookUsesCasesModule {}
