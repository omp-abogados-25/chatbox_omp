import { Injectable } from '@nestjs/common';

export interface ChatMessage {
  timestamp: Date;
  sender: 'user' | 'system';
  message: string;
}

@Injectable()
export class ChatTranscriptionService {
  private readonly conversations: Map<string, ChatMessage[]> = new Map();

  addMessage(phoneNumber: string, sender: 'user' | 'system', message: string): void {
    if (!this.conversations.has(phoneNumber)) {
      this.conversations.set(phoneNumber, []);
    }

    const conversation = this.conversations.get(phoneNumber);
    conversation.push({
      timestamp: new Date(),
      sender,
      message,
    });
  }

  getTranscription(phoneNumber: string): string {
    const conversation = this.conversations.get(phoneNumber) || [];
    
    if (conversation.length === 0) {
      return 'No hay mensajes en esta conversación.';
    }

    let transcription = '';
    
    conversation.forEach((msg, index) => {
      const time = msg.timestamp.toLocaleTimeString('es-CO');
      const senderLabel = msg.sender === 'user' ? 'Usuario' : 'Sistema';
      
      transcription += `[${time}] ${senderLabel}: ${msg.message}\n\n`;
    });

    return transcription;
  }

  clearConversation(phoneNumber: string): void {
    this.conversations.delete(phoneNumber);
  }

  getConversationSummary(phoneNumber: string): {
    messageCount: number;
    startTime: Date | null;
    endTime: Date | null;
    duration: string;
  } {
    const conversation = this.conversations.get(phoneNumber) || [];
    
    if (conversation.length === 0) {
      return {
        messageCount: 0,
        startTime: null,
        endTime: null,
        duration: '0 minutos',
      };
    }

    const startTime = conversation[0].timestamp;
    const endTime = conversation[conversation.length - 1].timestamp;
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    return {
      messageCount: conversation.length,
      startTime,
      endTime,
      duration: `${durationMinutes} minuto${durationMinutes !== 1 ? 's' : ''}`,
    };
  }
} 