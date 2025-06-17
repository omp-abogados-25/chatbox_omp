import { Injectable, Logger, Inject } from '@nestjs/common';
import { IMfaEmailService } from '../../domain/interfaces/mfa.interface';
import { IEmailService } from '../../domain/interfaces/email.interface';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from './template.service';
import * as path from 'path'; // Necesario para resolver la ruta del logo

const MFA_EMAIL_TEMPLATE = 'email/mfa_code_email.hbs';
const LOGO_OMP_PATH_RELATIVE = 'assets/images/logo.png'; // Para el correo de MFA

@Injectable()
export class MfaEmailService implements IMfaEmailService {
  private readonly logger = new Logger(MfaEmailService.name);
  private readonly mfaSessionDurationMinutes: number;

  constructor(
    @Inject('IEmailService') private readonly emailService: IEmailService,
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    this.mfaSessionDurationMinutes = this.configService.get<number>('MFA_SESSION_DURATION_MINUTES') || 5;
  }

  async sendTotpCode(
    email: string,
    totpCode: string,
    clientName: string,
    expiresIn: number
  ): Promise<boolean> {
    try {
      const projectRootDir = path.resolve(__dirname, '../../../../'); // Ajustar según sea necesario
      const logoOmpAbsolutePath = path.resolve(projectRootDir, LOGO_OMP_PATH_RELATIVE);

      const emailHtmlData = {
        clientName: clientName,
        otpCode: totpCode,
        mfaSessionDurationMinutes: this.mfaSessionDurationMinutes,
        currentYear: new Date().getFullYear(),
        // No es necesario pasar el logo path aquí, se adjunta como CID
      };

      const htmlContent = await this.templateService.compileTemplate(MFA_EMAIL_TEMPLATE, emailHtmlData);

      const emailSent = await this.emailService.sendEmail({
        to: email,
        subject: `Tu código de verificación de OMP Certificados: ${totpCode}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo-omp.png', // Nombre del archivo como aparecerá en el correo
            path: logoOmpAbsolutePath,
            cid: 'logo_omp_mfa@ompabogados.com' // CID único para esta plantilla
          }
        ]
      });

      if (emailSent) {
        return true;
      }
      this.logger.warn(`Failed to send TOTP code email to ${email} for client ${clientName} (emailService.sendEmail returned false)`);
      return false;
    } catch (error) {
      this.logger.error(
        `Error sending TOTP code to ${email} for client ${clientName}:`,
        error,
      );
      return false;
    }
  }
} 