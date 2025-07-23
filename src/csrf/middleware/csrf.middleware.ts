import {
  Injectable,
  type NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

interface RequestWithCustomCsrf extends Request {
  customCsrfToken?: string;
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: RequestWithCustomCsrf, res: Response, next: NextFunction) {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    const isWebSocket = req.headers.upgrade?.toLowerCase() === 'websocket';

    const excludedPaths = [
      'v1/csrf/token',
      'v1/auth/login',
      'v1/auth/register',
      'v2/auth/register',
      'v3/auth/register',
      'v1/otp/verify-otp',
      'v1/email-verification-by-link/verify-email',
    ];

    if (process.env.NODE_ENV === 'production') {
      console.warn('[CSRF] CSRF middleware is disabled in production mode.');
      return next();
    }

    if (safeMethods.includes(req.method) || isWebSocket) {
      return next();
    }

    // Check if the current path starts with any of the excluded paths
    if (excludedPaths.some((path) => req.path.startsWith(path))) {
      console.log(
        `[CSRF] Path "${req.path}" is excluded from CSRF protection.`,
      );
      return next();
    }

    const token = (req.headers['x-csrf-token'] ||
      req.headers['csrf-token'] ||
      req.body?._csrf) as string;
    const cookieToken = req.cookies?.['csrf-token'];

    if (!token || !cookieToken) {
      console.error(
        '[CSRF] Missing token. Header:',
        token,
        'Cookie:',
        cookieToken,
      );
      throw new ForbiddenException('CSRF token missing');
    }

    if (token !== cookieToken) {
      console.error(
        '[CSRF] Token mismatch. Header:',
        token,
        'Cookie:',
        cookieToken,
      );
      throw new ForbiddenException('CSRF token mismatch');
    }

    console.log('[CSRF] Header Token:', token);
    console.log('[CSRF] Cookie Token:', cookieToken);

    next();
  }
}
