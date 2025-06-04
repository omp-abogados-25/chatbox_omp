import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class VerifyTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.method === 'GET') {
      const mode = request.query['hub.mode'];
      const token = request.query['hub.verify_token'];

      if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        return true;
      }
      throw new ForbiddenException('Invalid verify token');
    }

    return true;
  }
}
