import { Inject, Injectable } from '@nestjs/common';
import { IWhatsappClient } from '../../domain';

@Injectable()
export class EchoMessageService {
  constructor(
    @Inject('IWhatsappClient') private readonly client: IWhatsappClient,
  ) {}

  reply(to: string, text: string, replyToId: string, phoneNumberId: string) {
    return this.client.sendMessage({
      messaging_product: 'whatsapp',
      to,
      text: { body: text },
      context: { message_id: replyToId },
    });
  }

  sendInteractiveMessage(messageData: any) {
    return this.client.sendMessage(messageData);
  }

  markRead(messageId: string, phoneNumberId: string) {
    return this.client.sendMessage({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  }
}
