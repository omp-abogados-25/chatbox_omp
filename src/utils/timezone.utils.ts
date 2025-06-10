/**
 * Utilidades para manejo de fechas con zona horaria de Colombia
 */

export const COLOMBIA_TIMEZONE = 'America/Bogota';

/**
 * Obtiene la fecha actual en zona horaria de Colombia
 */
export function getCurrentDateInColombia(): Date {
  return new Date();
}

/**
 * Formatea una fecha para Colombia en formato legible
 */
export function formatDateForColombia(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: COLOMBIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const formatOptions = { ...defaultOptions, ...options };
  return date.toLocaleString('es-CO', formatOptions);
}

/**
 * Formatea una fecha para Colombia solo con fecha (sin hora)
 */
export function formatDateOnlyForColombia(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    timeZone: COLOMBIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formatea una fecha para Colombia solo con hora (sin fecha)
 */
export function formatTimeOnlyForColombia(date: Date): string {
  return date.toLocaleTimeString('es-CO', {
    timeZone: COLOMBIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Obtiene la fecha/hora actual formateada para logs
 */
export function getCurrentTimestampForColombia(): string {
  return formatDateForColombia(new Date());
} 