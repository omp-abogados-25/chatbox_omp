import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { GetCertificateRequestStatisticsUseCase } from '../../application/use-cases/get-certificate-request-statistics.use-case';
import { GetDashboardStatisticsUseCase } from '../../application/use-cases/get-dashboard-statistics.use-case';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly getCertificateRequestStatisticsUseCase: GetCertificateRequestStatisticsUseCase,
    private readonly getDashboardStatisticsUseCase: GetDashboardStatisticsUseCase,
  ) {}

  @Get('statistics')
  async getDashboardStatistics() {
    return this.getDashboardStatisticsUseCase.execute();
  }

  @Get('certificate-requests/statistics')
  async getCertificateRequestStatistics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.getCertificateRequestStatisticsUseCase.execute({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }
} 