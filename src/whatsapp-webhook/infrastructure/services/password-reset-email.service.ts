import { Injectable, Logger, Inject } from '@nestjs/common';
import { IPasswordResetEmailService } from '../../domain/interfaces/password-reset.interface';
import { IEmailService } from '../../domain/interfaces/email.interface';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from './template.service';
import * as path from 'path';

const PASSWORD_RESET_EMAIL_TEMPLATE = 'email/password_reset_email.hbs';
const LOGO_OMP_PATH_RELATIVE = 'assets/images/logo.png';

@Injectable()
export class PasswordResetEmailService implements IPasswordResetEmailService {
  private readonly logger = new Logger(PasswordResetEmailService.name);
  private readonly passwordResetSessionDurationMinutes: number;

  constructor(
    @Inject('IEmailService') private readonly emailService: IEmailService,
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    this.passwordResetSessionDurationMinutes = this.configService.get<number>('PASSWORD_RESET_SESSION_DURATION_MINUTES') || 10;
  }

  async sendPasswordResetCode(
    email: string,
    totpCode: string,
    userName: string,
    expiresIn: number
  ): Promise<boolean> {
    try {
      const projectRootDir = path.resolve(__dirname, '../../../../');
      const logoOmpAbsolutePath = path.resolve(projectRootDir, LOGO_OMP_PATH_RELATIVE);

      const emailHtmlData = {
        userName: userName,
        otpCode: totpCode,
        passwordResetSessionDurationMinutes: this.passwordResetSessionDurationMinutes,
        currentYear: new Date().getFullYear(),
      };

      const htmlContent = await this.templateService.compileTemplate(PASSWORD_RESET_EMAIL_TEMPLATE, emailHtmlData);

      const emailSent = await this.emailService.sendEmail({
        to: email,
        subject: `Código de recuperación de contraseña - OMP Abogados: ${totpCode}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo-omp.png',
            path: logoOmpAbsolutePath,
            cid: 'logo_omp_password_reset@ompabogados.com'
          }
        ]
      });

      if (emailSent) {
        return true;
      }
      this.logger.warn(`Failed to send password reset code email to ${email} for user ${userName}`);
      return false;
    } catch (error) {
      this.logger.error(
        `Error sending password reset code to ${email} for user ${userName}:`,
        error,
      );
      return false;
    }
  }
} 