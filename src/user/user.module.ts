import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { SmsService } from 'src/user/services/sms.service';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { LocalStrategy } from 'src/auth/strategies/local.strategy';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User]), // Import the User entity
    forwardRef(() => AuthModule), // Use forwardRef to resolve circular dependency
  ],
  providers: [
    UserService,
    EmailService,
    SmsService,
    RolesGuard,
    JwtStrategy,
    LocalStrategy,
  ],
  controllers: [UserController],
  exports: [
    UserService, // Export UserService
    EmailService,
    JwtModule,
    TypeOrmModule, // Export TypeOrmModule to make UserRepository available
  ],
})
export class UserModule {}