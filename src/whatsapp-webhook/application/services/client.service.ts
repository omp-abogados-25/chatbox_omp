import { Injectable } from '@nestjs/common';
import { Client, DocumentType, TClient } from '../../domain/entities';

@Injectable()
export class ClientService {

  private readonly clientsArray: TClient[] = [
    {
      id: '1',
      name: 'Juan Carlos Pérez',
      documentType: DocumentType.CC,
      documentNumber: '123456789',
      cityDocument: 'Barranquilla',
      position: 'Coordinador de Innovación Legal y Asuntos Corporativos',
      startDate: '12 de Septiembre de 2022',
      salaryInLetters: 'Tres millones trescientos noventa y tres mil seiscientos pesos',
      salaryFormatCurrency: '$3.393.600',
      email: 'deiverolivares2@gmail.com',
      phone: '573001234567',
    },
    {
      id: '2',
      name: 'Roberto Morales',
      documentType: DocumentType.CC,
      documentNumber: '1143425157',
      cityDocument: 'Barranquilla',
      position: 'Coordinador de Innovación Legal y Asuntos Corporativos',
      startDate: '12 de Septiembre de 2022',
      salaryInLetters: 'Tres millones trescientos noventa y tres mil seiscientos pesos',
      salaryFormatCurrency: '$3.393.600',
      email: 'roberto@morales.com.co',
      phone: '573007654321',
    }
  ]

  private  readonly clients: Client[] = [new Client(this.clientsArray[0]), new Client(this.clientsArray[1])];

  findByDocument(documentType: DocumentType, documentNumber: string): Client | undefined {
    return this.clients.find(
      client => client.documentType === documentType && client.documentNumber === documentNumber
    );
  }

  /**
   * Busca clientes por número de documento sin especificar tipo
   * Retorna array de clientes que coinciden con el número
   */
  findByDocumentNumber(documentNumber: string): Client[] {
    return this.clients.filter(client => client.documentNumber === documentNumber);
  }

  /**
   * Busca un cliente por número de documento
   * Si hay múltiples coincidencias, retorna null (requiere especificar tipo)
   * Si hay una sola coincidencia, la retorna
   * Si no hay coincidencias, retorna undefined
   */
  findUniqueByDocumentNumber(documentNumber: string): Client | null | undefined {
    const matches = this.findByDocumentNumber(documentNumber);
    
    if (matches.length === 0) {
      return undefined; // No encontrado
    } else if (matches.length === 1) {
      return matches[0]; // Único resultado
    } else {
      return null; // Múltiples coincidencias - requiere especificar tipo
    }
  }

  getAllClients(): Client[] {
    return [...this.clients];
  }

  getRandomWelcomeMessage(): string {
    const messages = [
      '¡Hola! 👋 Parece que no tienes una cuenta registrada con nosotros.',
      '¡Bienvenido! 🌟 No encontramos tu información en nuestro sistema.',
      '¡Saludos! 😊 Tu documento no está registrado en nuestra base de datos.',
      '¡Hola! 🤝 No pudimos encontrar tu información de cliente.',
      '¡Bienvenido! 🎉 Parece que eres nuevo por aquí.',
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
} 