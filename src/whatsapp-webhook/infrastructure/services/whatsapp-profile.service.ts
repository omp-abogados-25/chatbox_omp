/**
 * @fileoverview Servicio para obtener perfiles de WhatsApp y generar saludos personalizados
 * 
 * Utiliza la API de WhatsApp Business para obtener información del perfil
 * del usuario y genera saludos dinámicos basados en la hora del día.
 * 
 * @author Sistema de Certificados Laborales
 * @version 1.0.0
 * @since 2024-12
 */

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IWhatsAppProfileService } from '../../domain/interfaces/message-analysis.interface';
import { WhatsAppProfile } from '../../domain/entities/message-intent.entity';

@Injectable()
export class WhatsAppProfileService implements IWhatsAppProfileService {
  private readonly logger = new Logger(WhatsAppProfileService.name);
  private readonly token = process.env.GRAPH_API_TOKEN;
  private readonly apiVersion = process.env.API_VERSION;

  // Cache para perfiles (evitar múltiples llamadas a la API)
  private readonly profileCache = new Map<string, { profile: WhatsAppProfile | null; timestamp: number }>();
  private readonly CACHE_TTL = 300000; // 5 minutos

  async getUserProfile(phoneNumber: string): Promise<WhatsAppProfile | null> {
    try {
      // Verificar cache primero
      const cached = this.profileCache.get(phoneNumber);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.profile;
      }

      // Crear perfil básico inmediatamente como fallback
      const fallbackProfile: WhatsAppProfile = {
        name: this.generateFriendlyName(phoneNumber),
        phoneNumber: phoneNumber,
      };

      // Intentar obtener perfil de WhatsApp Business API (opcional)
      try {
        const cleanPhoneNumber = phoneNumber.replace(/[\s+\-()]/g, '');
        
        // Verificar que tenemos las variables de entorno necesarias
        if (!this.token || !this.apiVersion) {
          this.logger.warn('WhatsApp API credentials not configured, using fallback profile');
          this.profileCache.set(phoneNumber, { 
            profile: fallbackProfile, 
            timestamp: Date.now() 
          });
          return fallbackProfile;
        }
        
        // Intentar obtener perfil de WhatsApp Business API
        const url = `https://graph.facebook.com/${this.apiVersion}/${cleanPhoneNumber}`;
        
        const response = await axios.get(url, {
          headers: { 
            Authorization: `Bearer ${this.token}` 
          },
          params: {
            fields: 'name,profile_pic'
          },
          timeout: 3000 // Reducir timeout a 3 segundos
        });

        const profileData = response.data;
        const profile: WhatsAppProfile = {
          name: profileData.name ?? fallbackProfile.name,
          profilePicUrl: profileData.profile_pic,
          phoneNumber: phoneNumber,
        };

        // Guardar en cache
        this.profileCache.set(phoneNumber, { 
          profile, 
          timestamp: Date.now() 
        });
        return profile;

      } catch (apiError) {
        
        // Guardar fallback en cache
        this.profileCache.set(phoneNumber, { 
          profile: fallbackProfile, 
          timestamp: Date.now() 
        });

        return fallbackProfile;
      }

    } catch (error) {
      // Error general - crear perfil mínimo
      
      const emergencyProfile: WhatsAppProfile = {
        name: 'Usuario',
        phoneNumber: phoneNumber,
      };

      return emergencyProfile;
    }
  }

  generatePersonalizedGreeting(
    profile: WhatsAppProfile, 
    timeOfDay?: 'morning' | 'afternoon' | 'evening'
  ): string {
    const currentTime = timeOfDay || this.getCurrentTimeOfDay();
    const userName = profile.name || 'amigo';
    
    const greetings = {
      morning: [
        `¡Buenos días, ${userName}! ☀️`,
        `¡Hola ${userName}! Que tengas un excelente día 🌅`,
        `Buenos días, ${userName} 🌞 ¿En qué puedo ayudarte hoy?`,
      ],
      afternoon: [
        `¡Buenas tardes, ${userName}! 🌤️`,
        `¡Hola ${userName}! Espero que tengas una tarde productiva ☀️`,
        `Buenas tardes, ${userName} 🌻 ¿Cómo está tu día?`,
      ],
      evening: [
        `¡Buenas noches, ${userName}! 🌙`,
        `¡Hola ${userName}! Que tengas una excelente noche ✨`,
        `Buenas noches, ${userName} 🌃 ¿En qué puedo asistirte?`,
      ]
    };

    const timeGreetings = greetings[currentTime];
    const randomGreeting = timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
    
    return this.buildFullGreeting(randomGreeting, userName);
  }

  /**
   * Genera un saludo de bienvenida completo
   */
  generateWelcomeMessage(profile: WhatsAppProfile): string {
    return `¡Hola! 👋 Bienvenido al sistema de **Certificados Laborales**.

Soy tu asistente virtual y estoy aquí para ayudarte a obtener tu certificado de manera rápida y segura.

🔐 **¿Sabías que?** 
• Puedes escribir directamente: *"Necesito un certificado laboral"*
• O también: *"Mi cédula es 12345678"*
• ¡El sistema es inteligente y te entenderá!

📝 Para comenzar, ingresa tu número de documento:`;
  }

  /**
   * Genera respuestas dinámicas para solicitudes directas
   */
  generateQuickResponseMessage(profile: WhatsAppProfile, extractedInfo: any): string {
    const userName = profile.name || 'amigo';
    let message = `¡Perfecto, ${userName}! 🎯 Entiendo que necesitas un certificado laboral.\n\n`;

    if (extractedInfo?.documentNumber && extractedInfo?.name) {
      message += `✅ **Información detectada:**\n`;
      message += `• Nombre: ${extractedInfo.name}\n`;
      message += `• Documento: ${extractedInfo.documentNumber}\n\n`;
      message += `🔍 Permíteme verificar tu información...`;
    } else if (extractedInfo?.documentNumber) {
      message += `✅ **Documento detectado:** ${extractedInfo.documentNumber}\n\n`;
      message += `🔍 Verificando información...`;
    } else {
      message += `📋 Para continuar, necesito verificar tu identidad.\n\n`;
      message += `Por favor, selecciona tu tipo de documento:`;
    }

    return message;
  }

  private getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 18) {
      return 'afternoon';
    } else {
      return 'evening';
    }
  }

  private generateFriendlyName(phoneNumber: string): string {
    // Crear un nombre genérico amigable basado en el número
    const lastDigits = phoneNumber.slice(-4);
    const friendlyNames = [
      'Amigo',
      'Usuario',
      'Cliente',
      'Visitante'
    ];
    
    // Usar el último dígito para seleccionar un nombre base
    const nameIndex = parseInt(lastDigits.slice(-1)) % friendlyNames.length;
    const baseName = friendlyNames[nameIndex];
    
    return `${baseName} ${lastDigits}`;
  }

  private buildFullGreeting(baseGreeting: string, userName: string): string {
    const encouragements = [
      'Estoy aquí para ayudarte',
      'Es un placer atenderte',
      'Será un gusto asistirte',
      'Me da mucho gusto saludarte'
    ];

    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    
    return `${baseGreeting} ${randomEncouragement} 😊`;
  }

  /**
   * Limpia el cache de perfiles (útil para testing o mantenimiento)
   */
  clearProfileCache(): void {
    this.profileCache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.profileCache.size,
      entries: Array.from(this.profileCache.keys())
    };
  }
} 