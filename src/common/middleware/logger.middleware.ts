import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * LoggerMiddleware
 * This middleware logs incoming requests and their details.
 * It logs the request method, URL, status code, and duration of the request.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
          `Status: ${res.statusCode} - ${duration}ms ` +
          `Query: ${JSON.stringify(req.query)} ` +
          `Body: ${JSON.stringify(req.body)}`,
      );
    });
    next();
  }
}
