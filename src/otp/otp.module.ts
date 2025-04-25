import { forwardRef, Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService], // <-- Export OtpService here
})
export class OtpModule {}
