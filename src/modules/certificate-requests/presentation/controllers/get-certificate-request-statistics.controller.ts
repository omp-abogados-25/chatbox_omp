import { Controller, Get, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { GetCertificateRequestStatisticsUseCase, CertificateRequestStatistics } from '../../application/use-cases';

@ApiTags('Certificate Requests')
@Controller('certificate-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GetCertificateRequestStatisticsController {
  constructor(
    private readonly getStatisticsUseCase: GetCertificateRequestStatisticsUseCase,
  ) {}

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de solicitudes',
    description: 'Obtiene métricas y estadísticas de las solicitudes de certificados'
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Fecha desde (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'Fecha hasta (ISO string)', 
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        pending: { type: 'number', example: 25 },
        in_progress: { type: 'number', example: 10 },
        completed: { type: 'number', example: 100 },
        failed: { type: 'number', example: 10 },
        cancelled: { type: 'number', example: 5 },
        waiting_info: { type: 'number', example: 0 },
        documents_generated: { type: 'number', example: 95 },
        documents_sent: { type: 'number', example: 90 },
        completion_rate: { type: 'number', example: 66.67 },
        success_rate: { type: 'number', example: 86.96 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de acceso requerido',
  })
  async getStatistics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ): Promise<CertificateRequestStatistics> {
    return await this.getStatisticsUseCase.execute({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }
} 