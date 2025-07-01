import { Controller, Post, Body, HttpStatus, HttpException, Logger, Inject } from '@nestjs/common';
import { Public } from '../../infrastructure/decorators/public.decorator';
import {
  ActivateUsersDto,
  ActivateUsersResponseDto,
  VerifyActivationCodeDto,
  VerifyActivationCodeResponseDto,
  SetNewUserPasswordDto,
  SetNewUserPasswordResponseDto,
} from '../dtos/user-activation.dto';
import { IUserActivationService, IUserActivationEmailService } from '../../../../whatsapp-webhook/domain/interfaces/password-reset.interface';
import { AbstractFindUserByIdRepository, AbstractFindUserByEmailRepository, AbstractUpdateUserRepository } from '../../../users/domain/repositories/user-repository.actions';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UserActivationController {
  private readonly logger = new Logger(UserActivationController.name);

  constructor(
    @Inject('IUserActivationService') private readonly userActivationService: IUserActivationService,
    @Inject('IUserActivationEmailService') private readonly userActivationEmailService: IUserActivationEmailService,
    private readonly findUserByIdRepository: AbstractFindUserByIdRepository,
    private readonly findUserByEmailRepository: AbstractFindUserByEmailRepository,
    private readonly updateUserRepository: AbstractUpdateUserRepository,
  ) {}

  @Post('activate')
  async activateUsers(@Body() request: ActivateUsersDto): Promise<ActivateUsersResponseDto> {
    try {
      this.logger.log(`Activating users: ${request.userIds.join(', ')}`);

      // Crear sesiones de activación para todos los usuarios
      const sessions = await this.userActivationService.createActivationSession(request.userIds);
      
      let successfulActivations = 0;
      const activationResults = [];

      for (const session of sessions) {
        try {
          // Buscar el usuario por ID
          const user = await this.findUserByIdRepository.execute(session.userId);
          if (!user) {
            this.logger.warn(`User not found: ${session.userId}`);
            continue;
          }

          // Verificar que el usuario no tenga ya acceso activado
          if (user.can_login) {
            this.logger.warn(`User already has login access: ${session.userId}`);
            continue;
          }

          // Actualizar la sesión con el email del usuario
          session.email = user.email;

          // Enviar email con el código
          const emailSent = await this.userActivationEmailService.sendActivationCode(
            user.email,
            session.totpCode,
            user.full_name,
            10 // 10 minutos
          );

          if (emailSent) {
            successfulActivations++;
            activationResults.push({
              userId: session.userId,
              sessionId: session.id,
              email: user.email,
            });
            this.logger.log(`Activation email sent successfully to: ${user.email}`);
          } else {
            this.logger.error(`Failed to send activation email to: ${user.email}`);
          }
        } catch (error) {
          this.logger.error(`Error processing user activation for ${session.userId}:`, error);
        }
      }

      return {
        message: `Se han enviado ${successfulActivations} códigos de activación`,
        success: successfulActivations > 0,
        activatedCount: successfulActivations,
        sessions: activationResults,
      };
    } catch (error) {
      this.logger.error('Error in user activation:', error);
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Public()
  @Post('verify-activation-code')
  async verifyActivationCode(@Body() request: VerifyActivationCodeDto): Promise<VerifyActivationCodeResponseDto> {
    try {
      this.logger.log(`Verifying activation code for session: ${request.sessionId}`);

      const isValid = await this.userActivationService.verifyActivationSession(
        request.sessionId,
        request.code
      );

      if (!isValid) {
        throw new HttpException(
          'Código inválido o expirado',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Activation code verified successfully for session: ${request.sessionId}`);

      return {
        message: 'Código verificado correctamente',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error verifying activation code for session ${request.sessionId}:`, error);
      
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
  @Post('set-new-password')
  async setNewUserPassword(@Body() request: SetNewUserPasswordDto): Promise<SetNewUserPasswordResponseDto> {
    try {
      this.logger.log(`Setting new password for session: ${request.sessionId}`);

      // Validar que las contraseñas coincidan
      if (request.password !== request.confirmPassword) {
        throw new HttpException(
          'Las contraseñas no coinciden',
          HttpStatus.BAD_REQUEST
        );
      }

      // Obtener la sesión
      const session = await this.userActivationService.getActivationSession(request.sessionId);
      if (!session) {
        throw new HttpException(
          'Sesión inválida o expirada',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!session.isVerified) {
        throw new HttpException(
          'Debes verificar el código antes de establecer la contraseña',
          HttpStatus.BAD_REQUEST
        );
      }

      // Buscar el usuario
      const user = await this.findUserByIdRepository.execute(session.userId);
      if (!user) {
        throw new HttpException(
          'Usuario no encontrado',
          HttpStatus.NOT_FOUND
        );
      }

      // Encriptar la nueva contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(request.password, saltRounds);

      // Actualizar el usuario con la nueva contraseña y habilitar login
      await this.updateUserRepository.execute(user.id, {
        password: hashedPassword,
        can_login: true,
      });

      // Invalidar la sesión de activación
      await this.userActivationService.invalidateActivationSession(request.sessionId);

      this.logger.log(`Password set successfully for user: ${user.email}`);

      return {
        message: 'Contraseña establecida correctamente. Ya puedes iniciar sesión.',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error setting password for session ${request.sessionId}:`, error);
      
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
  @Post('request-activation-by-email')
  async requestActivationByEmail(@Body() request: { email: string }): Promise<{
    message: string;
    success: boolean;
    sessionId: string;
  }> {
    try {
      this.logger.log(`Requesting activation by email: ${request.email}`);

      // Buscar el usuario por email
      const user = await this.findUserByEmailRepository.execute(request.email);
      if (!user) {
        throw new HttpException(
          'Usuario no encontrado con ese correo electrónico',
          HttpStatus.NOT_FOUND
        );
      }

      // Verificar que el usuario no tenga ya acceso activado
      if (user.can_login) {
        throw new HttpException(
          'Este usuario ya tiene acceso habilitado al sistema',
          HttpStatus.BAD_REQUEST
        );
      }

      // Crear sesión de activación para este usuario
      const sessions = await this.userActivationService.createActivationSession([user.id]);
      
      if (sessions.length === 0) {
        throw new HttpException(
          'No se pudo crear la sesión de activación',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const session = sessions[0];
      session.email = user.email;

      // Enviar email con el código
      const emailSent = await this.userActivationEmailService.sendActivationCode(
        user.email,
        session.totpCode,
        user.full_name,
        10 // 10 minutos
      );

      if (!emailSent) {
        throw new HttpException(
          'Error al enviar el correo electrónico',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      this.logger.log(`Activation email sent successfully to: ${user.email}`);

      return {
        message: `Código de activación enviado a ${user.email}`,
        success: true,
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error('Error in request activation by email:', error);
      
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