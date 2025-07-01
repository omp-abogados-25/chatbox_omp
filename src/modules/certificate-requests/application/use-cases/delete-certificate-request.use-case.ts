import { Inject, Injectable } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';

@Injectable()
export class DeleteCertificateRequestUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Verificar que la solicitud existe
    const certificateRequest = await this.certificateRequestRepository.findById(id);
    
    if (!certificateRequest) {
      throw new Error('Solicitud de certificado no encontrada');
    }

    // Eliminar la solicitud usando el método del repositorio
    await this.certificateRequestRepository.delete(id);
  }
} 