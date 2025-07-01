import { CertificateRequest, CertificateRequestStatus } from '../entities/certificate-request.entity';

export interface CertificateRequestFilters {
  whatsapp_number?: string;
  certificate_type?: string;
  status?: CertificateRequestStatus;
  requester_user_id?: string;
  processed_by_user_id?: string;
  is_completed?: boolean;
  document_sent?: boolean;
  date_from?: Date;
  date_to?: Date;
  search?: string; // Para búsqueda general por nombre, documento, etc.
}

export interface CertificateRequestPagination {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedCertificateRequests {
  data: CertificateRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CertificateRequestRepository {
  /**
   * Crear una nueva solicitud de certificado
   */
  create(
    whatsapp_number: string,
    certificate_type: string,
    requester_name?: string,
    requester_document?: string,
    request_data?: any,
    interaction_messages?: any
  ): Promise<CertificateRequest>;

  /**
   * Encontrar una solicitud por ID
   */
  findById(id: string): Promise<CertificateRequest | null>;

  /**
   * Encontrar solicitudes por número de WhatsApp
   */
  findByWhatsAppNumber(whatsapp_number: string): Promise<CertificateRequest[]>;

  /**
   * Encontrar todas las solicitudes con filtros y paginación
   */
  findAll(
    filters?: CertificateRequestFilters,
    pagination?: CertificateRequestPagination
  ): Promise<PaginatedCertificateRequests>;

  /**
   * Actualizar una solicitud existente
   */
  update(id: string, updates: Partial<CertificateRequest>): Promise<CertificateRequest>;

  /**
   * Actualizar el estado de una solicitud
   */
  updateStatus(id: string, status: CertificateRequestStatus, userId?: string): Promise<CertificateRequest>;

  /**
   * Marcar una solicitud como completada
   */
  markAsCompleted(
    id: string, 
    documentPath?: string, 
    completionReason?: string
  ): Promise<CertificateRequest>;

  /**
   * Marcar una solicitud como fallida
   */
  markAsFailed(id: string, errorMessage: string): Promise<CertificateRequest>;

  /**
   * Marcar documento como enviado
   */
  markDocumentAsSent(id: string): Promise<CertificateRequest>;

  /**
   * Actualizar los mensajes de interacción
   */
  updateInteractionMessages(id: string, messages: any): Promise<CertificateRequest>;

  /**
   * Actualizar los datos de la solicitud
   */
  updateRequestData(id: string, data: any): Promise<CertificateRequest>;

  /**
   * Eliminar una solicitud (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Obtener estadísticas de solicitudes
   */
  getStatistics(dateFrom?: Date, dateTo?: Date): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
    waiting_info: number;
    documents_generated: number;
    documents_sent: number;
  }>;

  /**
   * Obtener solicitudes pendientes de procesamiento
   */
  findPendingRequests(limit?: number): Promise<CertificateRequest[]>;

  /**
   * Obtener solicitudes por tipo de certificado
   */
  findByCertificateType(certificateType: string): Promise<CertificateRequest[]>;

  /**
   * Buscar solicitudes por texto (nombre, documento, tipo, etc.)
   */
  search(searchTerm: string, pagination?: CertificateRequestPagination): Promise<PaginatedCertificateRequests>;

  /**
   * Asignar usuario solicitante a una solicitud
   */
  assignRequesterUser(id: string, userId: string): Promise<CertificateRequest>;

  /**
   * Asignar usuario solicitante a todas las solicitudes de un número de WhatsApp
   */
  assignRequesterUserByWhatsApp(whatsappNumber: string, userId: string): Promise<CertificateRequest[]>;

  /**
   * Buscar usuario por documento de identidad
   */
  findUserByIdentificationNumber(identificationNumber: string): Promise<any>;

  /**
   * Obtener solicitudes de un usuario específico
   */
  findByRequesterUserId(userId: string): Promise<CertificateRequest[]>;
} 