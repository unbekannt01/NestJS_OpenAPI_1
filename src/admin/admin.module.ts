import { forwardRef, Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { EmailVerification } from 'src/email-verification-by-link/entity/email-verify.entity';
import { UserModule } from 'src/user/user.module';
import { EmailVerificationByLinkModule } from 'src/email-verification-by-link/email-verification-by-link.module';
import { OtpModule } from 'src/otp/otp.module';
import { EmailServiceForSupension } from 'src/auth/services/suspend-mail.service';
import { RequestLog } from './entity/log.entity';

/**
 * AdminModule
 * This module is responsible for managing admin-related functionalities.
 */

@Module({
  imports: [
    TypeOrmModule.forFeature([User, EmailVerification,RequestLog]),
    forwardRef(() => UserModule),
    forwardRef(() => OtpModule),
    forwardRef(() => EmailVerificationByLinkModule),
  ],
  controllers: [AdminController],
  providers: [AdminService,EmailServiceForSupension],
  exports:[AdminService,EmailServiceForSupension]
})
export class AdminModule {}
