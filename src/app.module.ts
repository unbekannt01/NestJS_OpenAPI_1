import { Module, MiddlewareConsumer } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SmsService } from './user/services/sms.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { IsNotSuspendedGuard } from './auth/guards/isNotSuspended.guard';
import { SearchModule } from './search/search.module';
import { RecentSearch } from './search/entity/recent-search.entity';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: ['.env'],
      expandVariables: true
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: (config.get<number>('DB_PORT') || 5432), // Fix the port configuration
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        entities: [User, RecentSearch],
        synchronize: true, // Ensure this is true for development only
      }),
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
    }
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('user'); // Apply to all routes
  }
}
