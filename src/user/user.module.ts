import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EmailServiceForVerifyMail } from 'src/email-verification-by-link/services/email-verify.service';
import { SmsService } from 'src/otp/services/sms.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthModule } from 'src/auth/auth.module';
import { OtpModule } from 'src/otp/otp.module';
import { EmailServiceForOTP } from 'src/otp/services/email.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Otp } from 'src/otp/entities/otp.entity';
import { JwtService } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { Product } from 'src/products/entities/product.entity';
import { AlsModule } from 'src/als/als.module';

@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([User, Otp]),
    forwardRef(() => AuthModule),
    forwardRef(() => OtpModule),
    forwardRef(() => Product),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename = `${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
    AlsModule,
  ],
  providers: [
    UserService,
    EmailServiceForOTP,
    EmailServiceForVerifyMail,
    SmsService,
    RolesGuard,
    JwtService,
  ],
  controllers: [UserController],
  exports: [
    UserService,
    EmailServiceForVerifyMail,
    EmailServiceForOTP,
    TypeOrmModule,
    JwtService,
  ],
})
export class UserModule {}
