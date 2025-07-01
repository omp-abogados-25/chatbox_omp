import { Inject, Injectable } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

@Injectable()
export class MarkDocumentAsSentUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(id: string): Promise<CertificateRequest> {
    // Buscar la solicitud
    const certificateRequest = await this.certificateRequestRepository.findById(id);
    
    if (!certificateRequest) {
      throw new Error('Solicitud de certificado no encontrada');
    }

    // Marcar como enviado usando el método del repositorio
    return this.certificateRequestRepository.markDocumentAsSent(id);
  }
} 