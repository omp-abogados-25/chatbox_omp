import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../integrations/prisma/prisma.module';
import { PrismaCertificateRequestRepository } from '../../../whatsapp-webhook/infrastructure/repositories/certificate-request.repository';

const CERTIFICATE_REQUEST_REPOSITORY = 'CertificateRequestRepository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: CERTIFICATE_REQUEST_REPOSITORY,
      useClass: PrismaCertificateRequestRepository,
    },
  ],
  exports: [CERTIFICATE_REQUEST_REPOSITORY],
})
export class CertificateRequestsInfrastructureModule {} 