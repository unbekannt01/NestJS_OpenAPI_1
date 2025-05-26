import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AdminService } from 'src/admin/admin.service';

/**
 * LoggerInterceptor
 * This interceptor logs the incoming requests and outgoing responses.
 * It logs the request method, URL, user agent, IP address, and response time.
 */
@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  // private logger = new Logger('HTTP');

  constructor(private readonly adminService: AdminService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip;
    const startTime = Date.now();

    // this.logger.log(`${method} ${url} - ${userAgent} ${ip}`);

    return next.handle().pipe(
      tap(async () => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const resTime = Date.now() - startTime;
        // Safely get user id if available
        const user = req.user;

        // this.logger.log(`${method} ${url} ${statusCode} - ${resTime}ms`);

        // Save to DB (non-blocking recommended)
        await this.adminService.logRequest({
          method,
          url,
          userAgent,
          ip,
          statusCode,
          responseTime: resTime,
          user: user?.id ?? null,
        });
      }),
    );
  }
}
