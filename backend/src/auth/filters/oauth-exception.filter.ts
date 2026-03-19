import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class OAuthExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
}
