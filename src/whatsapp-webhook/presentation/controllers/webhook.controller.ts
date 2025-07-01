import { Controller, Post, Get, Body, Query, UseGuards, HttpCode, Logger } from '@nestjs/common';
import { VerifyTokenGuard } from '../guards/verify-token.guard';
import { HandleIncomingMessageUseCase } from 'src/whatsapp-webhook/application';
import { Public } from 'src/modules/auth';

@Controller('webhook')
@Public()
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly handleMessage: HandleIncomingMessageUseCase
  ) {}

  @Post()
  @HttpCode(200)
  async receive(@Body() dto: any) {
    await this.handleMessage.execute(dto);
  }

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    this.logger.log(`[WebhookController] -> Received verification request from WhatsApp Webhook`);
    return challenge;
  }
}
