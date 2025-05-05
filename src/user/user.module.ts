import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EmailService } from './services/email.service';
import { SmsService } from 'src/user/services/sms.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { AuthModule } from 'src/auth/auth.module';
import { OtpModule } from 'src/otp/otp.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Import the User entity
    forwardRef(() => AuthModule), 
    forwardRef(() => OtpModule), 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  providers: [
    UserService,
    EmailService,
    SmsService,
    RolesGuard,
    JwtStrategy,
  ],
  controllers: [UserController],
  exports: [
    UserService, // Export UserService
    EmailService,
    TypeOrmModule, // Export TypeOrmModule to make UserRepository available
  ],
})
export class UserModule {}