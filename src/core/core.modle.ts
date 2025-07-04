import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { IsSuspendedGuard } from '../auth/guards/isNotSuspended.guard';
import { IsLoggedInGuard } from '../auth/guards/isLoggedin.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LoggerInterceptor } from '../common/interceptors/logger.interceptor';
import { UserModule } from 'src/user/user.module';
import { AdminService } from 'src/admin/admin.service';

@Module({
  imports: [UserModule],
  providers: [
    AdminService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: IsSuspendedGuard },
    { provide: APP_GUARD, useClass: IsLoggedInGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
  ],
})
export class CoreModule {}
