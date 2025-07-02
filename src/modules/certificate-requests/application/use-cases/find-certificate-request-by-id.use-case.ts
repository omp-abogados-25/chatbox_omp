import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

@Injectable()
export class FindCertificateRequestByIdUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(id: string): Promise<CertificateRequest> {
    if (!id) {
      throw new Error('El ID de la solicitud es requerido');
    }

    const certificateRequest = await this.certificateRequestRepository.findById(id);

    if (!certificateRequest) {
      throw new NotFoundException(`Solicitud de certificado con ID ${id} no encontrada`);
    }

    return certificateRequest;
  }
} 