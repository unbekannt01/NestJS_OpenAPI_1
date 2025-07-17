import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CsrfController } from './csrf.controller';
import { CsrfService } from './csrf.service';
import { CsrfMiddleware } from './middleware/csrf.middleware';

@Module({
  controllers: [CsrfController],
  providers: [CsrfService],
})
export class CsrfModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        'v1/csrf/token',
        'v1/auth/login',
        'v1/auth/register',
        'v2/auth/register',
        'v3/auth/register',
        'v1/otp/verify-otp',
        'v1/email-verification-by-link/verify-email',
      );
  }
}
