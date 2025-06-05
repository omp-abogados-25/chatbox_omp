import { IsArray, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO que representa un mensaje individual recibido desde WhatsApp
 * 
 * Cada mensaje que llega del webhook de Meta tiene esta estructura básica.
 * Puede ser un mensaje de texto normal o una respuesta a un menú interactivo.
 */
class MessageDto {
  /**
   * ID único del mensaje generado por WhatsApp
   * Ejemplo: "wamid.HBgLMTU3MzAwMTIzNDU2NxUCABIYFjNBMDJCMEE2RkY4QzRBNDZBQUQyRkQA"
   */
  @IsString()
  id: string;

  /**
   * Número de teléfono del remitente (quien envía el mensaje)
   * Formato: código de país + número sin espacios ni símbolos
   * Ejemplo: "573001234567" (Colombia: 57 + 3001234567)
   */
  @IsString()
  from: string;

  /**
   * Tipo de mensaje recibido
   * Valores posibles:
   * - "text": Mensaje de texto normal
   * - "interactive": Respuesta a un menú interactivo (botones/listas)
   * - "image": Imagen
   * - "document": Documento
   * - "audio": Audio
   * - "video": Video
   */
  @IsString()
  type: string;

  /**
   * Contenido del mensaje de texto (solo para type: "text")
   * Es opcional porque no todos los tipos de mensaje tienen texto
   * 
   * Estructura:
   * {
   *   body: "Hola, necesito ayuda"
   * }
   */
  @IsObject()
  text?: { body: string };

  /**
   * Contenido de respuesta a menú interactivo (solo para type: "interactive")
   * Es opcional porque solo aparece cuando el usuario responde a menús
   * 
   * Estructura para listas:
   * {
   *   type: "list_reply",
   *   list_reply: {
   *     id: "doc_cc",
   *     title: "Cédula de Ciudadanía",
   *     description: "CC - Documento nacional"
   *   }
   * }
   * 
   * Estructura para botones:
   * {
   *   type: "button_reply",
   *   button_reply: {
   *     id: "btn_yes",
   *     title: "Sí"
   *   }
   * }
   */
  @IsObject()
  interactive?: {
    type: string; // "list_reply" o "button_reply"
    list_reply?: {
      id: string;        // ID que definimos en el menú (ej: "doc_cc")
      title: string;     // Texto que seleccionó el usuario
      description?: string; // Descripción opcional
    };
    button_reply?: {
      id: string;        // ID que definimos en el botón
      title: string;     // Texto del botón
    };
  };
}

/**
 * DTO que representa los datos del webhook de WhatsApp
 * 
 * Contiene metadatos importantes como el ID del número de teléfono comercial
 * y la lista de mensajes recibidos en este webhook.
 */
class ChangeValueDto {
  /**
   * Metadatos del webhook
   * Contiene información sobre el número de teléfono comercial que recibió el mensaje
   * 
   * Estructura:
   * {
   *   phone_number_id: "123456789012345"
   * }
   * 
   * El phone_number_id es el ID único de tu número comercial de WhatsApp Business
   * que configuraste en Meta for Developers. Lo necesitas para enviar respuestas.
   */
  @IsObject()
  metadata: { phone_number_id: string };

  /**
   * Lista de mensajes recibidos en este webhook
   * 
   * Normalmente contiene 1 mensaje, pero técnicamente puede contener varios.
   * Cada elemento es un MessageDto con la información del mensaje.
   * 
   * Ejemplo:
   * [
   *   {
   *     id: "wamid.xxx",
   *     from: "573001234567",
   *     type: "text",
   *     text: { body: "Hola" }
   *   }
   * ]
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
}

/**
 * DTO que representa un cambio/evento en el webhook
 * 
 * WhatsApp envía diferentes tipos de eventos (mensajes, cambios de estado, etc.)
 * Este DTO encapsula esos eventos.
 */
class ChangeDto {
  /**
   * Datos específicos del cambio/evento
   * Contiene la información real del mensaje y metadatos
   */
  @ValidateNested()
  @Type(() => ChangeValueDto)
  value: ChangeValueDto;
}

/**
 * DTO que representa una entrada en el webhook
 * 
 * Una "entrada" puede contener múltiples cambios/eventos.
 * Representa una instancia específica de tu aplicación de WhatsApp Business.
 */
class EntryDto {
  /**
   * ID único de la entrada
   * Generalmente es el ID de tu aplicación de WhatsApp Business
   * Ejemplo: "123456789012345"
   */
  @IsString()
  id: string;

  /**
   * Lista de cambios/eventos en esta entrada
   * 
   * Cada cambio puede ser:
   * - Un mensaje recibido
   * - Un cambio de estado de mensaje (entregado, leído, etc.)
   * - Otros eventos del webhook
   * 
   * Normalmente contiene 1 cambio por webhook.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangeDto)
  changes: ChangeDto[];
}

/**
 * DTO principal que representa tod el payload del webhook de WhatsApp
 * 
 * Este es el objeto completo que Meta envía al endpoint cuando ocurre un evento.
 * Contiene toda la información estructurada de manera jerárquica.
 * 
 * ESTRUCTURA COMPLETA DEL WEBHOOK:
 * 
 * {
 *   "object": "whatsapp_business_account",
 *   "entry": [
 *     {
 *       "id": "123456789012345",
 *       "changes": [
 *         {
 *           "value": {
 *             "metadata": {
 *               "phone_number_id": "987654321098765"
 *             },
 *             "messages": [
 *               {
 *                 "id": "wamid.HBgLMTU3MzAwMTIzNDU2NxUCABIYFjNBMDJCMEE2RkY4QzRBNDZBQUQyRkQA",
 *                 "from": "573001234567",
 *                 "type": "text",
 *                 "text": {
 *                   "body": "Hola, necesito un certificado laboral"
 *                 }
 *               }
 *             ]
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export class ReceiveMessageDto {
  /**
   * Tipo de objeto del webhook
   * Siempre es "whatsapp_business_account" para webhooks de WhatsApp Business
   * 
   * Meta usa esto para identificar qué tipo de webhook están enviando.
   */
  object: string;

  /**
   * Lista de entradas en el webhook
   * 
   * Cada entrada representa una instancia de tu aplicación de WhatsApp Business.
   * Normalmente solo hay 1 entrada por webhook, pero técnicamente pueden ser varias
   * si tienes múltiples números de WhatsApp Business configurados.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryDto)
  entry: EntryDto[];

  /**
   * Método utilitario para extraer los datos relevantes del mensaje
   * 
   * Este método navega por toda la estructura jerárquica compleja del webhook
   * y extrae solo la información que necesitamos para procesar el mensaje:
   * - ID del mensaje
   * - Número del remitente  
   * - Contenido del mensaje (texto o respuesta de menú)
   * - ID del número comercial (para responder)
   * 
   * @returns Objeto con los datos esenciales del mensaje o null si no hay mensaje válido
   * 
   * CASOS QUE MANEJA:
   * 
   * 1. Mensaje de texto normal:
   *    Input: { type: "text", text: { body: "Hola" } }
   *    Output: { body: "Hola" }
   * 
   * 2. Respuesta a lista interactiva:
   *    Input: { type: "interactive", interactive: { list_reply: { id: "doc_cc" } } }
   *    Output: { body: "doc_cc" }
   * 
   * 3. Respuesta a botón interactivo:
   *    Input: { type: "interactive", interactive: { button_reply: { id: "btn_yes" } } }
   *    Output: { body: "btn_yes" }
   * 
   * 4. Webhook sin mensajes (ej: notificaciones de estado):
   *    Output: null
   * 
   * 5. Mensaje de tipo no soportado (imagen, audio, etc.):
   *    Output: null
   */
  extract() {
    // Navegar por la estructura jerárquica: entry[0] -> changes[0]
    const change = this.entry?.[0]?.changes?.[0];
    
    // Verificar que existan mensajes en el webhook
    if (!change?.value?.messages || change.value.messages.length === 0) {
      // No hay mensajes = webhook de notificación de estado, ignorar
      return null;
    }
    
    // Obtener el primer mensaje (normalmente solo hay uno)
    const msg = change.value.messages[0];
    
    let body: string | null = null;
    
    // CASO 1: Mensaje de texto normal
    // Estructura: { type: "text", text: { body: "contenido del mensaje" } }
    if (msg.text?.body) {
      body = msg.text.body;
    }
    // CASO 2: Respuesta a menú de lista interactiva
    // Estructura: { type: "interactive", interactive: { list_reply: { id: "opcion_seleccionada" } } }
    else if (msg.interactive?.list_reply?.id) {
      body = msg.interactive.list_reply.id;
    }
    // CASO 3: Respuesta a botón interactivo
    // Estructura: { type: "interactive", interactive: { button_reply: { id: "boton_presionado" } } }
    else if (msg.interactive?.button_reply?.id) {
      body = msg.interactive.button_reply.id;
    }
    
    // Si no pudimos extraer contenido, ignorar el mensaje
    if (!body) {
      return null;
    }
    
    // Retornar los datos esenciales para procesar el mensaje
    return {
      id: msg.id,                                           // ID único del mensaje
      from: msg.from,                                       // Número del remitente
      body: body,                                           // Contenido del mensaje
      phoneNumberId: change.value.metadata.phone_number_id, // ID del número comercial
    };
  }
}
