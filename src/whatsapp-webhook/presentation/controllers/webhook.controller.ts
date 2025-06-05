import { Controller, Post, Get, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { VerifyTokenGuard } from '../guards/verify-token.guard';
import { HandleIncomingMessageUseCase } from 'src/whatsapp-webhook/application';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly handleMessage: HandleIncomingMessageUseCase) {}

  @Post()
  @HttpCode(200)
  @UseGuards(VerifyTokenGuard)
  async receive(@Body() dto: any) {
    await this.handleMessage.execute(dto);
  }

  @Get()
  @UseGuards(VerifyTokenGuard)
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return challenge;
  }
}
