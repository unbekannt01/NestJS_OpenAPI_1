import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { validationSchema } from '../config/env.validation';
import { typeOrmConfig } from '../config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'local'}`],
      validationSchema,
      cache: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client'),
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 10 }],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore as any,
        socket: {
          host: 'localhost',
          port: 6379,
          keyPrefix: 'nestjs:',
        },
        ttl: 60_000,
      }),
    }),
  ],
})
export class InfrastructureModule {}
