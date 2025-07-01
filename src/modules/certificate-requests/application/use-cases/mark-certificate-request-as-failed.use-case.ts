import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

export interface MarkCertificateRequestAsFailedRequest {
  id: string;
  errorMessage: string;
}

@Injectable()
export class MarkCertificateRequestAsFailedUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(request: MarkCertificateRequestAsFailedRequest): Promise<CertificateRequest> {
    if (!request.id) {
      throw new Error('El ID de la solicitud es requerido');
    }

    if (!request.errorMessage) {
      throw new Error('El mensaje de error es requerido');
    }

    // Verificar que la solicitud existe
    const existingRequest = await this.certificateRequestRepository.findById(request.id);
    if (!existingRequest) {
      throw new NotFoundException(`Solicitud de certificado con ID ${request.id} no encontrada`);
    }

    // Validar que la solicitud se puede marcar como fallida
    if (existingRequest.isCompleted()) {
      throw new Error('No se puede marcar como fallida una solicitud ya completada');
    }

    // Marcar como fallida
    return await this.certificateRequestRepository.markAsFailed(
      request.id,
      request.errorMessage
    );
  }
} 