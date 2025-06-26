import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CsrfController } from './csrf.controller';
import { CsrfService } from './csrf.service';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import { ProtectedController } from './dummy.controller';

@Module({
  controllers: [CsrfController, ProtectedController],
  providers: [CsrfService],
})
export class CsrfModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
