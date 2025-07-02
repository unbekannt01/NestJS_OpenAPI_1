import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { SearchModule } from './search/search.module';
import { SmsService } from './otp/services/sms.service';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { IsSuspendedGuard } from './auth/guards/isNotSuspended.guard';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { LoginUsingGoogleModule } from './login-using-google/login-using-google.module';
import { EmailVerificationByLinkModule } from './email-verification-by-link/email-verification-by-link.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { AdminModule } from './admin/admin.module';
import { PasswordModule } from './password/password.module';
import { IsLoggedInGuard } from './auth/guards/isLoggedin.guard';
import { ProductsModule } from './products/products.module';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { validationSchema } from './config/env.validation';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AlsModule } from './als/als.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AlsMiddleware } from './als/als.middleware';
import { CloudinaryModule } from './common/services/cloudinary.module';
import { CacheModule } from '@nestjs/cache-manager';
import { FileUploadUsingS3Module } from './file-upload-using-s3/file-upload-using-s3.module';
import { FileUploadUsingCloudinaryModule } from './file-upload-using-cloudinary/file-upload-using-cloudinary.module';
import { FileUploadUsingSupabaseModule } from './file-upload-using-supabase/file-upload-using-supabase.module';
import { CsrfModule } from './csrf/csrf.module';
import { redisStore } from 'cache-manager-ioredis';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { GatewayModule } from './gateway/gateway.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brand.module';
import { OrderModule } from './order/order.module';
import { ReviewModule } from './review/review.module';

/**
 * AppModule
 * This is the root module of the application.
 */
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore as any,
        socket: {
          // host: 'host.docker.internal',
          host: 'localhost',
          port: 6379,
          keyPrefix: 'nestjs:',
        },
        ttl: 60000,
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: [`.env.${process.env.NODE_ENV || 'local'}`],
      cache: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    AlsModule,
    AuthModule,
    UserModule,
    EmailVerificationByLinkModule,
    LoginUsingGoogleModule,
    SearchModule,
    PasswordModule,
    FileUploadModule,
    ProductsModule,
    AdminModule,
    CloudinaryModule,
    FileUploadUsingS3Module,
    FileUploadUsingCloudinaryModule,
    FileUploadUsingSupabaseModule,
    // WebSocketsModule
    // CsrfModule,
    TerminusModule,
    GatewayModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    OrderModule,
    ReviewModule
  ],
  providers: [
    // AppService,
    SmsService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: IsSuspendedGuard,
    },
    {
      provide: APP_GUARD,
      useClass: IsLoggedInGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: Languagelnterceptor,
    // },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: ResponseTransformInterceptor,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: ClassSerializerInterceptor,
    // },
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AlsMiddleware)
      // .exclude(
      //   '/v1/auth/login',
      //   '/v1/auth/register',
      //   '/v1/auth/refresh-token',
      //   '/v1/password/forgot-password',
      //   '/v1/password/reset-password',
      //   '/v1/csrf/token',
      //   '/v1/google/google-login',
      //   '/v1/otp/verify-otp',
      //   '/v1/otp/resend-otp',
      //   '/v1/email-verification-by-link/verify-email',
      //   '/v1/email-verification-by-link/resend-verification',
      // )
      .forRoutes('*');
  }
}
