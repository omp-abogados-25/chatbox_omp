import { TClient } from "../entities";

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  cid?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<boolean>;
  sendCertificateEmail(
    to: string,
    clientData: TClient,
    certificateType: string,
    chatTranscription: string,
    functionCategories?: Array<{ categoryName: string; functions: string[] }>,
  ): Promise<boolean>;
} 