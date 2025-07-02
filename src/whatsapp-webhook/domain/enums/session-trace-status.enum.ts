export enum SessionTraceStatus {
  INICIADA = 'INICIADA',           // Cuando se pide el número de documento
  EN_PROGRESO = 'EN_PROGRESO',     // Cuando se envía el OTP
  AUTENTICADA = 'AUTENTICADA',     // Cuando se completa la autenticación MFA
  PROCESANDO_CERTIFICADO = 'PROCESANDO_CERTIFICADO', // Cuando genera un certificado
  FINALIZADA = 'FINALIZADA',       // Cuando se cierra la sesión (finalizar o timeout)
  EXPIRADA = 'EXPIRADA'           // Cuando expira por inactividad
} 