/**
 * @fileoverview Servicio de análisis inteligente de mensajes
 * 
 * Implementa detección de intenciones y extracción de información
 * usando patrones de texto y expresiones regulares avanzadas.
 * 
 * @author Sistema de Certificados Laborales
 * @version 1.0.0
 * @since 2024-12
 */

import { Injectable, Logger } from '@nestjs/common';
import { IMessageAnalysisService, MessageContext } from '../../domain/interfaces/message-analysis.interface';
import { 
  MessageAnalysis, 
  MessageIntent, 
  ExtractedInfo, 
  CertificateType 
} from '../../domain/entities/message-intent.entity';
import { DocumentType } from '../../domain';

@Injectable()
export class MessageAnalysisService implements IMessageAnalysisService {
  private readonly logger = new Logger(MessageAnalysisService.name);

  // Patrones para detectar saludos
  private readonly GREETING_PATTERNS = [
    /\b(hola|hello|hi|hey|buenas|buen|que tal|como estas?|saludos)\b/i,
    /\b(buenos días|buenas tardes|buenas noches)\b/i,
    /^(hola|hi|hey|buenas)$/i,
  ];

  // Patrones para detectar solicitudes de certificados
  private readonly CERTIFICATE_PATTERNS = [
    /\b(certificad[oa]|certificacion)\b.*\b(laboral|trabajo|empleo)\b/i,
    /\b(solicitar|solicitud|necesito|quiero|requiero)\b.*\b(certificad[oa])\b/i,
    /\b(carta|constancia)\b.*\b(laboral|trabajo|empleo)\b/i,
    /\b(con sueldo|sin sueldo|con salario|sin salario)\b/i,
    /\b(certificado laboral|certificacion laboral)\b/i,
  ];

  // Patrones para detectar despedidas
  private readonly GOODBYE_PATTERNS = [
    /\b(adios|chao|bye|hasta luego|nos vemos|gracias|finalizar)\b/i,
    /\b(terminar|cerrar|salir|ya no necesito)\b/i,
    /\b(no necesito|no quiero|cancelar|cancel)\b/i,
    /\b(ya no|basta|suficiente|listo)\b/i,
    /^(adios|chao|bye|gracias)$/i,
  ];

  // Patrones para extraer números de documento
  private readonly DOCUMENT_PATTERNS = [
    /\b(cedula|cc|ci|documento|identificacion)[:\s]*(\d{6,12})\b/i,
    /\b(mi cedula es|mi cc es|mi documento es)[:\s]*(\d{6,12})\b/i,
    /\b(cedula|cc|ci|documento)[:\s]*(\d{6,12})\b/i,
    /\b(\d{8,12})\b/g, // Números de 8-12 dígitos (más específico)
  ];

  // Patrones para extraer nombres
  private readonly NAME_PATTERNS = [
    /\b(mi nombre es|me llamo|soy)[:\s]+([a-záéíóúñ\s]{2,50})\b/i,
    /\b(nombre)[:\s]+([a-záéíóúñ\s]{2,50})\b/i,
    /\by\s+(me\s+llamo|soy)\s+([a-záéíóúñ\s]{2,50})\b/i,
  ];

  // Patrones para tipos de documento
  private readonly DOCUMENT_TYPE_PATTERNS = [
    { pattern: /\b(cedula|cc)\b/i, type: DocumentType.CC },
    { pattern: /\b(tarjeta de identidad|ti)\b/i, type: DocumentType.TI },
    { pattern: /\b(cedula de extranjeria|ce)\b/i, type: DocumentType.CE },
    { pattern: /\b(pasaporte|pp)\b/i, type: DocumentType.PP },
  ];

  // Patrones para tipos de certificado
  private readonly CERTIFICATE_TYPE_PATTERNS = [
    { pattern: /\b(con sueldo|con salario|incluir sueldo|incluir salario)\b/i, type: CertificateType.WITH_SALARY },
    { pattern: /\b(sin sueldo|sin salario|sin incluir sueldo|sin incluir salario)\b/i, type: CertificateType.WITHOUT_SALARY },
  ];

