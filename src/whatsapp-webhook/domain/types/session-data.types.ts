import { DocumentType, Session } from '../../domain'; // Asumiendo que Session y DocumentType están en domain

/**
 * @interface SessionWithAllData
 * @description Extiende la sesión base con todos los campos de datos potencialmente 
 *              utilizados durante el flujo de conversación para la generación de certificados.
 *
 * @property {string} [userId] - ID único del usuario en la base de datos.
 * @property {string} [clientName] - Nombre completo del cliente/empleado.
 * @property {string} [documentNumber] - Número del documento de identidad del empleado.
 * @property {DocumentType} [documentType] - Tipo de documento (cédula, pasaporte, etc.).
 * @property {string} [email] - Correo electrónico del empleado.
 * @property {string} [positionId] - ID del cargo o posición del empleado en la empresa.
 * @property {string | null} [salary] - Salario del empleado, puede ser nulo.
 * @property {string | null} [transportationAllowance] - Auxilio de transporte, puede ser nulo.
 * @property {string | null} [entryDate] - Fecha de ingreso del empleado a la empresa, puede ser nulo.
 * @property {string | null} [issuingPlace] - Lugar de expedición del documento de identidad.
 * @property {string} [selectedSalaryTypeKey] - Clave interna para el tipo de salario seleccionado en el menú (ej: 'con_sueldo').
 * @property {string} [selectedSalaryTypeDisplay] - Texto descriptivo del tipo de salario seleccionado (ej: 'Con Sueldo').
 * @property {string} [mfaSessionId] - (Opcional si se maneja en un tipo de sesión más específico para MFA) ID de la sesión MFA activa.
 */
export type SessionWithAllData = Session & { 
  userId?: string;
  clientName?: string;
  documentNumber?: string;
  documentType?: DocumentType;
  email?: string;
  positionId?: string;
  salary?: string | null;
  transportationAllowance?: string | null;
  entryDate?: string | null;
  issuingPlace?: string | null;
  selectedSalaryTypeKey?: string;
  selectedSalaryTypeDisplay?: string;
  mfaSessionId?: string; // Incluido para que ConversationService pueda usar este tipo también
}; 