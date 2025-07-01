import { Module } from '@nestjs/common';
import { CertificateRequestsInfrastructureModule } from '../infrastructure';
import { UsersInfrastructureModule } from '../../users/infrastructure';
import { WhatsappWebhookRepositoriesModule } from '../../../whatsapp-webhook/infrastructure/repositories/whatsapp-webhook-repositories.module';
import { CertificateRequestTraceService } from './services/certificate-request-trace.service';
import {
  CreateCertificateRequestUseCase,
  FindAllCertificateRequestsUseCase,
  FindCertificateRequestByIdUseCase,
  UpdateCertificateRequestUseCase,
  DeleteCertificateRequestUseCase,
  UpdateCertificateRequestStatusUseCase,
  MarkCertificateRequestAsCompletedUseCase,
  MarkCertificateRequestAsFailedUseCase,
  GetCertificateRequestStatisticsUseCase,
  GetDashboardStatisticsUseCase,
  SearchCertificateRequestsUseCase,
  AssignRequesterUserUseCase,
  IdentifyAndAssignUserUseCase,
  MarkDocumentAsSentUseCase,
} from './use-cases';

@Module({
  imports: [
    CertificateRequestsInfrastructureModule,
    UsersInfrastructureModule,
    WhatsappWebhookRepositoriesModule,
  ],
  providers: [
    CreateCertificateRequestUseCase,
    FindAllCertificateRequestsUseCase,
    FindCertificateRequestByIdUseCase,
    UpdateCertificateRequestUseCase,
    DeleteCertificateRequestUseCase,
    UpdateCertificateRequestStatusUseCase,
    MarkCertificateRequestAsCompletedUseCase,
    MarkCertificateRequestAsFailedUseCase,
    GetCertificateRequestStatisticsUseCase,
    GetDashboardStatisticsUseCase,
    SearchCertificateRequestsUseCase,
    AssignRequesterUserUseCase,
    IdentifyAndAssignUserUseCase,
    MarkDocumentAsSentUseCase,
    CertificateRequestTraceService,
  ],
  exports: [
    CreateCertificateRequestUseCase,
    FindAllCertificateRequestsUseCase,
    FindCertificateRequestByIdUseCase,
    UpdateCertificateRequestUseCase,
    DeleteCertificateRequestUseCase,
    UpdateCertificateRequestStatusUseCase,
    MarkCertificateRequestAsCompletedUseCase,
    MarkCertificateRequestAsFailedUseCase,
    GetCertificateRequestStatisticsUseCase,
    GetDashboardStatisticsUseCase,
    SearchCertificateRequestsUseCase,
    AssignRequesterUserUseCase,
    IdentifyAndAssignUserUseCase,
    MarkDocumentAsSentUseCase,
    CertificateRequestTraceService,
  ],
})
export class CertificateRequestsApplicationModule {} 