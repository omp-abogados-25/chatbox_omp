import { Injectable, Inject, Logger } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { EchoMessageService } from './echo-message.service';
import { ChatTranscriptionService } from './chat-transcription.service';
import { SessionState, DocumentType, IEmailService } from '../../domain';
import { FindFunctionDetailsByPositionIdUseCase } from '../../../modules/position-functions/application/use-cases';
import { FindPositionByIdUseCase } from '../../../modules/positions/application/use-cases';
import { Position as DomainPosition } from '../../../modules/positions/domain/entities/position.entity';
import { FunctionDetailItem } from '../../../modules/position-functions/domain/repositories';
import { SessionWithAllData } from '../../domain/types/session-data.types';
import { toWordsConverter } from '../config/to-words.config';

/**
 * @class CertificateConversationFlowService
 * @description Servicio para manejar el flujo de conversación relacionado con la 
 *              solicitud y generación de certificados laborales.
 *              Gestiona los menús de selección, la recopilación de datos necesarios
 *              y la orquestación del proceso de generación del certificado.
 */
@Injectable()
export class CertificateConversationFlowService {
  private readonly logger = new Logger(CertificateConversationFlowService.name);

  constructor(
    private readonly sessionManager: SessionManagerService,
    @Inject('IEmailService') private readonly emailService: IEmailService,
    private readonly messageService: EchoMessageService,
    private readonly transcriptionService: ChatTranscriptionService,
    private readonly findFunctionDetailsByPositionIdUseCase: FindFunctionDetailsByPositionIdUseCase,
    private readonly findPositionByIdUseCase: FindPositionByIdUseCase,
  ) {}

  /**
   * Envía un mensaje a través de WhatsApp y registra la transcripción del mismo
   * 
   * @param from - Número de teléfono del destinatario en formato internacional
   * @param message - Contenido del mensaje a enviar
   * @param messageId - ID único del mensaje de WhatsApp
   * @param phoneNumberId - ID del número de teléfono de WhatsApp Business
   * 
   * El flujo de la función es:
   * 1. Intenta enviar el mensaje usando messageService.reply()
   * 2. Registra el mensaje en la transcripción como mensaje del sistema
   * 3. Si hay error:
   *    - Registra el error en los logs
   *    - Guarda en la transcripción un mensaje de error truncado a 50 caracteres
   */
  private async sendMessageAndLog(from: string, message: string, messageId: string, phoneNumberId: string): Promise<void> {
    try {
      // Envía el mensaje a WhatsApp
      await this.messageService.reply(from, message, messageId, phoneNumberId);
      
      // Registra el mensaje en la transcripción
      this.transcriptionService.addMessage(from, 'system', message);
    } catch (error) {
      // Manejo de errores: registra en logs y transcripción
      this.logger.error(`Error sending message to ${from}:`, error instanceof Error ? error.message : String(error));
      this.transcriptionService.addMessage(from, 'system', `[ERROR] Failed to send: ${message.substring(0, 50)}...`);
    }
  }

  /**
   * Envía un menú interactivo por WhatsApp y registra la interacción en el log de transcripción.
   * Si falla el envío del menú interactivo, intenta enviar un mensaje de texto alternativo.
   * 
   * @param from - Número de teléfono del destinatario en formato internacional
   * @param menuMessage - Objeto con la configuración del menú interactivo a enviar
   * @param menuDescription - Descripción del menú para el registro de transcripción
   * @param fallbackMessageOverride - Mensaje de texto alternativo personalizado (opcional)
   * 
   * El flujo de la función es:
   * 1. Intenta enviar el menú interactivo usando messageService
   * 2. Registra el menú en la transcripción
   * 3. Si falla el envío del menú:
   *    - Determina un mensaje de texto alternativo según el tipo de menú
   *    - Intenta enviar el mensaje alternativo
   *    - Registra el fallback en la transcripción
   * 
   * Tipos de menús soportados:
   * - Certificados Laborales: Opciones con/sin sueldo
   * - Detalle de Funciones: Opciones incluir/omitir funciones
   * - Menú genérico: Mensaje genérico con instrucciones básicas
   */
  private async sendInteractiveMenuAndLog(from: string, menuMessage: any, menuDescription: string, fallbackMessageOverride?: string): Promise<void> {
    try {
      // Intenta enviar el menú interactivo usando el servicio de mensajes
      await this.messageService.sendInteractiveMessage(menuMessage);
      this.transcriptionService.addMessage(from, 'system', `[Menú Interactivo] ${menuDescription}`);
      this.logger.log(`Interactive menu sent successfully to ${from}: ${menuDescription}`);
    } catch (error) {
      this.logger.error(`Error sending interactive menu to ${from}:`, error instanceof Error ? error.message : String(error));
      // Re-lanza el error para que el método llamador pueda manejarlo
      throw error;
    }
  }
  
