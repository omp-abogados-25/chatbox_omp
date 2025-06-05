import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PuppeteerPdfService {
  private readonly logger = new Logger(PuppeteerPdfService.name);

  async generatePdfFromHtml(
    htmlContent: string,
    pdfOptions: Omit<puppeteer.PDFOptions, 'path'> = { format: 'Letter', printBackground: true, preferCSSPageSize: true },
    puppeteerLaunchArgs: string[] = [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        // '--single-process', // Consider re-adding if issues persist in some environments
        // '--no-zygote',
        // '--disable-gpu' // Headless defaults should handle this
    ],
    headerHtml?: string,
    footerHtml?: string,
    pageMargins?: puppeteer.PDFOptions['margin']
  ): Promise<string> { // Returns the path to the generated PDF
    const projectRootDir = path.resolve(__dirname, '../../../../'); // Adjust if necessary
    const tempWorkingDir = path.resolve(projectRootDir, 'temp_pdf_generation');
    
    try {
        await fs.mkdir(tempWorkingDir, { recursive: true });
    } catch (e) {
        this.logger.warn(`Could not create temp directory ${tempWorkingDir} (may already exist): ${e.message}`);
    }

    const tempHtmlPath = path.resolve(tempWorkingDir, `_temp_cert_html_${Date.now()}.html`);
    const tempPdfPath = path.resolve(tempWorkingDir, `_temp_cert_pdf_${Date.now()}.pdf`);

    await fs.writeFile(tempHtmlPath, htmlContent);
    this.logger.log(`Temporary HTML for PDF generation written to: ${tempHtmlPath}`);

    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        args: puppeteerLaunchArgs,
        headless: true, // Recommended to keep true for server-side generation
        timeout: 60000, // Browser launch timeout
      });
      this.logger.log('Puppeteer browser launched.');
      const page = await browser.newPage();

      page.on('pageerror', (err) => this.logger.error(`Puppeteer Page Error: ${err.toString()}`));
      page.on('console', (msg) => this.logger.log(`Puppeteer Page Console: ${msg.type().toUpperCase()} ${msg.text()}`));
      page.on('requestfailed', (request) => this.logger.error(`Puppeteer Request Failed: ${request.url()} ${request.failure()?.errorText}`));

      await page.emulateMediaType('screen');
      const pageUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
      this.logger.log(`Puppeteer navigating to: ${pageUrl}`);
      // Increased timeout for page.goto to 120 seconds for complex pages
      await page.goto(pageUrl, { waitUntil: 'load', timeout: 120000 }); 

      this.logger.log(`Attempting to generate PDF at: ${tempPdfPath}`);
      
      const finalPdfOptions: puppeteer.PDFOptions = {
        ...pdfOptions, 
        path: tempPdfPath,
        printBackground: pdfOptions.printBackground !== undefined ? pdfOptions.printBackground : true,
        preferCSSPageSize: pdfOptions.preferCSSPageSize !== undefined ? pdfOptions.preferCSSPageSize : true,
        timeout: pdfOptions.timeout || 90000, // Usar timeout de pdfOptions o default
      };

      // Solo añadir opciones de header/footer/margin si se proveen explícitamente
      if (headerHtml || footerHtml) {
        finalPdfOptions.headerTemplate = headerHtml || '<span></span>';
        finalPdfOptions.footerTemplate = footerHtml || '<span></span>';
        finalPdfOptions.displayHeaderFooter = true;
      } else {
        finalPdfOptions.displayHeaderFooter = false;
      }

      if (pageMargins) {
        finalPdfOptions.margin = pageMargins;
      } else if (finalPdfOptions.displayHeaderFooter) {
        // Si hay header/footer pero no márgenes, poner unos mínimos para evitar error
        this.logger.warn('Header/Footer HTML provided without explicit pageMargins. Using minimal default margins.')
        finalPdfOptions.margin = { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' };
      }
      // Si no hay displayHeaderFooter y no hay pageMargins, Puppeteer usará sus propios márgenes por defecto (usualmente pequeños).

      await page.pdf(finalPdfOptions);
      this.logger.log(`Temporary PDF generated at: ${tempPdfPath}. Header/Footer display: ${finalPdfOptions.displayHeaderFooter}`);
      
      return tempPdfPath;
    } catch (error) {
      this.logger.error('Error during PDF generation with Puppeteer:', error);
      if (browser) {
        const pages = await browser.pages();
        if (pages.length > 0 && !pages[0].isClosed()) {
          try {
            const pageContentOnError = await pages[0].content();
            this.logger.error('Page content on error:', pageContentOnError.substring(0, 500) + "...");
          } catch (contentError) {
            this.logger.error('Could not get page content on error:', contentError);
          }
        }
      }
      throw error;
    } finally {
      if (browser) {
        this.logger.log('Closing Puppeteer browser.');
        await browser.close();
      }
      try {
        await fs.unlink(tempHtmlPath);
        this.logger.log(`Temporary HTML file ${tempHtmlPath} deleted.`);
      } catch (e) {
        this.logger.warn(`Could not delete temporary HTML file ${tempHtmlPath}: ${e.message}`);
      }
      // Note: The temporary PDF file is NOT deleted here. 
      // The calling service is responsible for deleting it after use.
    }
  }
} 