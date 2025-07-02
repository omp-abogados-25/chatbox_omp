import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

export interface IdentifyAndAssignUserRequest {
  whatsappNumber: string;
  identificationNumber: string;
}

export interface IdentifyAndAssignUserResponse {
  user: {
    id: string;
    full_name: string;
    email: string;
    identification_number: string;
    position?: {
      id: string;
      name: string;
    };
  };
  assignedRequests: CertificateRequest[];
  totalAssigned: number;
}

@Injectable()
export class IdentifyAndAssignUserUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(request: IdentifyAndAssignUserRequest): Promise<IdentifyAndAssignUserResponse> {
    if (!request.whatsappNumber) {
      throw new Error('El número de WhatsApp es requerido');
    }

    if (!request.identificationNumber) {
      throw new Error('El número de documento es requerido');
    }

    // Buscar usuario por documento de identidad
    const user = await this.certificateRequestRepository.findUserByIdentificationNumber(
      request.identificationNumber
    );

    if (!user) {
      throw new NotFoundException(
        `Usuario con documento ${request.identificationNumber} no encontrado en el sistema`
      );
    }

    // Asignar el usuario a todas las solicitudes del número de WhatsApp
    const assignedRequests = await this.certificateRequestRepository.assignRequesterUserByWhatsApp(
      request.whatsappNumber,
      user.id
    );

    return {
      user,
      assignedRequests,
      totalAssigned: assignedRequests.length,
    };
  }
} 