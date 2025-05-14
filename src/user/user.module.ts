import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EmailServiceForVerifyMail } from 'src/email-verification-by-link/services/email.service';
import { SmsService } from 'src/otp/services/sms.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthModule } from 'src/auth/auth.module';
import { OtpModule } from 'src/otp/otp.module';
import { EmailServiceForOTP } from 'src/otp/services/email.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Otp } from 'src/otp/entities/otp.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp]), // Import the User entity
    forwardRef(() => AuthModule),
    forwardRef(() => OtpModule),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename = `${file.originalname}`;
          cb(null, filename);
        }
      })
    })
  ],
  providers: [
    UserService,
    EmailServiceForOTP,
    EmailServiceForVerifyMail,
    SmsService,
    RolesGuard,
  ],
  controllers: [UserController],
  exports: [
    UserService,
    EmailServiceForVerifyMail,
    EmailServiceForOTP,
    TypeOrmModule,
  ],
})
export class UserModule { }