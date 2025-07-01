import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

export interface MarkCertificateRequestAsCompletedRequest {
  id: string;
  documentPath?: string;
  completionReason?: string;
}

@Injectable()
export class MarkCertificateRequestAsCompletedUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(request: MarkCertificateRequestAsCompletedRequest): Promise<CertificateRequest> {
    if (!request.id) {
      throw new Error('El ID de la solicitud es requerido');
    }

    // Verificar que la solicitud existe
    const existingRequest = await this.certificateRequestRepository.findById(request.id);
    if (!existingRequest) {
      throw new NotFoundException(`Solicitud de certificado con ID ${request.id} no encontrada`);
    }

    // Validar que la solicitud se puede completar
    if (existingRequest.isCompleted()) {
      throw new Error('La solicitud ya está completada');
    }

    if (!existingRequest.canBeProcessed() && !existingRequest.isInProgress()) {
      throw new Error('La solicitud no está en un estado válido para ser completada');
    }

    // Marcar como completada
    return await this.certificateRequestRepository.markAsCompleted(
      request.id,
      request.documentPath,
      request.completionReason
    );
  }
} 