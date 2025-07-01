import { SessionTraceStatus } from '../enums/session-trace-status.enum';

export interface SessionTraceData {
  id: string;
  phone_number: string;
  session_id: string;
  status: SessionTraceStatus;
  document_number?: string;
  user_id?: string;
  certificate_request_id?: string;
  step_description: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export class SessionTrace {
  constructor(private readonly data: SessionTraceData) {}

  get id(): string {
    return this.data.id;
  }

  get phoneNumber(): string {
    return this.data.phone_number;
  }

  get sessionId(): string {
    return this.data.session_id;
  }

  get status(): SessionTraceStatus {
    return this.data.status;
  }

  get documentNumber(): string | undefined {
    return this.data.document_number;
  }

  get userId(): string | undefined {
    return this.data.user_id;
  }

  get certificateRequestId(): string | undefined {
    return this.data.certificate_request_id;
  }

  get stepDescription(): string {
    return this.data.step_description;
  }

  get metadata(): any {
    return this.data.metadata;
  }

  get createdAt(): Date {
    return this.data.created_at;
  }

  get updatedAt(): Date {
    return this.data.updated_at;
  }

  // Métodos de negocio
  public updateStatus(status: SessionTraceStatus, description?: string): void {
    this.data.status = status;
    if (description) {
      this.data.step_description = description;
    }
    this.data.updated_at = new Date();
  }

  public assignUser(userId: string): void {
    this.data.user_id = userId;
    this.data.updated_at = new Date();
  }

  public assignCertificateRequest(certificateRequestId: string): void {
    this.data.certificate_request_id = certificateRequestId;
    this.data.updated_at = new Date();
  }

  public updateMetadata(metadata: any): void {
    this.data.metadata = { ...this.data.metadata, ...metadata };
    this.data.updated_at = new Date();
  }

  // Serialización
  public toData(): SessionTraceData {
    return { ...this.data };
  }

  public static fromData(data: SessionTraceData): SessionTrace {
    return new SessionTrace(data);
  }

  // Factory methods
  public static create(
    phoneNumber: string,
    sessionId: string,
    status: SessionTraceStatus,
    stepDescription: string,
    documentNumber?: string,
    metadata?: any
  ): SessionTrace {
    const now = new Date();
    const id = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const data: SessionTraceData = {
      id,
      phone_number: phoneNumber,
      session_id: sessionId,
      status,
      step_description: stepDescription,
      document_number: documentNumber,
      metadata: metadata || {},
      created_at: now,
      updated_at: now,
    };

    return new SessionTrace(data);
  }
} 