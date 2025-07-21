import { forwardRef, Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { EmailServiceForOTP } from './services/email.service';

@Module({
  imports: [forwardRef(() => UserModule), TypeOrmModule.forFeature([User])],
  controllers: [OtpController],
  providers: [OtpService, EmailServiceForOTP],
  exports: [OtpService, EmailServiceForOTP],
})
export class OtpModule {}
