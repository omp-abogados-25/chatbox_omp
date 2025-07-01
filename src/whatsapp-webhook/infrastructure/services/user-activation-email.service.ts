import { Injectable, Logger, Inject } from '@nestjs/common';
import { IUserActivationEmailService } from '../../domain/interfaces/password-reset.interface';
import { IEmailService } from '../../domain/interfaces/email.interface';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from './template.service';
import * as path from 'path';

const USER_ACTIVATION_EMAIL_TEMPLATE = 'email/user_activation_email.hbs';
const LOGO_OMP_PATH_RELATIVE = 'assets/images/logo.png';

@Injectable()
export class UserActivationEmailService implements IUserActivationEmailService {
  private readonly logger = new Logger(UserActivationEmailService.name);
  private readonly userActivationSessionDurationMinutes: number;

  constructor(
    @Inject('IEmailService') private readonly emailService: IEmailService,
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    this.userActivationSessionDurationMinutes = this.configService.get<number>('USER_ACTIVATION_SESSION_DURATION_MINUTES') || 10;
  }

  async sendActivationCode(
    email: string, 
    code: string, 
    fullName: string, 
    expiresInMinutes: number
  ): Promise<boolean> {
    try {
      this.logger.log(`Sending user activation email to: ${email}`);

      const projectRootDir = path.resolve(__dirname, '../../../../');
      const logoOmpAbsolutePath = path.resolve(projectRootDir, LOGO_OMP_PATH_RELATIVE);

      const emailHtmlData = {
        fullName: fullName,
        activationCode: code,
        userActivationSessionDurationMinutes: expiresInMinutes,
        currentYear: new Date().getFullYear(),
      };

      const htmlContent = await this.templateService.compileTemplate(USER_ACTIVATION_EMAIL_TEMPLATE, emailHtmlData);

      const emailSent = await this.emailService.sendEmail({
        to: email,
        subject: `Código de activación de cuenta - OMP Abogados: ${code}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo-omp.png',
            path: logoOmpAbsolutePath,
            cid: 'logo_omp_user_activation@ompabogados.com'
          }
        ]
      });

      if (emailSent) {
        this.logger.log(`User activation email sent successfully to: ${email}`);
        return true;
      }
      this.logger.warn(`Failed to send user activation email to ${email} for user ${fullName}`);
      return false;
    } catch (error) {
      this.logger.error(`Failed to send user activation email to ${email} for user ${fullName}:`, error);
      return false;
    }
  }
} 