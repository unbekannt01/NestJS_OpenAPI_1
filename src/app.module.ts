import {
  Module,
  MiddlewareConsumer,
  NestModule,
  ClassSerializerInterceptor,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { SearchModule } from './search/search.module';
import { SmsService } from './otp/services/sms.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { IsSuspendedGuard } from './auth/guards/isNotSuspended.guard';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { typeOrmConfig } from './config/typeorm.config';
import { SMTP_CONFIG } from './config/gmail.config';
import { JWT_CONFIG } from './config/jwt.config';
import { GOOGLE_OAUTH } from './config/google-oauth.config';
import { LoginUsingGoogleModule } from './login-using-google/login-using-google.module';
import { EmailVerificationByLinkModule } from './email-verification-by-link/email-verification-by-link.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { AdminModule } from './admin/admin.module';
import { PasswordModule } from './password/password.module';
import { IsLoggedInGuard } from './auth/guards/isLoggedin.guard';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeOrmConfig, SMTP_CONFIG, JWT_CONFIG, GOOGLE_OAUTH],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('typeorm') as any,
    }),
    EmailVerificationByLinkModule,
    LoginUsingGoogleModule,
    UserModule,
    SearchModule,
    LoginUsingGoogleModule,
    EmailVerificationByLinkModule,
    FileUploadModule,
    AdminModule,
    PasswordModule,
  ],
  providers: [
    SmsService,
    {
      provide: APP_GUARD,
      useClass: IsSuspendedGuard,
    },
    {
      provide: APP_GUARD,
      useClass: IsLoggedInGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      // .exclude(
      //   { path: 'v1/auth/register', method: RequestMethod.POST },
      //   { path: 'v1/auth/login', method: RequestMethod.POST },
      //   { path: 'v1/password/forgot-password', method: RequestMethod.POST },
      //   { path: 'v1/password/reset-password', method: RequestMethod.POST },
      //   { path: 'v1/password/reset-password', method: RequestMethod.POST },
      // )
      .forRoutes('*');
  }
}
