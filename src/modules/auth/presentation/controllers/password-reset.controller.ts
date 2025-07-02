import { Controller, Post, Body, HttpStatus, HttpException, Logger, Inject } from '@nestjs/common';
import { Public } from '../../infrastructure/decorators/public.decorator';
import {
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  VerifyPasswordResetCodeDto,
  VerifyCodeResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from '../dtos/forgot-password.dto';
import { IPasswordResetService } from '../../../../whatsapp-webhook/domain/interfaces/password-reset.interface';
import { IPasswordResetEmailService } from '../../../../whatsapp-webhook/domain/interfaces/password-reset.interface';
import { AbstractFindUserByEmailRepository } from '../../../users/domain/repositories/user-repository.actions';
import { AbstractUpdateUserRepository } from '../../../users/domain/repositories/user-repository.actions';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class PasswordResetController {
  private readonly logger = new Logger(PasswordResetController.name);

  constructor(
    @Inject('IPasswordResetService') private readonly passwordResetService: IPasswordResetService,
    @Inject('IPasswordResetEmailService') private readonly passwordResetEmailService: IPasswordResetEmailService,
    private readonly findUserByEmailRepository: AbstractFindUserByEmailRepository,
    private readonly updateUserRepository: AbstractUpdateUserRepository,
  ) {}

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() request: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> {
    try {
      this.logger.log(`Password reset requested for email: ${request.email}`);

      // Verificar si el usuario existe y puede hacer login
      const user = await this.findUserByEmailRepository.execute(request.email);
      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        return {
          message: 'Si el correo electrónico está registrado, recibirás un código de verificación',
          sessionId: '',
          expiresIn: 10,
          success: true
        };
      }

      if (!user.can_login) {
        throw new HttpException(
          'Esta cuenta no tiene permisos de acceso',
          HttpStatus.FORBIDDEN
        );
      }

      // Crear sesión de reset de contraseña
      const session = await this.passwordResetService.createPasswordResetSession(request.email);

      // Enviar email con el código
      const emailSent = await this.passwordResetEmailService.sendPasswordResetCode(
        request.email,
        session.totpCode,
        user.full_name,
        10 // 10 minutos
      );

      if (!emailSent) {
        this.logger.error(`Failed to send password reset email to: ${request.email}`);
        throw new HttpException(
          'Error al enviar el correo de verificación',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      this.logger.log(`Password reset email sent successfully to: ${request.email}`);

      return {
        message: 'Código de verificación enviado a tu correo electrónico',
        sessionId: session.id,
        expiresIn: 10,
        success: true
      };
    } catch (error) {
      this.logger.error(`Error in forgot password for ${request.email}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Public()
  @Post('verify-reset-code')
  async verifyResetCode(@Body() request: VerifyPasswordResetCodeDto): Promise<VerifyCodeResponseDto> {
    try {
      this.logger.log(`Verifying reset code for session: ${request.sessionId}`);

      const isValid = await this.passwordResetService.verifyPasswordResetSession(
        request.sessionId,
        request.code
      );

      if (!isValid) {
        throw new HttpException(
          'Código inválido o expirado',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Reset code verified successfully for session: ${request.sessionId}`);

      return {
        message: 'Código verificado correctamente',
        success: true
      };
    } catch (error) {
      this.logger.error(`Error verifying reset code for session ${request.sessionId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() request: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    try {
      this.logger.log(`Password reset attempt for session: ${request.sessionId}`);

      // Validar que las contraseñas coincidan
      if (request.password !== request.confirmPassword) {
        throw new HttpException(
          'Las contraseñas no coinciden',
          HttpStatus.BAD_REQUEST
        );
      }

      // Obtener la sesión
      const session = await this.passwordResetService.getPasswordResetSession(request.sessionId);
      if (!session) {
        throw new HttpException(
          'Sesión inválida o expirada',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!session.isVerified) {
        throw new HttpException(
          'Debes verificar el código antes de cambiar la contraseña',
          HttpStatus.BAD_REQUEST
        );
      }

      // Buscar el usuario
      const user = await this.findUserByEmailRepository.execute(session.email);
      if (!user) {
        throw new HttpException(
          'Usuario no encontrado',
          HttpStatus.NOT_FOUND
        );
      }

      // Encriptar la nueva contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(request.password, saltRounds);

      // Actualizar la contraseña del usuario
      await this.updateUserRepository.execute(user.id, {
        password: hashedPassword,
        can_login: true // Asegurar que puede hacer login
      });

      // Invalidar la sesión de reset
      await this.passwordResetService.invalidatePasswordResetSession(request.sessionId);

      this.logger.log(`Password reset successfully for user: ${session.email}`);

      return {
        message: 'Contraseña actualizada correctamente',
        success: true
      };
    } catch (error) {
      this.logger.error(`Error resetting password for session ${request.sessionId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 