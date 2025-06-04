/**
 * @fileoverview Entidades para detección de intenciones en mensajes
 * 
 * Define los tipos de intenciones que puede detectar el sistema y
 * la información extraída de mensajes del usuario.
 * 
 * @author Sistema de Certificados Laborales
 * @version 1.0.0
 * @since 2024-12
 */

/**
 * Tipos de intenciones que puede detectar el sistema
 */
export enum MessageIntent {
  /** Usuario está saludando */
  GREETING = 'greeting',
  
  /** Usuario solicita certificado laboral directamente */
  REQUEST_CERTIFICATE = 'request_certificate',
  
  /** Usuario proporciona información personal (cédula, nombre) */
  PROVIDE_PERSONAL_INFO = 'provide_personal_info',
  
  /** Usuario quiere finalizar conversación */
  GOODBYE = 'goodbye',
  
  /** Usuario hace una pregunta general */
  QUESTION = 'question',
  
  /** Usuario navega por menús (respuestas de botones) */
  MENU_NAVIGATION = 'menu_navigation',
  
  /** Intención no clara o desconocida */
  UNKNOWN = 'unknown'
}

/**
 * Tipos de certificados que puede solicitar
 */
export enum CertificateType {
  WITH_SALARY = 'con_sueldo',
  WITHOUT_SALARY = 'sin_sueldo',
  GENERAL = 'general'
}

/**
 * Información extraída de un mensaje
 */
export interface ExtractedInfo {
  /** Número de cédula detectado */
  documentNumber?: string;
  
  /** Tipo de documento detectado */
  documentType?: string;
  
  /** Nombre de la persona detectado */
  name?: string;
  
  /** Tipo de certificado solicitado */
  certificateType?: CertificateType;
  
  /** Nivel de confianza de la extracción (0-1) */
  confidence: number;
  
  /** Fragmentos del mensaje que coincidieron */
  matchedPhrases: string[];
}

/**
 * Resultado del análisis de intención de un mensaje
 */
export interface MessageAnalysis {
  /** Intención detectada */
  intent: MessageIntent;
  
  /** Información extraída del mensaje */
  extractedInfo?: ExtractedInfo;
  
  /** Nivel de confianza de la detección (0-1) */
  confidence: number;
  
  /** Mensaje original analizado */
  originalMessage: string;
  
  /** Razón de la detección (para debugging) */
  reason: string;
}

/**
 * Información del perfil de usuario de WhatsApp
 */
export interface WhatsAppProfile {
  /** Nombre del usuario en WhatsApp */
  name?: string;
  
  /** Estado del usuario */
  status?: string;
  
  /** URL de la foto de perfil */
  profilePicUrl?: string;
  
  /** Número de teléfono */
  phoneNumber: string;
} 