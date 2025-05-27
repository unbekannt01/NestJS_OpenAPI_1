import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { ConfigService } from '@nestjs/config';
import { OtpModule } from 'src/otp/otp.module';
import { EmailServiceForSupension } from './services/suspend-mail.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { EmailVerificationByLinkModule } from 'src/email-verification-by-link/email-verification-by-link.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { EmailVerification } from 'src/email-verification-by-link/entity/email-verify.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Auth2Controller } from './auth-v2.controller';
import { Auth3Controller } from './auth-v3.controller';

/**
 * AuthModule
 * This module is responsible for authentication-related functionalities.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, EmailVerification]),
    forwardRef(() => UserModule),
    forwardRef(() => OtpModule),
    forwardRef(() => EmailVerificationByLinkModule),
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
  controllers: [AuthController, Auth2Controller, Auth3Controller],
  providers: [AuthService, JwtStrategy, EmailServiceForSupension],
  exports: [AuthService, EmailServiceForSupension],
})
export class AuthModule { }
