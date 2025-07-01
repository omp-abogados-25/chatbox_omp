import { Injectable, Inject } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';
import { CertificateRequest } from '../../../../whatsapp-webhook/domain/entities';

export interface CreateCertificateRequestRequest {
  whatsapp_number: string;
  certificate_type: string;
  requester_name?: string;
  requester_document?: string;
  request_data?: any;
  interaction_messages?: any;
}

@Injectable()
export class CreateCertificateRequestUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(request: CreateCertificateRequestRequest): Promise<CertificateRequest> {
    // Validaciones básicas
    if (!request.whatsapp_number) {
      throw new Error('El número de WhatsApp es requerido');
    }

    if (!request.certificate_type) {
      throw new Error('El tipo de certificado es requerido');
    }

    // Validar formato del número de WhatsApp (opcional)
    if (request.whatsapp_number && !this.isValidWhatsAppNumber(request.whatsapp_number)) {
      throw new Error('El formato del número de WhatsApp no es válido');
    }

    // Crear la solicitud
    const certificateRequest = await this.certificateRequestRepository.create(
      request.whatsapp_number,
      request.certificate_type,
      request.requester_name,
      request.requester_document,
      request.request_data,
      request.interaction_messages,
    );

    return certificateRequest;
  }

  private isValidWhatsAppNumber(number: string): boolean {
    // Validar que el número tenga un formato básico válido
    // Por ejemplo: +57XXXXXXXXXX o 57XXXXXXXXXX
    const whatsappRegex = /^(\+?57)?[0-9]{10}$/;
    return whatsappRegex.test(number.replace(/\s+/g, ''));
  }
} 