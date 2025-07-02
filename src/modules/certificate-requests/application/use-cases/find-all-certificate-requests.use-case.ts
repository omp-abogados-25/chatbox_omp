import { Injectable, Inject } from '@nestjs/common';
import { 
  CertificateRequestRepository,
  CertificateRequestFilters,
  CertificateRequestPagination,
  PaginatedCertificateRequests
} from '../../../../whatsapp-webhook/domain/interfaces';

export interface FindAllCertificateRequestsRequest {
  filters?: CertificateRequestFilters;
  pagination?: CertificateRequestPagination;
}

@Injectable()
export class FindAllCertificateRequestsUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(request?: FindAllCertificateRequestsRequest): Promise<PaginatedCertificateRequests> {
    const pagination: CertificateRequestPagination = {
      page: request?.pagination?.page || 1,
      limit: Math.min(request?.pagination?.limit || 10, 100), // Máximo 100 registros por página
      orderBy: request?.pagination?.orderBy || 'created_at',
      orderDirection: request?.pagination?.orderDirection || 'desc',
    };

    return await this.certificateRequestRepository.findAll(
      request?.filters,
      pagination,
    );
  }
} 