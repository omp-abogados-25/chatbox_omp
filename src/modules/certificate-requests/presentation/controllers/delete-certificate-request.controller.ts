import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { DeleteCertificateRequestUseCase } from '../../application/use-cases/delete-certificate-request.use-case';

@Controller('certificate-requests')
@UseGuards(JwtAuthGuard)
export class DeleteCertificateRequestController {
  constructor(
    private readonly deleteCertificateRequestUseCase: DeleteCertificateRequestUseCase,
  ) {}

  @Delete(':id')
  async deleteCertificateRequest(@Param('id') id: string) {
    await this.deleteCertificateRequestUseCase.execute(id);
    return { message: 'Solicitud eliminada correctamente' };
  }
} 