import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdminService } from '../../admin/admin.service';
import { Request } from 'express';
import { UserId } from '../decorators/user-id.decorator';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  constructor(private readonly adminService: AdminService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async () => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const resTime = Date.now() - startTime;
        // Safely get user id if available
        // const user = req.user;

        // this.logger.log(`${method} ${url} ${statusCode} - ${resTime}ms`);

        // Save to DB (non-blocking recommended) - wrap in try-catch
        try {
          await this.adminService.logRequest({
            method,
            url,
            userAgent,
            ip,
            statusCode,
            responseTime: resTime,
            // user: user ? user : undefined
          });
        } catch (error) {
          console.error('Failed to log request:', error);
          // Don't throw the error to avoid breaking the response
        }
      }),
    );
  }
}
