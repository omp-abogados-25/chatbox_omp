import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class Api2PdfService {
    private readonly logger = new Logger(Api2PdfService.name);
    private readonly apiKey: string;
    private readonly apiBaseUrl = 'https://v2.api2pdf.com';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.apiKey = this.configService.get<string>('API2PDF_KEY');
        if (!this.apiKey) {
            this.logger.error('API2PDF_KEY is not configured in the environment variables. PDF generation will fail.');
            throw new Error('API2PDF_KEY is not configured in the environment variables.');
        }
    }

    async generatePdfFromHtml(htmlContent: string): Promise<string> {
        const projectRootDir = path.resolve(__dirname, '../../../../');
        const tempWorkingDir = path.resolve(projectRootDir, 'temp_pdf_generation');

        try {
            await fs.mkdir(tempWorkingDir, { recursive: true });
        } catch (e) {
            this.logger.warn(`Could not create temp directory: ${e.message}`);
        }

        const tempPdfPath = path.resolve(tempWorkingDir, `_temp_cert_pdf_${Date.now()}.pdf`);

        try {
            const requestConfig: AxiosRequestConfig = {
                headers: { 'Authorization': this.apiKey },
            };
            const payload = {
                html: htmlContent,
                options: {
                    delay: 1000,
                    width: 10.11,
                    height: 15.5,
                    marginTop: 0,
                    marginBottom: 0,
                    marginLeft: 0,
                    marginRight: 0,
                    printBackground: true,
                    preferCSSPageSize: true,
                    displayHeaderFooter: false,
                    scale: 1.0,
                },
            };

            const response: AxiosResponse<{ pdf: string, success: boolean, error?: string }> = await firstValueFrom(
                this.httpService.post(`${this.apiBaseUrl}/chrome/html`, payload, requestConfig),
            );

            if (!response.data.success || !response.data.pdf) {
                throw new Error(response.data.error || 'Failed to generate PDF via api2pdf.com');
            }

            const pdfDownloadResponse: AxiosResponse<ArrayBuffer> = await firstValueFrom(
                this.httpService.get(response.data.pdf, { responseType: 'arraybuffer' })
            );

            // Convert ArrayBuffer to a Node.js Buffer before writing
            const pdfBuffer = Buffer.from(pdfDownloadResponse.data);
            await fs.writeFile(tempPdfPath, pdfBuffer);
            return tempPdfPath;
        } catch (error) {
            this.logger.error('Error during PDF generation with api2pdf.com:', error.response?.data || error.message);
            throw error;
        }
    }
} 