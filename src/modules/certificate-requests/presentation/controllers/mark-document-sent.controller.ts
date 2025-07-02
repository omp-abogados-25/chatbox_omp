import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { MarkDocumentAsSentUseCase } from '../../application/use-cases/mark-document-as-sent.use-case';

@Controller('certificate-requests')
@UseGuards(JwtAuthGuard)
export class MarkDocumentSentController {
  constructor(
    private readonly markDocumentAsSentUseCase: MarkDocumentAsSentUseCase,
  ) {}

  @Patch(':id/mark-sent')
  async markDocumentAsSent(@Param('id') id: string) {
    return this.markDocumentAsSentUseCase.execute(id);
  }
} 