  async analyzeMessage(message: string, context?: MessageContext): Promise<MessageAnalysis> {
    const cleanMessage = message.trim().toLowerCase();
    
    // Detectar intención principal
    const intent = this.detectIntent(cleanMessage, context);
    
    // Extraer información si corresponde
    const extractedInfo = await this.extractAllInfo(message);
    
    // Calcular confianza general
    const confidence = this.calculateConfidence(intent, extractedInfo, cleanMessage);
    
    const analysis: MessageAnalysis = {
      intent,
      extractedInfo,
      confidence,
      originalMessage: message,
      reason: this.getDetectionReason(intent, extractedInfo, cleanMessage)
    };
    
    return analysis;
  }

  isGreeting(message: string): boolean {
    const cleanMessage = message.trim().toLowerCase();
    return this.GREETING_PATTERNS.some(pattern => pattern.test(cleanMessage));
  }

  isCertificateRequest(message: string): boolean {
    const cleanMessage = message.trim().toLowerCase();
    return this.CERTIFICATE_PATTERNS.some(pattern => pattern.test(cleanMessage));
  }

  async extractPersonalInfo(message: string): Promise<ExtractedInfo> {
    return this.extractAllInfo(message);
  }

  private detectIntent(message: string, context?: MessageContext): MessageIntent {
    // Verificar si es navegación de menú (respuestas de botones)
    if (this.isMenuNavigation(message)) {
      return MessageIntent.MENU_NAVIGATION;
    }

    // Verificar saludos
    if (this.isGreeting(message)) {
      return MessageIntent.GREETING;
    }

    // Verificar despedidas
    if (this.GOODBYE_PATTERNS.some(pattern => pattern.test(message))) {
      return MessageIntent.GOODBYE;
    }

    // Verificar solicitudes de certificado
    if (this.isCertificateRequest(message)) {
      return MessageIntent.REQUEST_CERTIFICATE;
    }

    // Verificar si proporciona información personal
    if (this.hasPersonalInfo(message)) {
      return MessageIntent.PROVIDE_PERSONAL_INFO;
    }

    // Verificar preguntas
    if (this.isQuestion(message)) {
      return MessageIntent.QUESTION;
    }

    return MessageIntent.UNKNOWN;
  }

  private async extractAllInfo(message: string): Promise<ExtractedInfo> {
    const extractedInfo: ExtractedInfo = {
      confidence: 0,
      matchedPhrases: []
    };

    // Extraer número de documento
    const documentNumber = this.extractDocumentNumber(message);
    if (documentNumber) {
      extractedInfo.documentNumber = documentNumber;
      extractedInfo.matchedPhrases.push(`documento: ${documentNumber}`);
    }

    // Extraer tipo de documento
    const documentType = this.extractDocumentType(message);
    if (documentType) {
      extractedInfo.documentType = documentType;
      extractedInfo.matchedPhrases.push(`tipo: ${documentType}`);
    }

    // Extraer nombre
    const name = this.extractName(message);
    if (name) {
      extractedInfo.name = name;
      extractedInfo.matchedPhrases.push(`nombre: ${name}`);
    }

    // Extraer tipo de certificado
    const certificateType = this.extractCertificateType(message);
    if (certificateType) {
      extractedInfo.certificateType = certificateType;
      extractedInfo.matchedPhrases.push(`certificado: ${certificateType}`);
    }

    // Calcular confianza de la extracción
    extractedInfo.confidence = this.calculateExtractionConfidence(extractedInfo);

    return extractedInfo;
  }

  private extractDocumentNumber(message: string): string | undefined {
    // Primero intentar patrones específicos con palabras clave
    const specificPatterns = [
      /\b(cedula|cc|ci|documento|identificacion)[:\s]*(\d{6,12})\b/i,
      /\b(mi cedula es|mi cc es|mi documento es)[:\s]*(\d{6,12})\b/i,
      /\b(cedula|cc|ci|documento)[:\s]*(\d{6,12})\b/i,
      /\b(numero|num)[:\s]*(\d{6,12})\b/i,
    ];
    
    for (const pattern of specificPatterns) {
      const match = RegExp(pattern).exec(message);
      if (match && match[2]) {
        return match[2];
      }
    }
    
    // Si no encuentra con palabras clave, buscar números de 8-12 dígitos
    // pero solo si el mensaje parece ser sobre documentos
    const hasDocumentContext = /\b(cedula|cc|documento|identificacion|numero|soy|mi)\b/i.test(message);
    if (hasDocumentContext) {
      const numberMatch = RegExp(/\b(\d{8,12})\b/).exec(message);
      if (numberMatch) {
        return numberMatch[1];
      }
    }
    
    return undefined;
  }

