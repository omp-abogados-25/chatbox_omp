import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { IWhatsappClient } from '../../domain';

@Injectable()
export class WhatsappClient implements IWhatsappClient {
  private readonly token = process.env.GRAPH_API_TOKEN;
  private readonly apiVersion = process.env.API_VERSION;
  private readonly businessPhoneNumberId = process.env.BUSINESS_PHONE;

  async sendMessage(payload: any) {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.businessPhoneNumberId}/messages`;
    return axios.post(url, payload, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }
}
