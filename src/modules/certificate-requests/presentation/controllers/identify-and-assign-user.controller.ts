import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { IdentifyAndAssignUserUseCase } from '../../application/use-cases';
import { IdentifyAndAssignUserDto, IdentifyAndAssignUserResponseDto } from '../dtos/identify-and-assign-user.dto';

@ApiTags('Solicitudes de Certificados')
@Controller('certificate-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IdentifyAndAssignUserController {
  constructor(
    private readonly identifyAndAssignUserUseCase: IdentifyAndAssignUserUseCase,
  ) {}

  @Post('identify-and-assign-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Identificar usuario por documento y asignar todas sus solicitudes',
    description: 'Busca un usuario por su documento de identidad y asigna todas las solicitudes previas del número de WhatsApp a ese usuario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario identificado y solicitudes asignadas exitosamente',
    type: IdentifyAndAssignUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado en el sistema',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async identifyAndAssignUser(
    @Body() identifyAndAssignUserDto: IdentifyAndAssignUserDto,
  ) {
    const result = await this.identifyAndAssignUserUseCase.execute({
      whatsappNumber: identifyAndAssignUserDto.whatsappNumber,
      identificationNumber: identifyAndAssignUserDto.identificationNumber,
    });

    return {
      success: true,
      message: `Usuario identificado exitosamente. ${result.totalAssigned} solicitudes asignadas`,
      data: result,
    };
  }
} 