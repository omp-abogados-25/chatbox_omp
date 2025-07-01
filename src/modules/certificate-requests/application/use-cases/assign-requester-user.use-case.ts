import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

export interface AssignRequesterUserRequest {
  certificateRequestId: string;
  userId: string;
}

@Injectable()
export class AssignRequesterUserUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(request: AssignRequesterUserRequest): Promise<CertificateRequest> {
    if (!request.certificateRequestId) {
      throw new Error('El ID de la solicitud es requerido');
    }

    if (!request.userId) {
      throw new Error('El ID del usuario es requerido');
    }

    // Verificar que la solicitud existe
    const existingRequest = await this.certificateRequestRepository.findById(request.certificateRequestId);
    if (!existingRequest) {
      throw new NotFoundException(`Solicitud de certificado con ID ${request.certificateRequestId} no encontrada`);
    }

    // Asignar el usuario solicitante
    return await this.certificateRequestRepository.assignRequesterUser(
      request.certificateRequestId,
      request.userId
    );
  }
} 