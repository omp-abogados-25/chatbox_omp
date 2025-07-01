export interface CertificateRequestData {
  id: string;
  whatsapp_number: string;
  requester_name?: string;
  requester_document?: string;
  certificate_type: string;
  request_data?: any;
  interaction_messages?: any;
  status: CertificateRequestStatus;
  document_generated?: string;
  document_sent: boolean;
  is_completed: boolean;
  completion_reason?: string;
  error_message?: string;
  requester_user_id?: string;
  processed_by_user_id?: string;
  processing_started_at?: Date;
  processing_ended_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export enum CertificateRequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS', 
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  WAITING_INFO = 'WAITING_INFO'
}

export class CertificateRequest {
  constructor(private readonly data: CertificateRequestData) {}

  get id(): string {
    return this.data.id;
  }

  get whatsapp_number(): string {
    return this.data.whatsapp_number;
  }

  get requester_name(): string | undefined {
    return this.data.requester_name;
  }

  get requester_document(): string | undefined {
    return this.data.requester_document;
  }

  get certificate_type(): string {
    return this.data.certificate_type;
  }

  get request_data(): any {
    return this.data.request_data;
  }

  get interaction_messages(): any {
    return this.data.interaction_messages;
  }

  get status(): CertificateRequestStatus {
    return this.data.status;
  }

  get document_generated(): string | undefined {
    return this.data.document_generated;
  }

  get document_sent(): boolean {
    return this.data.document_sent;
  }

  get is_completed(): boolean {
    return this.data.is_completed;
  }

  get completion_reason(): string | undefined {
    return this.data.completion_reason;
  }

  get error_message(): string | undefined {
    return this.data.error_message;
  }

  get requester_user_id(): string | undefined {
    return this.data.requester_user_id;
  }

  get processed_by_user_id(): string | undefined {
    return this.data.processed_by_user_id;
  }

  get processing_started_at(): Date | undefined {
    return this.data.processing_started_at;
  }

  get processing_ended_at(): Date | undefined {
    return this.data.processing_ended_at;
  }

  get created_at(): Date {
    return this.data.created_at;
  }

  get updated_at(): Date {
    return this.data.updated_at;
  }

  // Métodos de negocio
  public startProcessing(userId?: string): void {
    this.data.status = CertificateRequestStatus.IN_PROGRESS;
    this.data.processed_by_user_id = userId;
    this.data.processing_started_at = new Date();
  }

  public complete(documentPath?: string, reason?: string): void {
    this.data.status = CertificateRequestStatus.COMPLETED;
    this.data.is_completed = true;
    this.data.document_generated = documentPath;
    this.data.completion_reason = reason || 'Procesado exitosamente';
    this.data.processing_ended_at = new Date();
  }

  public fail(errorMessage: string): void {
    this.data.status = CertificateRequestStatus.FAILED;
    this.data.is_completed = true;
    this.data.error_message = errorMessage;
    this.data.completion_reason = 'Error en el procesamiento';
    this.data.processing_ended_at = new Date();
  }

  public cancel(reason?: string): void {
    this.data.status = CertificateRequestStatus.CANCELLED;
    this.data.is_completed = true;
    this.data.completion_reason = reason || 'Cancelado por el usuario';
    this.data.processing_ended_at = new Date();
  }

  public markDocumentSent(): void {
    this.data.document_sent = true;
  }

  public waitForInfo(): void {
    this.data.status = CertificateRequestStatus.WAITING_INFO;
  }

  public updateInteractionMessages(messages: any): void {
    this.data.interaction_messages = messages;
  }

  public updateRequestData(data: any): void {
    this.data.request_data = { ...this.data.request_data, ...data };
  }

  public assignRequesterUser(userId: string): void {
    this.data.requester_user_id = userId;
  }

  // Métodos de validación
  public canBeProcessed(): boolean {
    return this.data.status === CertificateRequestStatus.PENDING || 
           this.data.status === CertificateRequestStatus.WAITING_INFO;
  }

  public isInProgress(): boolean {
    return this.data.status === CertificateRequestStatus.IN_PROGRESS;
  }

  public isCompleted(): boolean {
    return this.data.is_completed;
  }

  public hasDocument(): boolean {
    return !!this.data.document_generated;
  }

  public isDocumentSent(): boolean {
    return this.data.document_sent;
  }

  // Serialización
  public toData(): CertificateRequestData {
    return { ...this.data };
  }

  public static fromData(data: CertificateRequestData): CertificateRequest {
    return new CertificateRequest(data);
  }
} 