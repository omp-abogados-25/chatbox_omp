/**
 * @fileoverview Configuración centralizada del sistema MFA y Rate Limiting
 * 
 * Este archivo contiene todas las constantes y configuraciones del sistema:
 * - Parámetros de seguridad TOTP
 * - Configuración de rate limiting
 * - Tiempos de expiración y TTL
 * - Límites de intentos y bloqueos
 * 
 * @author Sistema de Certificados Laborales
 * @version 1.0.0
 * @since 2024-12
 */

/**
 * Configuración del sistema TOTP (Time-based One-Time Password)
 */
export const TOTP_CONFIG = {
  /** Longitud del secreto TOTP en caracteres */
  SECRET_LENGTH: 32,
  
  /** Número de dígitos del código TOTP */
  DIGITS: 6,
  
  /** Duración de cada step en segundos (5 minutos) */
  STEP_DURATION: 300,
  
  /** Ventana de tolerancia para sincronización (±1 step) */
  WINDOW_TOLERANCE: 1,
  
  /** Nombre del emisor para aplicaciones TOTP */
  ISSUER: 'Sistema Certificados Laborales',
  
  /** Nombre del servicio */
  SERVICE_NAME: 'WhatsApp Certificados',
} as const;

/**
 * Configuración de sesiones MFA
 */
export const MFA_SESSION_CONFIG = {
  /** TTL de sesión MFA en segundos (10 minutos) */
  TTL_SECONDS: 600,
  
  /** Máximo número de intentos por sesión */
  MAX_ATTEMPTS: 3,
  
  /** Tiempo de gracia adicional en segundos */
  GRACE_PERIOD: 30,
} as const;

/**
 * Configuración de rate limiting
 */
export const RATE_LIMIT_CONFIG = {
  /** Ventana de tiempo para contar solicitudes en segundos (10 minutos) */
  WINDOW_SECONDS: 600,
  
  /** Máximo número de solicitudes MFA por ventana */
  MAX_REQUESTS_PER_WINDOW: 3,
  
  /** Duración del bloqueo temporal en segundos (30 minutos) */
  TEMPORARY_BLOCK_DURATION: 1800,
  
  /** Número máximo de bloqueos temporales antes del permanente */
  MAX_TEMPORARY_BLOCKS: 3,
  
  /** Duración del bloqueo permanente en segundos (24 horas) */
  PERMANENT_BLOCK_DURATION: 86400,
} as const;

/**
 * Configuración de cache en memoria
 */
export const MEMORY_CACHE_CONFIG = {
  /** Intervalo de limpieza automática en milisegundos (30 segundos) */
  CLEANUP_INTERVAL_MS: 30000,
  
  /** Prefijo para claves de cache */
  KEY_PREFIX: 'whatsapp_mfa',
  
  /** TTL por defecto en segundos */
  DEFAULT_TTL: 3600,
} as const;

/**
 * Configuración de emails MFA
 */
export const EMAIL_CONFIG = {
  /** Tiempo de expiración mostrado en email (minutos) */
  EXPIRY_DISPLAY_MINUTES: 10,
  
  /** Asunto del email MFA */
  SUBJECT: '🔐 Código de Verificación - Certificados Laborales',
  
  /** Remitente por defecto */
  DEFAULT_FROM: 'sistema@certificados.com',
  
  /** Timeout para envío de email en milisegundos */
  SEND_TIMEOUT_MS: 10000,
} as const;

/**
 * Configuración de logging
 */
export const LOGGING_CONFIG = {
  /** Nivel de log para eventos MFA */
  MFA_LOG_LEVEL: 'info',
  
  /** Nivel de log para eventos de rate limiting */
  RATE_LIMIT_LOG_LEVEL: 'warn',
  
  /** Incluir datos sensibles en logs (solo desarrollo) */
  INCLUDE_SENSITIVE_DATA: process.env.NODE_ENV === 'development',
} as const;

/**
 * Mensajes de error estandarizados
 */
export const ERROR_MESSAGES = {
  MFA: {
    SESSION_NOT_FOUND: 'Sesión MFA no encontrada o expirada',
    INVALID_CODE: 'Código TOTP inválido',
    MAX_ATTEMPTS_REACHED: 'Máximo número de intentos alcanzado',
    SESSION_EXPIRED: 'La sesión MFA ha expirado',
    CREATION_FAILED: 'Error al crear sesión MFA',
  },
  RATE_LIMIT: {
    BLOCKED_TEMPORARY: 'Número bloqueado temporalmente',
    BLOCKED_PERMANENT: 'Número bloqueado permanentemente',
    TOO_MANY_REQUESTS: 'Demasiadas solicitudes de códigos MFA',
    CLEANUP_FAILED: 'Error en limpieza de rate limits',
  },
  EMAIL: {
    SEND_FAILED: 'Error al enviar email de verificación',
    INVALID_ADDRESS: 'Dirección de email inválida',
    TEMPLATE_ERROR: 'Error en plantilla de email',
  },
} as const;

/**
 * Configuración de desarrollo vs producción
 */
export const ENVIRONMENT_CONFIG = {
  development: {
    RATE_LIMIT_WINDOW: RATE_LIMIT_CONFIG.WINDOW_SECONDS,
    MAX_REQUESTS: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW,
    BLOCK_DURATION: 300, // 5 minutos en desarrollo
    ENABLE_DETAILED_LOGS: true,
  },
  production: {
    RATE_LIMIT_WINDOW: RATE_LIMIT_CONFIG.WINDOW_SECONDS,
    MAX_REQUESTS: 2, // Más estricto en producción
    BLOCK_DURATION: RATE_LIMIT_CONFIG.TEMPORARY_BLOCK_DURATION,
    ENABLE_DETAILED_LOGS: false,
  },
} as const;

/**
 * Obtiene la configuración según el entorno actual
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  return ENVIRONMENT_CONFIG[env as keyof typeof ENVIRONMENT_CONFIG] || ENVIRONMENT_CONFIG.development;
}

/**
 * Validación de configuración
 */
export function validateConfig(): boolean {
  const requiredEnvVars = [
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS',
    'EMAIL_FROM',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars);
    return false;
  }

  return true;
}

/**
 * Configuración completa exportada
 */
export const MFA_SYSTEM_CONFIG = {
  TOTP: TOTP_CONFIG,
  SESSION: MFA_SESSION_CONFIG,
  RATE_LIMIT: RATE_LIMIT_CONFIG,
  CACHE: MEMORY_CACHE_CONFIG,
  EMAIL: EMAIL_CONFIG,
  LOGGING: LOGGING_CONFIG,
  ERRORS: ERROR_MESSAGES,
  ENVIRONMENT: getEnvironmentConfig(),
} as const; 