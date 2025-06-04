import { Module } from '@nestjs/common';
import { WhatsappClient } from '.';
import { HttpModule } from '@nestjs/axios';

const clients = [
    WhatsappClient,
    {
        provide: 'IWhatsappClient',
        useClass: WhatsappClient,
    }
]; 

@Module({
  imports: [HttpModule],
  providers: clients,
  exports: clients,
})
export class WhatsappWebhookClientsModule {}
