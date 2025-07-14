import { Logger, Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { OtpModule } from 'src/otp/otp.module';
import { EmailServiceForSupension } from './services/suspend-mail.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { EmailVerificationByLinkModule } from 'src/email-verification-by-link/email-verification-by-link.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { EmailVerification } from 'src/email-verification-by-link/entity/email-verify.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.stategy';
import { ConfigModule } from 'src/config/module/config.module';
import { configService } from 'src/common/services/config.service';
import { FileStorageService } from 'src/common/services/file-storage.service';
import { SupabaseService } from 'src/common/services/supabase.service';
import { S3Service } from 'src/common/services/s3.service';
import { GatewayService } from 'src/gateway/gateway.service';
// import { WebSocketsModule } from 'src/websockets/websockets.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, EmailVerification]),
    forwardRef(() => UserModule),
    forwardRef(() => OtpModule),
    forwardRef(() => EmailVerificationByLinkModule),
    JwtModule.register({
      secret: configService.getValue('JWT_SECRET'),
      signOptions: {
        expiresIn: configService.getValue('JWT_EXPIRES_IN'),
      },
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    }),
    // WebSocketsModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    EmailServiceForSupension,
    Logger,
    SupabaseService,
    FileStorageService,
    S3Service,
    GatewayService,
  ],
  exports: [AuthService, EmailServiceForSupension, JwtModule],
})
export class AuthModule {}
