import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * LoggerInterceptor
 * This interceptor logs the incoming requests and outgoing responses.
 * It logs the request method, URL, user agent, IP address, and response time.
 */
@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip;

    this.logger.log(`${method} ${url} - ${userAgent} ${ip}`);

    const startTime = Date.now();
    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const endTime = Date.now();
        const resTime = endTime - startTime;
        this.logger.log(`${method} ${url} ${statusCode} - ${resTime}ms`);
      }),
    );
  }
}
