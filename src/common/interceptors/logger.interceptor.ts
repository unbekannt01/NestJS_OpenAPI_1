import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

// export class LoggerInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler<any>) {
//     const ctx = context.switchToHttp();
//     const request = ctx.getRequest();
//     const response = ctx.getResponse();

//     const startTime = Date.now();

//     return next.handle().pipe(
//       tap(() => {
//         const endTime = Date.now();
//         const resTime = endTime - startTime;

//         console.log(
//           `${request.method} ${request.url} ${response.statusCode} ${resTime}ms`
//         );
//       })
//     );
//   }
// }

// Enhanced version of your LoggerInterceptor

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

    const now = Date.now();
    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        
        this.logger.log(
          `${method} ${url} ${statusCode} - ${Date.now() - now}ms`,
        );
      }),
    );
  }
}