  private extractDocumentType(message: string): string | undefined {
    for (const { pattern, type } of this.DOCUMENT_TYPE_PATTERNS) {
      if (pattern.test(message)) {
        return type;
      }
    }
    return undefined;
  }

  private extractName(message: string): string | undefined {
    for (const pattern of this.NAME_PATTERNS) {
      const match = pattern.exec(message);
      if (match && match[2]) {
        return match[2].trim();
      }
    }
    return undefined;
  }

  private extractCertificateType(message: string): CertificateType | undefined {
    for (const { pattern, type } of this.CERTIFICATE_TYPE_PATTERNS) {
      if (pattern.test(message)) {
        return type;
      }
    }
    
    // Si menciona certificado pero no especifica tipo
    if (this.isCertificateRequest(message)) {
      return CertificateType.GENERAL;
    }
    
    return undefined;
  }

  private isMenuNavigation(message: string): boolean {
    const menuResponses = [
      'doc_cc', 'doc_ti', 'doc_ce', 'doc_pp',
      'cert_con_sueldo', 'cert_sin_sueldo', 'cert_finalizar'
    ];
    return menuResponses.includes(message.trim());
  }

  private hasPersonalInfo(message: string): boolean {
    return !!(
      this.extractDocumentNumber(message) ||
      this.extractName(message) ||
      this.extractDocumentType(message)
    );
  }

  private isQuestion(message: string): boolean {
    const questionWords = ['que', 'como', 'cuando', 'donde', 'por que', 'cual', 'quien'];
    const hasQuestionMark = message.includes('?');
    const hasQuestionWord = questionWords.some(word => 
      message.toLowerCase().includes(word)
    );
    
    return hasQuestionMark || hasQuestionWord;
  }

  private calculateConfidence(
    intent: MessageIntent, 
    extractedInfo?: ExtractedInfo, 
    message?: string
  ): number {
    let confidence = 0.5; // Base confidence

    switch (intent) {
      case MessageIntent.MENU_NAVIGATION:
        confidence = 1.0; // Máxima confianza para respuestas de menú
        break;
      case MessageIntent.GREETING:
        confidence = this.isGreeting(message || '') ? 0.9 : 0.5;
        break;
      case MessageIntent.REQUEST_CERTIFICATE:
        confidence = this.isCertificateRequest(message || '') ? 0.85 : 0.5;
        break;
      case MessageIntent.PROVIDE_PERSONAL_INFO:
        confidence = extractedInfo ? extractedInfo.confidence : 0.3;
        break;
      case MessageIntent.GOODBYE:
        confidence = 0.8;
        break;
      default:
        confidence = 0.3;
    }

    return Math.min(confidence, 1.0);
  }

  private calculateExtractionConfidence(extractedInfo: ExtractedInfo): number {
    let confidence = 0;
    let factors = 0;

    if (extractedInfo.documentNumber) {
      confidence += 0.4;
      factors++;
    }

    if (extractedInfo.documentType) {
      confidence += 0.3;
      factors++;
    }

    if (extractedInfo.name) {
      confidence += 0.2;
      factors++;
    }

    if (extractedInfo.certificateType) {
      confidence += 0.1;
      factors++;
    }

    return factors > 0 ? confidence : 0;
  }

  private getDetectionReason(
    intent: MessageIntent, 
    extractedInfo?: ExtractedInfo, 
    message?: string
  ): string {
    switch (intent) {
      case MessageIntent.GREETING:
        return 'Detected greeting patterns';
      case MessageIntent.REQUEST_CERTIFICATE:
        return 'Detected certificate request keywords';
      case MessageIntent.PROVIDE_PERSONAL_INFO:
        return `Extracted: ${extractedInfo?.matchedPhrases?.join(', ') || 'personal info'}`;
      case MessageIntent.MENU_NAVIGATION:
        return 'Menu button response detected';
      case MessageIntent.GOODBYE:
        return 'Detected farewell patterns';
      case MessageIntent.QUESTION:
        return 'Question pattern detected';
      default:
        return 'No clear intent detected';
    }
  }
} 