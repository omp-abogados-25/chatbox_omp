import { Controller, Param, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { AssignRequesterUserUseCase } from '../../application/use-cases';
import { AssignRequesterUserDto } from '../dtos/assign-requester-user.dto';
import { CertificateRequestResponseDto } from '../dtos';

@ApiTags('Solicitudes de Certificados')
@Controller('certificate-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssignRequesterUserController {
  constructor(
    private readonly assignRequesterUserUseCase: AssignRequesterUserUseCase,
  ) {}

  @Patch(':id/assign-requester')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Asignar usuario solicitante a una solicitud',
    description: 'Asigna un usuario específico como solicitante de una solicitud de certificado existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la solicitud de certificado',
    example: 'uuid-de-la-solicitud',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario asignado exitosamente',
    type: CertificateRequestResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitud no encontrada',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async assignRequesterUser(
    @Param('id') id: string,
    @Body() assignRequesterUserDto: AssignRequesterUserDto,
  ) {
    const result = await this.assignRequesterUserUseCase.execute({
      certificateRequestId: id,
      userId: assignRequesterUserDto.userId,
    });

    return {
      success: true,
      message: 'Usuario solicitante asignado exitosamente',
      data: result,
    };
  }
} 