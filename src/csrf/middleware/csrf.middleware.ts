import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RequestWithCustomCsrf extends Request {
  customCsrfToken?: string;
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: RequestWithCustomCsrf, res: Response, next: NextFunction) {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    const isWebSocket = req.headers.upgrade?.toLowerCase() === 'websocket';

    const excludedPaths = ['/csrf/token'];

    if (process.env.NODE_ENV === 'development') return next();
    if (safeMethods.includes(req.method) || isWebSocket) return next();
    if (excludedPaths.some((path) => req.path.startsWith(path))) return next();

    const token = (req.headers['x-csrf-token'] ||
      req.headers['csrf-token'] ||
      req.body?._csrf) as string;
    const cookieToken = req.cookies?.['csrf-token'];

    if (!token || !cookieToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (token !== cookieToken) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    console.log('[CSRF] Header Token:', token);
    console.log('[CSRF] Cookie Token:', cookieToken);

    next();
  }
}
