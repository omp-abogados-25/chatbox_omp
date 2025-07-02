import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

export interface UpdateCertificateRequestRequest {
  id: string;
  requester_name?: string;
  requester_document?: string;
  certificate_type?: string;
  request_data?: any;
  interaction_messages?: any;
}

@Injectable()
export class UpdateCertificateRequestUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(request: UpdateCertificateRequestRequest): Promise<CertificateRequest> {
    if (!request.id) {
      throw new Error('El ID de la solicitud es requerido');
    }

    // Verificar que la solicitud existe
    const existingRequest = await this.certificateRequestRepository.findById(request.id);
    if (!existingRequest) {
      throw new NotFoundException(`Solicitud de certificado con ID ${request.id} no encontrada`);
    }

    // Validar que la solicitud se puede actualizar
    if (existingRequest.isCompleted()) {
      throw new Error('No se puede actualizar una solicitud que ya está completada');
    }

    // Preparar los datos de actualización
    const updates: any = {};
    
    if (request.requester_name !== undefined) {
      updates.requester_name = request.requester_name;
    }
    
    if (request.requester_document !== undefined) {
      updates.requester_document = request.requester_document;
    }
    
    if (request.certificate_type !== undefined) {
      updates.certificate_type = request.certificate_type;
    }

    // Actualizar datos específicos usando métodos del repositorio
    let updatedRequest = existingRequest;

    if (request.request_data !== undefined) {
      updatedRequest = await this.certificateRequestRepository.updateRequestData(
        request.id,
        request.request_data
      );
    }

    if (request.interaction_messages !== undefined) {
      updatedRequest = await this.certificateRequestRepository.updateInteractionMessages(
        request.id,
        request.interaction_messages
      );
    }

    // Si hay otros campos para actualizar
    if (Object.keys(updates).length > 0) {
      updatedRequest = await this.certificateRequestRepository.update(request.id, updates);
    }

    return updatedRequest;
  }
} 