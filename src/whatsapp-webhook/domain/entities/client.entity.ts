import { DocumentType } from './session.entity';

export type TClient = {
  id: string;
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  cityDocument: string;
  position: string;
  startDate: string;
  salaryInLetters: string;
  salaryFormatCurrency: string;
  email?: string;
  phone?: string;
}

export class Client {
  /**
   * 
   * @param id 
   * @param name 
   * @param documentType 
   * @param documentNumber 
   * @param cityDocument 
   * @param position 
   * @param startDate 
   * @param salaryInLetters 
   * @param salaryFormatCurrency 
   * @param email
   * @param phone 
   */
  public readonly id: string;
  public readonly name: string;
  public readonly documentType: DocumentType;
  public readonly documentNumber: string;
  public readonly cityDocument: string;
  public readonly position: string;
  public readonly startDate: string;
  public readonly salaryInLetters: string;
  public readonly salaryFormatCurrency: string;
  public readonly email?: string;
  public readonly phone?: string;

  constructor(client: TClient) {
    this.id = client.id;
    this.name = client.name;
    this.documentType = client.documentType;
    this.documentNumber = client.documentNumber;
    this.cityDocument = client.cityDocument;
    this.position = client.position;
    this.startDate = client.startDate;
    this.salaryInLetters = client.salaryInLetters;
    this.salaryFormatCurrency = client.salaryFormatCurrency;
    this.email = client.email;
    this.phone = client.phone;
  }
} 