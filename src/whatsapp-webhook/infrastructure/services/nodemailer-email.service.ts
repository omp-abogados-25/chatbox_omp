import { Injectable, Logger, Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailService, EmailOptions } from '../../domain/interfaces/email.interface';
import { getEmailConfig } from '../config/email.config';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { TClient } from 'src/whatsapp-webhook/domain';



import { TemplateService } from './template.service';
import { Api2PdfService } from './api2pdf.service';

// Firmante por defecto (para la mayoría de certificados)
const FIRMANTE_NOMBRE_DEFAULT = 'Vanessa Marquez Tejera';
const FIRMANTE_CARGO_DEFAULT = 'Coordinadora de Gestión Humana';
const FIRMA_IMAGE_PATH_DEFAULT = 'assets/images/firma.png';

// Firmante alternativo (cuando el certificado es para la gerente de RRHH)
const FIRMANTE_NOMBRE_ALTERNATIVO = 'Andrea Paola Sanchez Rueda';
const FIRMANTE_CARGO_ALTERNATIVO = 'Directora Comercial y Financiera';
const FIRMA_IMAGE_PATH_ALTERNATIVO = 'assets/images/firma2.png';

// Documento de la gerente de RRHH que no puede firmarse a sí misma
const DOCUMENTO_GERENTE_RRHH = '1140851923';

const CERT_CON_SUELDO_TEMPLATE = 'plantilla_certificado_con_sueldo_sin_funciones.hbs';
const CERT_SIN_SUELDO_TEMPLATE = 'plantilla_certificado_sin_sueldo_sin_funciones.hbs';
const CERT_CON_FUNCIONES_TEMPLATE = 'con_funciones.hbs'; 
const CERT_CON_FUNCIONES_CON_SUELDO_TEMPLATE = 'con_funciones_con_sueldo.hbs'; 
const CERTIFICATE_CONTENT_PROSE_TEMPLATE = 'partials/certificate_content_prose.hbs';
const REPEATING_PAGE_SHELL_TEMPLATE = 'repeating_page_shell.hbs';
const CERTIFICATE_EMAIL_TEMPLATE = 'email/certificate_dispatch_email.hbs';

const HEADER_IMAGE_PATH_RELATIVE = 'assets/images/image2.jpg';
const FOOTER_IMAGE_PATH_RELATIVE = 'assets/images/image1.jpg';
const LOGO_OMP_PATH_RELATIVE = 'assets/images/logo.png';

@Injectable()
export class NodemailerEmailService implements IEmailService {
  private readonly logger = new Logger(NodemailerEmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly templateService: TemplateService, 
    private readonly pdfService: Api2PdfService, 
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
  }

  /**
   * Obtiene la forma correcta de "identificado/a" basado en el género del usuario
   */
  private getGenderIdentification(gender: string): string {
    
    // Normalizar el valor del gender (eliminar espacios, convertir a mayúscula)
    const normalizedGender = String(gender || 'M').trim().toUpperCase();
    
    // F = Femenino, M = Masculino
    const result = normalizedGender === 'F' ? 'identificada' : 'identificado';
    
    
    return result;
  }

  private getLinkedGender(gender: string): string {
    // Normalizar el valor del gender (eliminar espacios, convertir a mayúscula)
    const normalizedGender = String(gender || 'M').trim().toUpperCase();
    
    // F = Femenino, M = Masculino
    const result = normalizedGender === 'F' ? 'vinculada' : 'vinculado';
    return result;
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
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}. Message: ${error.message}`, error.stack);
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

  private formatDocumentNumber(documentNumber: string): string {
    if (!documentNumber) return '';
    const numStr = String(documentNumber).replace(/\D/g, ''); 
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

  private formatDateToText(dateString: string | null | undefined): string {
    if (!dateString) {
      this.logger.warn('[NodemailerEmailService] formatDateToText recibió una fecha nula o indefinida.');
      return 'FECHA NO ESPECIFICADA';
    }
    try {
      const date = new Date(dateString + 'T00:00:00');

      if (isNaN(date.getTime())) {
        this.logger.warn(`[NodemailerEmailService] La fecha '${dateString}' no pudo ser parseada correctamente.`);
        return dateString; 
      }

      const day = date.getDate();
      const monthIndex = date.getMonth();
      const year = date.getFullYear();

      const monthNames = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];

      return `${day} de ${monthNames[monthIndex]} de ${year}`;
    } catch (error) {
      this.logger.error(`[NodemailerEmailService] Error formateando la fecha '${dateString}':`, error);
      return dateString; 
    }
  }

  /**
   * Determina qué firmante usar basado en el documento del cliente
   * @param clientDocumentNumber - Número de documento del cliente
   * @returns Objeto con los datos del firmante a usar
   */
  private getSignerData(clientDocumentNumber: string): {
    nombre: string;
    cargo: string;
    imagePath: string;
  } {
    // Limpiar el número de documento (remover puntos, espacios, etc.)
    const cleanDocumentNumber = clientDocumentNumber.replace(/[.\s-]/g, '');
    
    // Si es el documento de la gerente de RRHH, usar firmante alternativo
    if (cleanDocumentNumber === DOCUMENTO_GERENTE_RRHH) {
      this.logger.log(`Certificado para gerente de RRHH (${clientDocumentNumber}). Usando firmante alternativo: ${FIRMANTE_NOMBRE_ALTERNATIVO}`);
      return {
        nombre: FIRMANTE_NOMBRE_ALTERNATIVO,
        cargo: FIRMANTE_CARGO_ALTERNATIVO,
        imagePath: FIRMA_IMAGE_PATH_ALTERNATIVO
      };
    }
    
    // Para todos los demás casos, usar firmante por defecto
    return {
      nombre: FIRMANTE_NOMBRE_DEFAULT,
      cargo: FIRMANTE_CARGO_DEFAULT,
      imagePath: FIRMA_IMAGE_PATH_DEFAULT
    };
  }

  async sendCertificateEmail(
    to: string, 
    clientData: TClient, 
    certificateType: string, 
    chatTranscription: string,
    functionCategories?: Array<{ categoryName: string; functions: string[] }>,
  ): Promise<boolean> {
    let tempPdfFilePath: string | null = null;
    try {
      const {
        diasCertificacionTexto,
        diaCertificacion,
        mesCertificacion,
        anioCertificacionTexto,
        anioCertificacion,
        currentDateFormatted
      } = this.getFormattedCertificateDates();
      
      // Obtener identificación de género desde los datos del cliente
      const isIdentified: string = this.getGenderIdentification(clientData.gender || 'M');
      const isLinked: string = this.getLinkedGender(clientData.gender || 'M');
      
      // Determinar qué firmante usar basado en el documento del cliente
      const signerData = this.getSignerData(clientData.documentNumber);
      
      const currentTime = new Date().toLocaleTimeString('es-CO');
      const projectRootDir = path.resolve(__dirname, '../../../../');
      
      const headerImageFileUrl = `file:///${path.resolve(projectRootDir, HEADER_IMAGE_PATH_RELATIVE).replace(/\\/g, '/')}`;
      const footerImageFileUrl = `file:///${path.resolve(projectRootDir, FOOTER_IMAGE_PATH_RELATIVE).replace(/\\/g, '/')}`;
      const firmaImageFileUrl = `file:///${path.resolve(projectRootDir, signerData.imagePath).replace(/\\/g, '/')}`;
      const logoOmpForEmailPath = path.resolve(projectRootDir, LOGO_OMP_PATH_RELATIVE);

