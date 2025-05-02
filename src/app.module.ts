import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { SearchModule } from './search/search.module';
import { SmsService } from './user/services/sms.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { IsNotSuspendedGuard } from './auth/guards/isNotSuspended.guard';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { typeOrmConfig } from './config/typeorm.config'; // import here
import { SMTP_CONFIG } from './config/gmail.config';
import { JWT_CONFIG } from './config/jwt.config';
import { GOOGLE_OAUTH } from './config/google-oauth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeOrmConfig, SMTP_CONFIG, JWT_CONFIG, GOOGLE_OAUTH], // load custom config
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('typeorm') as any,
    }),
    UserModule,
    SearchModule,
  ],
  providers: [
    SmsService,
    {
      provide: APP_GUARD,
      useClass: IsNotSuspendedGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
  ],
}) export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // Apply to all routes
    consumer.apply(LoggerMiddleware).forRoutes('user'); // Apply to all routes
  }
}