  /**
   * Convierte un valor de salario a su representación en palabras y formato de moneda
   * 
   * @param salaryString - El salario como string que puede contener números, puntos y comas
   * @returns Un objeto con el salario en letras y en formato de moneda colombiana
   *
   * Ejemplo:
   * Input: "1.234.567"
   * Output: {
   *   salaryInLetters: "Un millón doscientos treinta y cuatro mil quinientos sesenta y siete pesos",
   *   salaryFormatCurrency: "$ 1.234.567"
   * }
   */
  private convertSalaryToWords(salaryString: string | null | undefined): { salaryInLetters: string; salaryFormatCurrency: string } {
    // Validación inicial del input
    if (salaryString === null || salaryString === undefined || String(salaryString).trim() === '') {
        return { salaryInLetters: 'NO ESPECIFICADO', salaryFormatCurrency: 'NO ESPECIFICADO' };
    }

    // Limpia el string de salario dejando solo números y el punto decimal
    // Ejemplo: "1.234.567,00" -> "1234567.00"
    const cleanedSalaryString = String(salaryString).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    
    // Convierte el string limpio a número
    const salaryNumber = parseFloat(cleanedSalaryString);
    
    // Valida si la conversión fue exitosa
    if (isNaN(salaryNumber)) {
        this.logger.warn(`Valor de salario no numérico recibido: '${salaryString}', limpiado a: '${cleanedSalaryString}'.`);
        return { salaryInLetters: 'VALOR INVÁLIDO', salaryFormatCurrency: 'VALOR INVÁLIDO' };
    }

    // Formatea el salario a moneda colombiana (ej: $ 1.234.567)
    const salaryFormatCurrency = salaryNumber.toLocaleString('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
    let salaryInLetters = 'ERROR AL CONVERTIR';
    try {
      let convertedText = toWordsConverter.convert(salaryNumber, { currency: true });
      
      // Formatea el texto convertido (primera letra mayúscula)
      if (convertedText && convertedText.length > 0) {
        convertedText = convertedText.toLowerCase();
        salaryInLetters = convertedText.charAt(0).toUpperCase() + convertedText.slice(1);
      } else {
        salaryInLetters = 'No especificado';
      }
    } catch (error) {
      // Registra cualquier error durante la conversión
      this.logger.error(`Error al convertir salario a palabras:`, error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined);
    }

    return { salaryInLetters, salaryFormatCurrency };
  }

  /**
   * Escapa caracteres especiales HTML para prevenir inyección XSS
   * @param unsafe - String que puede contener caracteres HTML peligrosos
   * @returns String con los caracteres especiales escapados de forma segura
   */
  private escapeHtml(unsafe: string): string {
    if (unsafe === null || unsafe === undefined) return ''; // Si el input es nulo o indefinido, retorna string vacío
    return unsafe
         .replace(/&/g, "&amp;")  // Reemplaza & por &amp;
         .replace(/</g, "&lt;")   // Reemplaza < por &lt;
         .replace(/>/g, "&gt;")   // Reemplaza > por &gt; 
         .replace(/"/g, "&quot;") // Reemplaza " por &quot;
         .replace(/'/g, "&#039;"); // Reemplaza ' por &#039;
  }

  /**
   * Muestra el menú principal de selección de tipo de certificado
   * @param from - Número de WhatsApp del usuario
   * @param messageId - ID del mensaje de WhatsApp
   * @param phoneNumberId - ID del número de WhatsApp del bot
   */
  public async showCertificateMenu(from: string, messageId: string, phoneNumberId: string): Promise<void> {
    // Construye el objeto de mensaje interactivo con botones
    const menuMessage = {
      messaging_product: 'whatsapp',
      to: from,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'text', text: '📄 Certificados Laborales' },
        body: { 
          text: '¿Qué tipo de certificado laboral necesitas?\n\n💡 *Selecciona un botón o escribe:*\n• "1" o "con salario"\n• "2" o "sin salario" \n• "3" o "con funciones"' 
        },
        action: {
          buttons: [
            { 
              type: 'reply', 
              reply: { 
                id: 'cert_con_sueldo', 
                title: '💰 1. Con Salario' 
              } 
            },
            { 
              type: 'reply', 
              reply: { 
                id: 'cert_sin_sueldo', 
                title: '📋 2. Sin Salario' 
              } 
            },
            { 
              type: 'reply', 
              reply: { 
                id: 'cert_con_funciones', 
                title: '🔧 3. Con Funciones' 
              } 
            }
          ]
        }
      }
    };

    // Intenta enviar el menú interactivo primero
    try {
      await this.sendInteractiveMenuAndLog(from, menuMessage, 'certificado');
    } catch (error) {
      this.logger.error(`Failed to send interactive menu to ${from}, falling back to text message:`, error instanceof Error ? error.message : String(error));
      
      // Fallback a mensaje de texto simple
      const fallbackMessage = `📄 **Certificados Laborales**

¿Qué tipo de certificado laboral necesitas?

*Opciones disponibles:*
1️⃣ Certificado con Salario - Incluye información salarial
2️⃣ Certificado sin Salario - Solo información básica laboral  
3️⃣ Certificado con Funciones - Incluye detalle de funciones del cargo

💡 **Puedes escribir:** el número (1, 2, 3), el tipo ("con salario", "sin salario", "con funciones") o "finalizar"`;

      await this.sendMessageAndLog(from, fallbackMessage, messageId, phoneNumberId);
    }

    // Actualiza el estado de la sesión del usuario
    this.sessionManager.updateSessionState(from, SessionState.WAITING_CERTIFICATE_TYPE);
    this.logger.log(`Session state for ${from} updated to WAITING_CERTIFICATE_TYPE.`);
  }

  /**
   * Maneja la selección de opciones del menú por parte del usuario.
   * 
   * @description Esta función procesa las selecciones que hace el usuario en los menús interactivos,
   * específicamente para elegir el tipo de certificado (con/sin sueldo) y si desea incluir funciones.
   * 
   * @param from - Número de WhatsApp del usuario
   * @param body - Texto del mensaje/selección del usuario 
   * @param messageId - ID del mensaje de WhatsApp
   * @param phoneNumberId - ID del número de WhatsApp del bot
   * @param onGenericAuthenticatedStateCallback - Callback para estado autenticado
   */
  public async handleMenuSelection(
    from: string, 
    body: string, 
    messageId: string, 
    phoneNumberId: string,
    onGenericAuthenticatedStateCallback: () => Promise<void> 
  ): Promise<void> {
    // Obtiene la sesión del usuario y valida que exista
    const session = this.sessionManager.getSession(from) as SessionWithAllData | null;
    if (!session) {
      this.logger.warn(`No session found for ${from} in handleMenuSelection. Cannot proceed.`);
      await this.sendMessageAndLog(from, 'Tu sesión no fue encontrada. Por favor, intenta iniciar de nuevo.', messageId, phoneNumberId);
      return;
    }

    // Normaliza el input del usuario
    const input = body.trim().toLowerCase();

    // Maneja comando de finalización
    if (input === 'finalizar') {
      this.sessionManager.clearSession(from);
      await this.sendMessageAndLog(from, 'Sesión finalizada. Gracias por usar nuestros servicios. ¡Vuelve pronto! 👋', messageId, phoneNumberId);
      return;
    }

    // Maneja la selección del tipo de certificado
    if (session.state === SessionState.WAITING_CERTIFICATE_TYPE) {
      let finalCertificateType: string | undefined;
      let finalCertificateTypeDisplay: string | undefined;

      // Determina qué tipo de certificado seleccionó el usuario
      // Acepta: IDs del menú, números, o texto descriptivo
      if (input === 'cert_con_sueldo' || input === '1' || 
          input.includes('certificado con salario') || input.includes('con salario')) {
        finalCertificateType = 'con_sueldo_sin_funciones';
        finalCertificateTypeDisplay = 'Certificado laboral con salario';
      } else if (input === 'cert_sin_sueldo' || input === '2' || 
                 input.includes('certificado sin salario') || input.includes('sin salario')) {
        finalCertificateType = 'sin_sueldo_sin_funciones';
        finalCertificateTypeDisplay = 'Certificado laboral sin salario';
      } else if (input === 'cert_con_funciones' || input === '3' || 
                 input.includes('certificado con funciones') || input.includes('con funciones')) {
        finalCertificateType = 'sin_sueldo_con_funciones';
        finalCertificateTypeDisplay = 'Certificado laboral con funciones';
      } else {
        // Si la selección no es válida, muestra el menú nuevamente
        await this.sendMessageAndLog(from, 'Opción no válida. Por favor, selecciona una opción del menú, escribe el número (1, 2, 3) o el tipo de certificado, o escribe "finalizar".', messageId, phoneNumberId);
        await this.showCertificateMenu(from, messageId, phoneNumberId); 
        return;
      }

      this.logger.log(`User ${from} selected certificate type: ${finalCertificateTypeDisplay}. Input was: "${body}"`);
      
      await this.processCertificateRequest(
        from, 
        finalCertificateTypeDisplay, 
        finalCertificateType,
        messageId, 
        phoneNumberId,
        onGenericAuthenticatedStateCallback
      );

    } 
    // Maneja la selección de acción final (después de generar certificado)
    else if (session.state === SessionState.WAITING_FINAL_ACTION) {
      if (input === 'generate_another' || input === 'otro' || input === 'certificado') {
        this.logger.log(`User ${from} requested another certificate. Showing certificate menu.`);
        await this.showCertificateMenu(from, messageId, phoneNumberId);
      } else if (input === 'finish_session' || input === 'finalizar') {
        this.logger.log(`User ${from} requested session termination from final menu.`);
        this.sessionManager.clearSession(from);
        await this.sendMessageAndLog(from, 'Sesión finalizada. ¡Gracias por usar nuestros servicios! 👋', messageId, phoneNumberId);
      } else {
        // Si la selección no es válida, muestra el menú nuevamente
        await this.sendMessageAndLog(from, 'Opción no válida. Por favor, selecciona "📄 Otro Certificado", "🚪 Finalizar" o escribe "otro"/"finalizar".', messageId, phoneNumberId);
        await this.showFinalActionMenu(from, messageId, phoneNumberId); 
        return;
      }
    } 
    else {
      this.logger.warn(`handleMenuSelection llamado en estado inesperado: ${session.state} para ${from}. Input: "${body}".`);
      await this.sendMessageAndLog(from, "No entendí tu respuesta. Por favor, selecciona una opción de un menú o escribe \"finalizar\".", messageId, phoneNumberId);
    }
  }

  /**
   * Procesa la solicitud de generación y envío de un certificado laboral.
   * 
   * @description Este método maneja todo el proceso de generación y envío de certificados laborales,
   * incluyendo la recopilación de datos del empleado, formateo de información salarial, obtención de
   * funciones del cargo (si aplica) y envío por correo electrónico.
   * 
   * Flujo principal:
   * 1. Valida que la sesión tenga toda la información necesaria del usuario
   * 2. Envía mensaje de "cargando" al usuario
   * 3. Obtiene el nombre del cargo desde la base de datos
   * 4. Formatea los datos salariales a texto
   * 5. Si el certificado es "con funciones", obtiene y agrupa las funciones del cargo
   * 6. Genera y envía el certificado por email
   * 7. Notifica al usuario el resultado
   * 
   * @param from - Número de WhatsApp del solicitante
   * @param certificateDisplayInfo - Descripción legible del tipo de certificado (ej: "Con Sueldo y Con Funciones") 
   * @param finalCertificateTypeKey - Clave técnica del tipo de certificado (ej: "con_sueldo_con_funciones")
   * @param messageId - ID del mensaje de WhatsApp
   * @param phoneNumberId - ID del número de WhatsApp del bot
   * @param onGenericAuthenticatedStateCallback - Callback para manejar el estado autenticado
   */
  public async processCertificateRequest(
    from: string, 
    certificateDisplayInfo: string, 
    finalCertificateTypeKey: string,    
    messageId: string, 
    phoneNumberId: string,
    onGenericAuthenticatedStateCallback: () => Promise<void>
  ): Promise<void> {
    const session = this.sessionManager.getSession(from) as SessionWithAllData | null;
    if (!session || !session.userId || !session.clientName || !session.documentNumber || !session.documentType || !session.email) {
      this.logger.error(`Información de cliente incompleta en sesión para ${from}: ${JSON.stringify(session)}`);
      await this.sendMessageAndLog(from, 'Falta información crítica para generar el certificado. Por favor, reinicia el proceso.', messageId, phoneNumberId);
      this.sessionManager.updateSessionState(from, SessionState.AUTHENTICATED); 
      await onGenericAuthenticatedStateCallback();
      return;
    }

    this.logger.log(`Iniciando processCertificateRequest para ${from}. Tipo: ${finalCertificateTypeKey}`);
    const loadingMessage = `⏳ Procesando tu solicitud de certificado laboral solicitado

Por favor espera un momento.`;
    await this.sendMessageAndLog(from, loadingMessage, messageId, phoneNumberId);

    try {
      let positionName = 'CARGO NO ESPECIFICADO';
      if (session.positionId) {
        try {
          const positionObject: DomainPosition | null = await this.findPositionByIdUseCase.execute(session.positionId);
          positionName = positionObject?.name || positionName;
        } catch (err) {
          this.logger.error(`Error al buscar nombre de cargo para positionId ${session.positionId}:`, err instanceof Error ? String(err.message) : String(err));
        }
      }
      
      const salaryDetails = this.convertSalaryToWords(session.salary);
      const transportationDetails = this.convertSalaryToWords(session.transportationAllowance);

      const clientDataForCertificate = {
        id: session.userId,
        name: session.clientName,
        documentType: session.documentType,
        documentNumber: session.documentNumber,
        cityDocument: session.issuingPlace || 'PENDIENTE', 
        position: positionName, 
        startDate: session.entryDate || 'PENDIENTE', 
        salary: session.salary, 
        salaryInLetters: salaryDetails.salaryInLetters, 
        salaryFormatCurrency: salaryDetails.salaryFormatCurrency, 
        transportationAllowance: session.transportationAllowance,
        transportationAllowanceInLetters: transportationDetails.salaryInLetters, 
        transportationAllowanceFormatCurrency: transportationDetails.salaryFormatCurrency,
        email: session.email,
        phone: from,
      };

      // Si el certificado es con funciones, obtiene y agrupa las funciones del cargo
      let functionsForTemplate: Array<{ categoryName: string; functions: string[] }> | null = null;
      if (finalCertificateTypeKey.includes('con_funciones')) {
        if (session.positionId) {
          const functionDetailsArray: FunctionDetailItem[] = await this.findFunctionDetailsByPositionIdUseCase.execute(session.positionId);
          if (functionDetailsArray && functionDetailsArray.length > 0) {
            // Agrupa las funciones por categoría
            const groupedFunctions: { [key: string]: string[] } = {};
            // Itera sobre cada función del array de detalles de funciones
            for (const func of functionDetailsArray) {
              // Determina la categoría de la función - usa las notas si existen, sino usa 'FUNCIONES GENERALES'
              const noteKey = (func.notes && func.notes.trim() !== '') ? func.notes.trim() : 'FUNCIONES GENERALES';
              
              // Inicializa el array para esta categoría si no existe
              if (!groupedFunctions[noteKey]) groupedFunctions[noteKey] = [];
              
              // Agrega el detalle de la función a su categoría correspondiente
              groupedFunctions[noteKey].push(func.details || 'Función no especificada');
            }

            // Transforma el objeto agrupado en el formato requerido para la plantilla
            functionsForTemplate = Object.entries(groupedFunctions).map(([category, functions]) => ({
              categoryName: this.escapeHtml(category.toUpperCase()), // Convierte la categoría a mayúsculas y escapa HTML
              functions: functions.map(detail => this.escapeHtml(detail)) // Escapa HTML en cada función
            }));
          } else {
            // Si no hay funciones definidas, establece un mensaje por defecto
            functionsForTemplate = [{ 
              categoryName: 'FUNCIONES', 
              functions: ['No se detallan funciones específicas para este cargo.'] 
            }];
          }
        } else {
          functionsForTemplate = [{ categoryName: 'FUNCIONES', functions: ['No se pudo determinar el cargo para listar funciones.'] }];
        }
      }

      const chatHistory = this.transcriptionService.getTranscription(from);
      const success = await this.emailService.sendCertificateEmail(
        session.email, 
        clientDataForCertificate as any, 
        finalCertificateTypeKey, 
        chatHistory,
        functionsForTemplate,
      );

      if (success) {
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('es-CO');
        const formattedTime = currentDate.toLocaleTimeString('es-CO');
        
        const successMessage = `✅ *CERTIFICADO GENERADO EXITOSAMENTE*

📋 *Detalles de la solicitud:*
* Nombre: ${session.clientName}
* Documento: ${session.documentType} ${session.documentNumber}
* Tipo: ${certificateDisplayInfo}
* Fecha: ${formattedDate}
* Hora: ${formattedTime}

📧 *El certificado ha sido enviado a:* ${session.email}

¿Necesitas algo más? Puedes solicitar otro certificado o finalizar la conversación.`;
        await this.sendMessageAndLog(from, successMessage, messageId, phoneNumberId);
        this.transcriptionService.clearConversation(from); 
        
        // Mostrar menú final con botones en lugar del callback genérico
        await this.showFinalActionMenu(from, messageId, phoneNumberId);
      } else {
        await this.sendMessageAndLog(from, 'Lo siento, hubo un error al generar o enviar tu certificado. Intenta más tarde o contacta a RRHH.', messageId, phoneNumberId);
        this.sessionManager.updateSessionState(from, SessionState.AUTHENTICATED);
        await onGenericAuthenticatedStateCallback();
      }

    } catch (error) {
      this.logger.error(`Error en processCertificateRequest para ${from}:`, error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined);
      await this.sendMessageAndLog(from, '❌ Ocurrió un error inesperado. Contacta a soporte.', messageId, phoneNumberId);
      this.sessionManager.updateSessionState(from, SessionState.AUTHENTICATED);
      await onGenericAuthenticatedStateCallback();
    }
  }

  /**
   * Muestra los botones finales después de generar un certificado exitosamente
   * @param from - Número de WhatsApp del usuario
   * @param messageId - ID del mensaje de WhatsApp
   * @param phoneNumberId - ID del número de WhatsApp del bot
   */
  public async showFinalActionMenu(from: string, messageId: string, phoneNumberId: string): Promise<void> {
    // Construye el objeto de mensaje interactivo con botones finales
    const finalMenuMessage = {
      messaging_product: 'whatsapp',
      to: from,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'text', text: '✅ Certificado Completado' },
        body: { 
          text: '¿Qué deseas hacer ahora?\n\n💡 *Selecciona una opción o escribe:*\n• "otro" para generar otro certificado\n• "finalizar" para terminar' 
        },
        action: {
          buttons: [
            { 
              type: 'reply', 
              reply: { 
                id: 'generate_another', 
                title: '📄 Otro Certificado' 
              } 
            },
            { 
              type: 'reply', 
              reply: { 
                id: 'finish_session', 
                title: '🚪 Finalizar' 
              } 
            }
          ]
        }
      }
    };

    // Intenta enviar el menú interactivo primero
    try {
      await this.sendInteractiveMenuAndLog(from, finalMenuMessage, 'acción final');
    } catch (error) {
      this.logger.error(`Failed to send final action menu to ${from}, falling back to text message:`, error instanceof Error ? error.message : String(error));
      
      // Fallback a mensaje de texto simple
      const fallbackMessage = `✅ **Certificado Completado**

¿Qué deseas hacer ahora?

*Opciones disponibles:*
📄 Generar otro certificado - Escribe "otro" o "certificado"
🚪 Finalizar conversación - Escribe "finalizar"

💡 **Elige una opción o espera 5 minutos para que la sesión expire automáticamente.**`;

      await this.sendMessageAndLog(from, fallbackMessage, messageId, phoneNumberId);
    }

    // Actualiza el estado de la sesión del usuario
    this.sessionManager.updateSessionState(from, SessionState.WAITING_FINAL_ACTION);
    this.logger.log(`Session state for ${from} updated to WAITING_FINAL_ACTION.`);
  }
} 