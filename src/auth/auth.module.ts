import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { ConfigService } from '@nestjs/config';
import { OtpModule } from 'src/otp/otp.module';
import { EmailServiceForSupension } from './services/suspend-mail.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => OtpModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.get('JWT');
        return {
          secret: jwtConfig.SECRET,
          signOptions: {
            expiresIn: jwtConfig.EXPIRES_IN,
          },
        };
      },
    }),
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
  controllers: [AuthController],
  providers: [AuthService, JwtService, EmailServiceForSupension],
  exports: [AuthService, JwtService, EmailServiceForSupension],
})
export class AuthModule { }
