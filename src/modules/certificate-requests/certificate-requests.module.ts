import { Module } from '@nestjs/common';
import { CertificateRequestsApplicationModule } from './application';
import { CertificateRequestsInfrastructureModule } from './infrastructure';
import { CertificateRequestsPresentationModule } from './presentation';

@Module({
  imports: [
    CertificateRequestsApplicationModule,
    CertificateRequestsInfrastructureModule,
    CertificateRequestsPresentationModule,
  ],
  exports: [
    CertificateRequestsApplicationModule,
    CertificateRequestsInfrastructureModule,
  ],
})
export class CertificateRequestsModule {} 