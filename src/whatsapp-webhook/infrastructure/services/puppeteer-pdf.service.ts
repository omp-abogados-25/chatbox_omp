import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PuppeteerPdfService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PuppeteerPdfService.name);
    private browser: puppeteer.Browser | null = null;

    /**
     * Launches a persistent browser instance when the module is initialized.
     * This avoids the costly operation of starting a new browser for every PDF.
     */
    async onModuleInit() {
        await this.initializeBrowser();
    }

    /**
     * Gracefully closes the browser instance when the application shuts down.
     */
    async onModuleDestroy() {
        if (this.browser) {
            await this.browser.close();
            this.logger.log('Persistent Puppeteer browser instance closed.');
        }
    }

    private async initializeBrowser() {
        this.logger.log('Initializing persistent Puppeteer browser instance...');
        try {
            this.browser = await puppeteer.launch({
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-zygote',
                ],
                headless: true,
                timeout: 180000,
            });

            this.browser.on('disconnected', () => {
                this.logger.error('Browser disconnected. This may be due to a crash. Attempting to relaunch...');
                this.browser = null; // Clear the dead instance
                this.initializeBrowser(); // Relaunch the browser
            });

            this.logger.log('Persistent Puppeteer browser instance initialized successfully.');
        } catch (error) {
            this.logger.error('Failed to initialize persistent Puppeteer browser instance. The application may not be able to generate PDFs.', error);
            // We don't re-throw here, to allow the app to start. The service will be non-functional until browser reconnects.
            this.browser = null; 
        }
    }

    /**
     * Generates a PDF from HTML content using the single, persistent browser instance.
     * This method now only creates a new page, which is significantly faster.
     */
    async generatePdfFromHtml(
        htmlContent: string,
        pdfOptions: Omit<puppeteer.PDFOptions, 'path'> = {},
    ): Promise<string> {
        if (!this.browser) {
            this.logger.error('Browser instance is not available. PDF generation failed. Waiting for relaunch...');
            throw new Error('Puppeteer browser instance not initialized. Cannot generate PDF.');
        }

        const projectRootDir = path.resolve(__dirname, '../../../../');
        const tempWorkingDir = path.resolve(projectRootDir, 'temp_pdf_generation');

        try {
            await fs.mkdir(tempWorkingDir, { recursive: true });
        } catch (e) {
            this.logger.warn(`Could not create temp directory ${tempWorkingDir} (may already exist): ${e.message}`);
        }

        const tempHtmlPath = path.resolve(tempWorkingDir, `_temp_cert_html_${Date.now()}.html`);
        const tempPdfPath = path.resolve(tempWorkingDir, `_temp_cert_pdf_${Date.now()}.pdf`);

        await fs.writeFile(tempHtmlPath, htmlContent);

        let page: puppeteer.Page | null = null;
        try {
            // Create a new page in the existing browser - this is very fast.
            page = await this.browser.newPage();
            page.on('console', (msg) => this.logger.log(`Puppeteer Page Console: ${msg.text()}`));
            page.on('pageerror', (err) => this.logger.error(`Puppeteer Page Error: ${err.toString()}`));

            const pageUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
            
            await page.goto(pageUrl, { waitUntil: 'networkidle0', timeout: 60000 });

            this.logger.log('Page loaded, generating PDF...');
            await page.pdf({
                path: tempPdfPath,
                format: 'Letter',
                printBackground: true,
                ...pdfOptions,
            });
            
            this.logger.log(`PDF generated at: ${tempPdfPath}`);
            return tempPdfPath;
        } catch (error) {
            this.logger.error('Error during PDF page processing:', error);
            throw error;
        } finally {
            // Close the page, but leave the browser open for the next request.
            if (page) {
                await page.close();
            }
            try {
                await fs.unlink(tempHtmlPath);
            } catch (e) {
                this.logger.warn(`Could not delete temporary HTML file ${tempHtmlPath}: ${e.message}`);
            }
        }
    }
} 