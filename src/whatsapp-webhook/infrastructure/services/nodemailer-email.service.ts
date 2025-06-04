import { Injectable, Logger, Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailService, EmailOptions } from '../../domain/interfaces/email.interface';
import { getEmailConfig } from '../config/email.config';
import * as fs from 'fs/promises'; // Para eliminar el PDF temporal
import * as path from 'path';
import { TClient } from 'src/whatsapp-webhook/domain';

// Nuevas importaciones para los servicios refactorizados
import { TemplateService } from './template.service';
import { PuppeteerPdfService } from './puppeteer-pdf.service';

// Datos del firmante (pueden ser configurables más adelante)
const FIRMANTE_NOMBRE = 'Vanessa Marquez Tejera';
const FIRMANTE_CARGO = 'Coordinadora de Gestión Humana';

// Nombres de las plantillas de certificado
const CERT_CON_SUELDO_TEMPLATE = 'plantilla_certificado_con_sueldo_sin_funciones.hbs';
const CERT_SIN_SUELDO_TEMPLATE = 'plantilla_certificado_sin_sueldo_sin_funciones.hbs';
const CERTIFICATE_EMAIL_TEMPLATE = 'email/certificate_dispatch_email.hbs';

// Rutas relativas a imágenes para pasar a la plantilla del certificado
// Se asume que la carpeta 'assets' está en la raíz del proyecto.
const HEADER_IMAGE_PATH_RELATIVE = 'assets/images/image2.jpg';
const FOOTER_IMAGE_PATH_RELATIVE = 'assets/images/image1.jpg';
const FIRMA_IMAGE_PATH_RELATIVE = 'assets/images/firma.png';
const LOGO_OMP_PATH_RELATIVE = 'assets/images/logo.png';