      const formattedClientData = {
        ...clientData,
        name: clientData.name ? clientData.name.toUpperCase() : '',
        documentNumber: this.formatDocumentNumber(clientData.documentNumber),
        startDate: this.formatDateToText(clientData.startDate),
      };

      let finalHtmlForPdf = '';

      const isConFuncionesType = certificateType.toLowerCase().includes('con_funciones');
      const isConSueldoType = certificateType.toLowerCase().includes('con_sueldo');

      if (isConFuncionesType) {
        let plantillaSeleccionada = CERT_CON_FUNCIONES_TEMPLATE; 
        if (isConSueldoType) {
          plantillaSeleccionada = CERT_CON_FUNCIONES_CON_SUELDO_TEMPLATE; 
        }

        const templateDataForConFunciones = {
          ...formattedClientData,
          daysCertificationText: diasCertificacionTexto,
          dayCertification: diaCertificacion,
          monthCertification: mesCertificacion,
          yearCertificationText: anioCertificacionTexto,
          yearCertification: anioCertificacion,
          startDate: formattedClientData.startDate,
          cityDocument: clientData.cityDocument,
          ...(isConSueldoType ? { 
              salaryInLetters: (clientData as any).salaryInLetters, 
              salaryFormatCurrency: (clientData as any).salaryFormatCurrency,
              transportationAllowanceInLetters: (clientData as any).transportationAllowanceInLetters,
              transportationAllowanceFormatCurrency: (clientData as any).transportationAllowanceFormatCurrency
          } : {}),
          headerImageFileUrl: headerImageFileUrl,
          footerImageFileUrl: footerImageFileUrl,
          firmaImageFileUrl: firmaImageFileUrl,
          nameFirmante: signerData.nombre,
          positionFirmante: signerData.cargo,
          functionCategories: functionCategories,
          // Información de género
          isIdentified: isIdentified,
          isLinked: isLinked,
        };


        finalHtmlForPdf = await this.templateService.compileCertificateTemplate(
          plantillaSeleccionada,
          templateDataForConFunciones,
          'assets/templates'
        );

      } else { 
        let plantillaSeleccionada = CERT_SIN_SUELDO_TEMPLATE; 
        if (isConSueldoType) {
          plantillaSeleccionada = CERT_CON_SUELDO_TEMPLATE; 
        }
        
        const templateDataSinFunciones = {
          ...formattedClientData,
          daysCertificationText: diasCertificacionTexto,
          dayCertification: diaCertificacion,
          monthCertification: mesCertificacion,
          yearCertificationText: anioCertificacionTexto,
          yearCertification: anioCertificacion,
          startDate: formattedClientData.startDate,
          cityDocument: clientData.cityDocument,
          ...(isConSueldoType ? { 
              salaryInLetters: (clientData as any).salaryInLetters, 
              salaryFormatCurrency: (clientData as any).salaryFormatCurrency,
              transportationAllowanceInLetters: (clientData as any).transportationAllowanceInLetters,
              transportationAllowanceFormatCurrency: (clientData as any).transportationAllowanceFormatCurrency
          } : {}),
          headerImageFileUrl: headerImageFileUrl,
          footerImageFileUrl: footerImageFileUrl,
          firmaImageFileUrl: firmaImageFileUrl,
          nameFirmante: signerData.nombre,
          positionFirmante: signerData.cargo,
          // Información de género
          isIdentified: isIdentified,
          isLinked: isLinked,
        };
        
        
        finalHtmlForPdf = await this.templateService.compileCertificateTemplate(
          plantillaSeleccionada,
          templateDataSinFunciones,
          'assets/templates'
        );
      }

      if (!finalHtmlForPdf) {
        this.logger.error('HTML for certificate compilation is empty.');
        return false;
      }
      tempPdfFilePath = await this.pdfService.generatePdfFromHtml(
        finalHtmlForPdf
      );
      
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
            path: logoOmpForEmailPath, 
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