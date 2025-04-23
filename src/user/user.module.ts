import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { SmsService } from 'src/user/services/sms.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [
    // ConfigModule.forRoot(),
    TypeOrmModule.forFeature([User]), // Import the User entity
    forwardRef(() => AuthModule), // Use forwardRef to resolve circular dependency
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