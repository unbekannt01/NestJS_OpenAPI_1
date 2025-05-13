import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EmailServiceForVerifyMail } from 'src/email-verification-by-link/services/email.service';
import { SmsService } from 'src/otp/services/sms.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { AuthModule } from 'src/auth/auth.module';
import { OtpModule } from 'src/otp/otp.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailServiceForOTP } from 'src/otp/services/email.service';
import { FileUploadModule } from 'src/file-upload/file-upload.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Import the User entity
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
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     secret: configService.get('JWT_SECRET'),
    //     signOptions: {
    //       expiresIn: '15m',
    //     },
    //   }),
    // }),
  ],
  providers: [
    UserService,
    EmailServiceForOTP,
    EmailServiceForVerifyMail,
    SmsService,
    RolesGuard,
    JwtStrategy,
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