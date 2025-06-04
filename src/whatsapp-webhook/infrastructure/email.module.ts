import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NodemailerEmailService } from './services/nodemailer-email.service';
import { MfaEmailService } from './services/mfa-email.service';
// No se usan directamente como tokens aquí si se usan strings
// import { IEmailService } from '../domain/interfaces/email.interface'; 
// import { IMfaEmailService } from '../domain/interfaces/mfa.interface';
import { TemplateService } from './services/template.service';
import { PuppeteerPdfService } from './services/puppeteer-pdf.service';

// Definiendo los providers de forma similar a tu ejemplo de repositorios
const emailServiceProviders = [
  NodemailerEmailService, // Proveedor directo de la clase concreta
  MfaEmailService,        // Proveedor directo de la clase concreta
  TemplateService,      // Proveedor directo
  PuppeteerPdfService,  // Proveedor directo
  {
    provide: 'IEmailService', // Token string para la interfaz
    useClass: NodemailerEmailService,
  },
  {
    provide: 'IMfaEmailService', // Token string para la interfaz
    useClass: MfaEmailService,
  },
];

@Module({
  imports: [ConfigModule], 
  providers: emailServiceProviders,
  exports: [
    'IEmailService',      // Exporta el token de la interfaz
    'IMfaEmailService',   // Exporta el token de la interfaz
    NodemailerEmailService, // También puedes exportar la clase concreta si se inyecta así en otros módulos
    MfaEmailService,        // También puedes exportar la clase concreta
    TemplateService,      
    PuppeteerPdfService,  
  ],
})
export class EmailModule {} 