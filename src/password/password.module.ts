import { forwardRef, Module } from '@nestjs/common';
import { PasswordService } from './password.service';
import { PasswordController } from './password.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Otp } from 'src/otp/entities/otp.entity';
import { OtpModule } from 'src/otp/otp.module';
import { AuthModule } from 'src/auth/auth.module';
import { EmailServiceForOTP } from 'src/otp/services/email.service';

/**
 * PasswordModule
 * This module is responsible for handling password-related functionalities.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp]),
    forwardRef(() => AuthModule),
    forwardRef(() => OtpModule),
  ],
  controllers: [PasswordController],
  providers: [PasswordService, EmailServiceForOTP],
  exports: [PasswordService, EmailServiceForOTP],
})
export class PasswordModule {}
