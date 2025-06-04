import { Injectable } from '@nestjs/common';
import { ConversationService } from '../services';
import { ReceiveMessageDto } from '../../presentation';

@Injectable()
export class HandleIncomingMessageUseCase {
  private readonly processedMessages = new Set<string>();

  constructor(
    private readonly conversationService: ConversationService,
  ) {}

  async execute(dto: ReceiveMessageDto): Promise<void> {
    // Si el dto no es una instancia de la clase, crear una nueva instancia
    const messageDto = dto.extract ? dto : Object.assign(new ReceiveMessageDto(), dto);
    
    // Verificar si hay cambios y si contienen mensajes
    const entry = messageDto.entry?.[0];
    if (!entry) {
      return;
    }
    
    const change = entry.changes?.[0];
    if (!change) {
      return;
    }
    
    // Intentar extraer los datos del mensaje
    const extractedData = messageDto.extract();
    
    if (!extractedData) {
      // No hay mensajes válidos, probablemente es una notificación de estado
      return;
    }
    
    const { from, body, id, phoneNumberId } = extractedData;
    
    // Verificar si ya procesamos este mensaje
    if (this.processedMessages.has(id)) {
      return;
    }
    
    // Marcar el mensaje como procesado
    this.processedMessages.add(id);
    
    // Usar el servicio de conversación
    await this.conversationService.handleMessage(from, body, id, phoneNumberId);
  }
}
