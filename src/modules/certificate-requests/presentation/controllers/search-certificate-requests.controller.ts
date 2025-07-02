import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { FindAllCertificateRequestsUseCase } from '../../application/use-cases/find-all-certificate-requests.use-case';

@Controller('certificate-requests')
@UseGuards(JwtAuthGuard)
export class SearchCertificateRequestsController {
  constructor(
    private readonly findAllCertificateRequestsUseCase: FindAllCertificateRequestsUseCase,
  ) {}

  @Get('search')
  async searchCertificateRequests(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: 'asc' | 'desc',
  ) {
    if (!search) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Usar el caso de uso con filtros de búsqueda
    const result = await this.findAllCertificateRequestsUseCase.execute({
      filters: {
        search: search,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        orderBy: orderBy || 'created_at',
        orderDirection: orderDirection || 'desc',
      },
    });

    return result;
  }
} 