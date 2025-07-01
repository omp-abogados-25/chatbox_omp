import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CertificateRequestTraceService, CertificateRequestWithTrace } from '../../application/services/certificate-request-trace.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';

@Controller('api/certificate-requests-trace')
@UseGuards(JwtAuthGuard)
export class CertificateRequestTraceController {
  constructor(
    private readonly certificateRequestTraceService: CertificateRequestTraceService,
  ) {}

  /**
   * Obtiene todas las solicitudes con su trazabilidad
   */
  @Get()
  async findAllWithTraceability(): Promise<CertificateRequestWithTrace[]> {
    return await this.certificateRequestTraceService.findAllWithTraceability();
  }

  /**
   * Obtiene una solicitud específica con su trazabilidad
   */
  @Get(':id')
  async findByIdWithTraceability(
    @Param('id') id: string
  ): Promise<CertificateRequestWithTrace | null> {
    return await this.certificateRequestTraceService.findByIdWithTraceability(id);
  }

  /**
   * Obtiene estadísticas de trazabilidad
   */
  @Get('statistics/overview')
  async getTraceabilityStatistics() {
    return await this.certificateRequestTraceService.getTraceabilityStatistics();
  }

  /**
   * Obtiene el historial de trazas por número de teléfono
   */
  @Get('phone/:phoneNumber/history')
  async getTraceHistoryByPhone(
    @Param('phoneNumber') phoneNumber: string
  ) {
    return await this.certificateRequestTraceService.getTraceHistoryByPhone(phoneNumber);
  }
} 