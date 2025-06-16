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
    // These two parameters are kept for compatibility but are no longer used directly
    _fontsDirRelative: string = 'assets/fonts', 
    templateBaseDir: string = 'assets/templates'
  ): Promise<string> {
    const projectRootDir = path.resolve(__dirname, '../../../../');
    const templatePath = path.resolve(projectRootDir, templateBaseDir, templateName);

    this.logger.log(`Compiling certificate template: ${templatePath}`);

    try {
      const templateSrc = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = Handlebars.compile(templateSrc);
      let htmlContent = compiledTemplate(data);
      this.logger.log(`Template ${templateName} compiled. Embedding local assets as Base64...`);

      // Regex to find all src/href attributes and url() values that are local
      const assetRegex = /(?:(src|href)=["']([^"']+)["'])|(?:url\((['"]?)([^"'\)]+)\3\))/g;

      const uniqueAssetPaths: string[] = [];
      for (const match of htmlContent.matchAll(assetRegex)) {
          const path = match[2] || match[4]; // Path from src/href or url()
          if (path && (path.startsWith('assets/') || path.startsWith('file:///'))) {
              if (!uniqueAssetPaths.includes(path)) {
                uniqueAssetPaths.push(path);
                this.logger.debug(`Encontrado asset para embeber: ${path}`);
              }
          }
      }

      this.logger.log(`Total de assets únicos encontrados: ${uniqueAssetPaths.length}`);
      uniqueAssetPaths.forEach(assetPath => {
        this.logger.debug(`Asset: ${assetPath}`);
      });

      const dataUrlMap = new Map<string, string>();
      await Promise.all(
          uniqueAssetPaths.map(async (assetPath) => {
              const dataUrl = await this.assetToDataUrl(assetPath, projectRootDir);
              dataUrlMap.set(assetPath, dataUrl);
          })
      );

      for (const [assetPath, dataUrl] of dataUrlMap.entries()) {
          // Escape special characters for use in RegExp
          const escapedPath = assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          htmlContent = htmlContent.replace(new RegExp(escapedPath, 'g'), dataUrl);
      }

      this.logger.log(`All local assets for ${templateName} embedded successfully.`);
      return htmlContent;

    } catch (error) {
      this.logger.error(`Error compiling certificate template ${templateName}:`, error);
      throw new Error(`Could not compile certificate template ${templateName}: ${error.message}`);
    }
  }

  private async assetToDataUrl(assetPath: string, projectRootDir: string): Promise<string> {
      let absoluteAssetPath: string;

      this.logger.debug(`Procesando asset: ${assetPath}`);

      if (assetPath.startsWith('file:///')) {
          const decodedPath = decodeURIComponent(assetPath);
          // Handle path differences between Windows and Linux
          if (process.platform === 'win32') {
              absoluteAssetPath = decodedPath.substring('file:///'.length).replace(/\//g, '\\');
          } else {
              absoluteAssetPath = '/' + decodedPath.substring('file:///'.length);
          }
          this.logger.debug(`Ruta absoluta desde file:/// : ${absoluteAssetPath}`);
      } else if (assetPath.startsWith('assets/')) {
          absoluteAssetPath = path.resolve(projectRootDir, assetPath);
          this.logger.debug(`Ruta absoluta desde assets/: ${absoluteAssetPath}`);
      } else {
          this.logger.debug(`Asset no procesable: ${assetPath}`);
          return assetPath; // Not a path we can process
      }

      try {
          this.logger.debug(`Intentando leer archivo: ${absoluteAssetPath}`);
          const fileData = await fs.readFile(absoluteAssetPath);
          const base64 = fileData.toString('base64');
          const ext = path.extname(absoluteAssetPath).substring(1).toLowerCase();
          
          const mimeTypes: Record<string, string> = {
              'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
              'gif': 'image/gif', 'svg': 'image/svg+xml', 'ttf': 'font/ttf',
              'woff': 'font/woff', 'woff2': 'font/woff2',
          };
          
          const mimeType = mimeTypes[ext];
          if (mimeType) {
              const dataUrl = `data:${mimeType};base64,${base64}`;
              this.logger.log(`Asset ${ext.toUpperCase()} embebido exitosamente: ${assetPath} (${Math.round(base64.length/1024)}KB)`);
              return dataUrl;
          }
          this.logger.warn(`Unsupported asset extension for embedding: ${ext} for path ${assetPath}`);
      } catch (error) {
          this.logger.error(`Failed to read and embed asset '${absoluteAssetPath}': ${error.message}`);
          this.logger.error(`Stack trace:`, error.stack);
      }

      return assetPath; // Return original path on error or if unsupported
  }
} 