import { Module } from '@nestjs/common';
import { CertificateRequestsApplicationModule } from '../application';
import {
  CreateCertificateRequestController,
  FindAllCertificateRequestsController,
  FindCertificateRequestByIdController,
  UpdateCertificateRequestController,
  UpdateCertificateRequestStatusController,
  GetCertificateRequestStatisticsController,
  AssignRequesterUserController,
  IdentifyAndAssignUserController,
  DashboardController,
  SearchCertificateRequestsController,
  MarkDocumentSentController,
  DeleteCertificateRequestController,
  CertificateRequestTraceController,
} from './controllers';

@Module({
  imports: [CertificateRequestsApplicationModule],
  controllers: [
    CreateCertificateRequestController,
    FindAllCertificateRequestsController,
    FindCertificateRequestByIdController,
    UpdateCertificateRequestController,
    UpdateCertificateRequestStatusController,
    GetCertificateRequestStatisticsController,
    AssignRequesterUserController,
    IdentifyAndAssignUserController,
    DashboardController,
    SearchCertificateRequestsController,
    MarkDocumentSentController,
    DeleteCertificateRequestController,
    CertificateRequestTraceController,
  ],
})
export class CertificateRequestsPresentationModule {}