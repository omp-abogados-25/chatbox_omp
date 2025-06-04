import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  async compileTemplate(
    templateName: string, // e.g., 'certificate_dispatch_email.hbs' or 'plantilla_certificado_con_sueldo_sin_funciones.hbs'
    data: any,
    templateBaseDir: string = 'assets/templates' // Default base directory for templates
  ): Promise<string> {
    const projectRootDir = path.resolve(__dirname, '../../../../'); // Adjust based on actual depth
    const templatePath = path.resolve(projectRootDir, templateBaseDir, templateName);

    this.logger.log(`Compiling template: ${templatePath}`);
    try {
      const templateSrc = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = Handlebars.compile(templateSrc);
      const htmlContent = compiledTemplate(data);
      this.logger.log(`Template ${templateName} compiled successfully.`);
      return htmlContent;
    } catch (error) {
      this.logger.error(`Error compiling template ${templateName}:`, error);
      throw new Error(`Could not compile template ${templateName}: ${error.message}`);
    }
  }

  // Specialized method for certificate templates that need font path replacement
  async compileCertificateTemplate(
    templateName: string,
    data: any,
    fontsDirRelative: string = 'assets/fonts',
    templateBaseDir: string = 'assets/templates'
  ): Promise<string> {
    const projectRootDir = path.resolve(__dirname, '../../../../');
    const templatePath = path.resolve(projectRootDir, templateBaseDir, templateName);
    const fontsDirAbsolute = `file:///${path.resolve(projectRootDir, fontsDirRelative).replace(/\\/g, '/')}`;

    this.logger.log(`Compiling certificate template: ${templatePath}`);
    this.logger.debug(`Fonts directory for template ${templateName}: ${fontsDirAbsolute}`);

    try {
      let tplSrc = await fs.readFile(templatePath, 'utf8');
      // Replace font paths like url('fonts/...) or url("fonts/...)
      tplSrc = tplSrc.replace(/url\((['"]?)fonts\//g, `url($1${fontsDirAbsolute}/`);
      
      const compiledTemplate = Handlebars.compile(tplSrc);
      const htmlContent = compiledTemplate(data);
      this.logger.log(`Certificate template ${templateName} compiled successfully with font paths adjusted.`);
      return htmlContent;
    } catch (error) {
      this.logger.error(`Error compiling certificate template ${templateName}:`, error);
      throw new Error(`Could not compile certificate template ${templateName}: ${error.message}`);
    }
  }
} 