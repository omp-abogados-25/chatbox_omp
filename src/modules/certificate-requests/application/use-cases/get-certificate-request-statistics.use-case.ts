import { Injectable, Inject } from '@nestjs/common';
import { CertificateRequestRepository } from '../../../../whatsapp-webhook/domain/interfaces';

export interface CertificateRequestStatistics {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
  cancelled: number;
  waiting_info: number;
  documents_generated: number;
  documents_sent: number;
}

export interface GetCertificateRequestStatisticsRequest {
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class GetCertificateRequestStatisticsUseCase {
  constructor(
    @Inject('CertificateRequestRepository')
    private readonly certificateRequestRepository: CertificateRequestRepository,
  ) {}

  async execute(request?: GetCertificateRequestStatisticsRequest): Promise<CertificateRequestStatistics> {
    return await this.certificateRequestRepository.getStatistics(
      request?.dateFrom,
      request?.dateTo,
    );
  }
} 