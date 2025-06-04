import { Injectable } from '@nestjs/common';
import { WhatsappClient } from '../clients';
import { Message, IMessageRepository } from '../../domain';

@Injectable()
export class MessageRepository implements IMessageRepository {
    constructor(private readonly whatsappClient: WhatsappClient) {}

    async save(message: Message) {
        return (await this.whatsappClient.sendMessage(message.body)).data;
    }
}

