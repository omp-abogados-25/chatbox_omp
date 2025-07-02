import { Injectable, Inject } from '@nestjs/common';
import { 
  CertificateRequestRepository,
  CertificateRequestPagination,
  PaginatedCertificateRequests
} from '../../../../whatsapp-webhook/domain/interfaces';

export interface SearchCertificateRequestsRequest {
  searchTerm: string;
  pagination?: CertificateRequestPagination;
}

@Injectable()
export class SearchCertificateRequestsUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(request: SearchCertificateRequestsRequest): Promise<PaginatedCertificateRequests> {
    if (!request.searchTerm || request.searchTerm.trim().length === 0) {
      throw new Error('El término de búsqueda es requerido');
    }

    // Normalizar el término de búsqueda
    const searchTerm = request.searchTerm.trim();

    const pagination: CertificateRequestPagination = {
      page: request.pagination?.page || 1,
      limit: Math.min(request.pagination?.limit || 10, 100), // Máximo 100 registros por página
      orderBy: request.pagination?.orderBy || 'created_at',
      orderDirection: request.pagination?.orderDirection || 'desc',
    };

    return await this.certificateRequestRepository.search(searchTerm, pagination);
  }
} 