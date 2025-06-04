import { Message } from "../entities";

/**
 * Puerto para enviar mensajes a WhatsApp.
 */
export interface IWhatsappClient {
    sendMessage(payload: any): Promise<any>;
  }
  
  /**
   * Puerto para persistir mensajes en la capa de infraestructura.
   */
  export interface IMessageRepository {
    save(message: Message): Promise<void>;
  }
  