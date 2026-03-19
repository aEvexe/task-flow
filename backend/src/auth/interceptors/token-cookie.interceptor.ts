import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Response } from 'express';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
};

@Injectable()
export class TokenCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (data?.accessToken) {
          res.cookie('accessToken', data.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
          });
        }
        if (data?.refreshToken) {
          res.cookie('refreshToken', data.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          });
        }
        // Remove tokens from response body — they're in cookies now
        if (data?.accessToken || data?.refreshToken) {
          const { accessToken, refreshToken, ...rest } = data;
          return rest;
        }
        return data;
      }),
    );
  }
}
