/**
 * @fileoverview Interfaces para análisis inteligente de mensajes
 * 
 * Define los contratos para servicios que analizan intenciones,
 * extraen información y obtienen perfiles de WhatsApp.
 * 
 * @author Sistema de Certificados Laborales
 * @version 1.0.0
 * @since 2024-12
 */

import { MessageAnalysis, WhatsAppProfile } from '../entities/message-intent.entity';

/**
 * Servicio para análisis de intenciones en mensajes
 */
export interface IMessageAnalysisService {
  /**
   * Analiza un mensaje para detectar la intención del usuario
   * 
   * @param message - Mensaje del usuario
   * @param context - Contexto adicional (estado de sesión, historial)
   * @returns Análisis completo del mensaje
   */
  analyzeMessage(message: string, context?: MessageContext): Promise<MessageAnalysis>;
  
  /**
   * Verifica si un mensaje contiene un saludo
   * 
   * @param message - Mensaje a verificar
   * @returns true si es un saludo
   */
  isGreeting(message: string): boolean;
  
  /**
   * Verifica si un mensaje solicita un certificado
   * 
   * @param message - Mensaje a verificar
   * @returns true si solicita certificado
   */
  isCertificateRequest(message: string): boolean;
  
  /**
   * Extrae información personal del mensaje (cédula, nombre)
   * 
   * @param message - Mensaje a analizar
   * @returns Información extraída
   */
  extractPersonalInfo(message: string): Promise<any>;
}

/**
 * Servicio para obtener información del perfil de WhatsApp
 */
export interface IWhatsAppProfileService {
  /**
   * Obtiene el perfil del usuario de WhatsApp
   * 
   * @param phoneNumber - Número de teléfono
   * @returns Información del perfil
   */
  getUserProfile(phoneNumber: string): Promise<WhatsAppProfile | null>;
  
  /**
   * Genera un saludo personalizado usando el perfil
   * 
   * @param profile - Perfil del usuario
   * @param timeOfDay - Momento del día para el saludo
   * @returns Mensaje de saludo personalizado
   */
  generatePersonalizedGreeting(profile: WhatsAppProfile, timeOfDay?: 'morning' | 'afternoon' | 'evening'): string;

  /**
   * Genera un mensaje de bienvenida completo
   * 
   * @param profile - Perfil del usuario
   * @returns Mensaje de bienvenida personalizado
   */
  generateWelcomeMessage(profile: WhatsAppProfile): string;

  /**
   * Genera respuestas dinámicas para solicitudes directas
   * 
   * @param profile - Perfil del usuario
   * @param extractedInfo - Información extraída del mensaje
   * @returns Mensaje de respuesta personalizado
   */
  generateQuickResponseMessage(profile: WhatsAppProfile, extractedInfo: any): string;
}

/**
 * Contexto adicional para análisis de mensajes
 */
export interface MessageContext {
  /** Estado actual de la sesión */
  sessionState?: string;
  
  /** Historial de mensajes recientes */
  messageHistory?: string[];
  
  /** Información ya conocida del usuario */
  knownUserInfo?: {
    name?: string;
    documentNumber?: string;
    documentType?: string;
  };
  
  /** Indica si es la primera interacción */
  isFirstInteraction?: boolean;
} 