@Injectable()
export class NodemailerEmailService implements IEmailService {
  private readonly logger = new Logger(NodemailerEmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly templateService: TemplateService, // Inyectado
    private readonly puppeteerPdfService: PuppeteerPdfService, // Inyectado
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const config = getEmailConfig();
    
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    this.logger.log(`Email service initialized with host: ${config.host}`);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const config = getEmailConfig();
      
      const mailOptions = {
        from: config.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully to ${options.to}. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  private getFormattedCertificateDates(): {
    diasCertificacionTexto: string;
    diaCertificacion: number;
    mesCertificacion: string;
    anioCertificacionTexto: string;
    anioCertificacion: number;
    currentDateFormatted: string;
  } {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    const numeroATextoSimple = (num: number): string => {
        const especiales = {
            1: "un", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco", 6: "seis", 7: "siete", 8: "ocho", 9: "nueve",
            10: "diez", 11: "once", 12: "doce", 13: "trece", 14: "catorce", 15: "quince", 16: "dieciséis",
            17: "diecisiete", 18: "dieciocho", 19: "diecinueve", 20: "veinte", 21: "veintiún", 22: "veintidós",
            23: "veintitrés", 24: "veinticuatro", 25: "veinticinco", 26: "veintiséis", 27: "veintisiete",
            28: "veintiocho", 29: "veintinueve", 30: "treinta", 31: "treinta y un"
        };
        return especiales[num] || num.toString();
    };

    const anioATextoSimple = (num: number): string => {
        if (num === 2023) return "Dos Mil Veintitrés";
        if (num === 2024) return "Dos Mil Veinticuatro";
        if (num === 2025) return "Dos Mil Veinticinco";
        return num.toString();
    };

    return {
      diasCertificacionTexto: numeroATextoSimple(day),
      diaCertificacion: day,
      mesCertificacion: meses[month],
      anioCertificacionTexto: anioATextoSimple(year),
      anioCertificacion: year,
      currentDateFormatted: `${day}/${month + 1}/${year}`,
    };
  }

  // Función auxiliar para formatear el número de documento
  private formatDocumentNumber(documentNumber: string): string {
    if (!documentNumber) return '';
    const numStr = String(documentNumber).replace(/\D/g, ''); // Eliminar no dígitos por si acaso
    if (numStr.length <= 3) return numStr;
    
    let formattedNum = '';
    let counter = 0;
    for (let i = numStr.length - 1; i >= 0; i--) {
      formattedNum = numStr[i] + formattedNum;
      counter++;
      if (counter === 3 && i !== 0) {
        formattedNum = '.' + formattedNum;
        counter = 0;
      }
    }
    return formattedNum;
  }

  async sendCertificateEmail(to: string, clientData: TClient, certificateType: string, chatTranscription: string): Promise<boolean> {
    let tempPdfFilePath: string | null = null;
    // Determinar la plantilla de certificado a usar
    // Asumo que certificateType será 'con_sueldo' o 'sin_sueldo'. Ajustar si es diferente.
    const certificateTemplateName = certificateType.toLowerCase().includes('sin_sueldo') 
      ? CERT_SIN_SUELDO_TEMPLATE 
      : CERT_CON_SUELDO_TEMPLATE;
    
    this.logger.log(`Selected certificate template: ${certificateTemplateName}`);

    try {
      const { 
        diasCertificacionTexto, 
        diaCertificacion, 
        mesCertificacion, 
        anioCertificacionTexto, 
        anioCertificacion,
        currentDateFormatted
      } = this.getFormattedCertificateDates();
      
      const currentTime = new Date().toLocaleTimeString('es-CO');
      const projectRootDir = path.resolve(__dirname, '../../../../'); // Raíz del proyecto

      // Construir rutas absolutas file:/// para las imágenes
      const headerImagePathAbsolute = `file:///${path.resolve(projectRootDir, HEADER_IMAGE_PATH_RELATIVE).replace(/\\/g, '/')}`;
      const footerImagePathAbsolute = `file:///${path.resolve(projectRootDir, FOOTER_IMAGE_PATH_RELATIVE).replace(/\\/g, '/')}`;
      const firmaImagePathAbsolute = `file:///${path.resolve(projectRootDir, FIRMA_IMAGE_PATH_RELATIVE).replace(/\\/g, '/')}`;
      const logoOmpAbsolutePath = path.resolve(projectRootDir, LOGO_OMP_PATH_RELATIVE);

      // Aplicar transformaciones a los datos del cliente
      const formattedClientData = {
        ...clientData,
        name: clientData.name ? clientData.name.toUpperCase() : '',
        documentNumber: this.formatDocumentNumber(clientData.documentNumber),
      };

      const certificatePdfData = {
        ...formattedClientData,
        daysCertificationText: diasCertificacionTexto,
        dayCertification: diaCertificacion,
        monthCertification: mesCertificacion,
        yearCertificationText: anioCertificacionTexto,
        yearCertification: anioCertificacion,
        nameFirmante: FIRMANTE_NOMBRE,
        positionFirmante: FIRMANTE_CARGO,
        // Rutas de imágenes para la plantilla del certificado
        headerPath: headerImagePathAbsolute,
        footerPath: footerImagePathAbsolute,
        firmaPath: firmaImagePathAbsolute,
      };
      
      this.logger.log('Generating certificate HTML content...');
      this.logger.debug('Certificate PDF data (transformed):', JSON.stringify(certificatePdfData, null, 2));
      const certificateHtmlContent = await this.templateService.compileCertificateTemplate(
        certificateTemplateName,
        certificatePdfData
      );

      this.logger.log('Generating certificate PDF file with PuppeteerService...');
      tempPdfFilePath = await this.puppeteerPdfService.generatePdfFromHtml(certificateHtmlContent);
      this.logger.log(`Certificate PDF generated successfully at: ${tempPdfFilePath}`);
      
      const transcriptionTxt = this.generateTranscriptionFile(chatTranscription, currentDateFormatted, currentTime);
      
      const emailHtmlData = {
        clientName: clientData.name,
        certificateTypeDescription: certificateType.toLowerCase().includes('sin_sueldo') ? 'sin detalle de sueldo' : 'con detalle de sueldo',
        documentInfo: `${clientData.documentType} ${formattedClientData.documentNumber}`,
        generationDate: currentDateFormatted,
        generationTime: currentTime,
        currentYear: new Date().getFullYear(),
      };
      const htmlEmailContent = await this.templateService.compileTemplate(CERTIFICATE_EMAIL_TEMPLATE, emailHtmlData);

      const emailOptions: EmailOptions = {
        to,
        subject: `Certificado Laboral - ${clientData.name} - ${currentDateFormatted}`,
        html: htmlEmailContent,
        attachments: [
          {
            filename: `Certificado_Laboral_${clientData.name.replace(/\s+/g, '_')}_${currentDateFormatted.replace(/\//g, '-')}.pdf`,
            path: tempPdfFilePath,
            contentType: 'application/pdf'
          },
          {
            filename: `Transcripcion_Chat_${currentDateFormatted.replace(/\//g, '-')}.txt`,
            content: transcriptionTxt,
            contentType: 'text/plain'
          },
          {
            filename: 'logo-omp.png',
            path: logoOmpAbsolutePath,
            cid: 'logo_omp_cert@ompabogados.com'
          }
        ]
      };

      const emailSent = await this.sendEmail(emailOptions);
      return emailSent;

    } catch (error) {
      this.logger.error(`Failed to send certificate email to ${to}:`, error);
      return false;
    } finally {
      if (tempPdfFilePath) {
        try {
          await fs.unlink(tempPdfFilePath);
          this.logger.log(`Temporary PDF file ${tempPdfFilePath} deleted successfully.`);
        } catch (e) {
          this.logger.error(`Failed to delete temporary PDF file ${tempPdfFilePath}:`, e);
        }
      }
    }
  }

  private generateTranscriptionFile(chatTranscription: string, date: string, time: string): Buffer {
    const transcriptionContent = `
TRANSCRIPCIÓN DE CONVERSACIÓN - SISTEMA DE CERTIFICADOS LABORALES

Fecha: ${date}
Hora: ${time}

=== INICIO DE CONVERSACIÓN ===

${chatTranscription}

=== FIN DE CONVERSACIÓN ===

Este archivo contiene la transcripción completa de la conversación 
mantenida con el sistema automatizado de certificados laborales.

Generado automáticamente el ${date} a las ${time}
    `;
    return Buffer.from(transcriptionContent, 'utf-8');
  }
} 