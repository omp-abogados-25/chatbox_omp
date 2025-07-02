import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { CertificateRequest, CertificateRequestStatus } from '../../../../whatsapp-webhook/domain/entities';

export interface UpdateCertificateRequestStatusRequest {
  id: string;
  status: CertificateRequestStatus;
  userId?: string; // ID del usuario que está procesando
}

@Injectable()
export class UpdateCertificateRequestStatusUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(request: UpdateCertificateRequestStatusRequest): Promise<CertificateRequest> {
    if (!request.id) {
      throw new Error('El ID de la solicitud es requerido');
    }

    if (!request.status) {
      throw new Error('El estado es requerido');
    }

    // Verificar que la solicitud existe
    const existingRequest = await this.certificateRequestRepository.findById(request.id);
    if (!existingRequest) {
      throw new NotFoundException(`Solicitud de certificado con ID ${request.id} no encontrada`);
    }

    // Validar transiciones de estado
    this.validateStatusTransition(existingRequest.status, request.status);

    // Actualizar el estado
    return await this.certificateRequestRepository.updateStatus(
      request.id,
      request.status,
      request.userId
    );
  }

  private validateStatusTransition(currentStatus: CertificateRequestStatus, newStatus: CertificateRequestStatus): void {
    const allowedTransitions: Record<CertificateRequestStatus, CertificateRequestStatus[]> = {
      [CertificateRequestStatus.PENDING]: [
        CertificateRequestStatus.IN_PROGRESS,
        CertificateRequestStatus.WAITING_INFO,
        CertificateRequestStatus.CANCELLED,
      ],
      [CertificateRequestStatus.IN_PROGRESS]: [
        CertificateRequestStatus.COMPLETED,
        CertificateRequestStatus.FAILED,
        CertificateRequestStatus.WAITING_INFO,
        CertificateRequestStatus.CANCELLED,
      ],
      [CertificateRequestStatus.WAITING_INFO]: [
        CertificateRequestStatus.IN_PROGRESS,
        CertificateRequestStatus.CANCELLED,
      ],
      [CertificateRequestStatus.COMPLETED]: [],
      [CertificateRequestStatus.FAILED]: [
        CertificateRequestStatus.PENDING, // Permitir reintentos
      ],
      [CertificateRequestStatus.CANCELLED]: [
        CertificateRequestStatus.PENDING, // Permitir reactivación
      ],
    };

    const allowedNewStates = allowedTransitions[currentStatus] || [];
    
    if (!allowedNewStates.includes(newStatus)) {
      throw new Error(
        `Transición de estado no permitida: de ${currentStatus} a ${newStatus}`
      );
    }
  }
} 