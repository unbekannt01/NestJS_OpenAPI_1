import {
  Injectable,
  ExecutionContext,
  NestInterceptor,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class Languagelnterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const language = request.headers['language'] || 'en';
    request.headers['language'] = language;

    return next.handle().pipe(
      tap(() => {
        response.setHeader('language', language);
      }),
    );
  }
}
