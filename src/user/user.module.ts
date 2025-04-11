import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { SmsService } from 'src/user/sms/sms.service';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './Guard/roles.guard';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot(), 
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User]), // Import the User entity
  ],
  providers: [
    UserService, 
    EmailService,
    SmsService,
    RolesGuard, // Keep RolesGuard for role-based access control
    JwtStrategy, // Register JwtStrategy
  ],
  controllers: [UserController],
  exports: [UserService, EmailService, JwtModule, TypeOrmModule], // Export TypeOrmModule
})
export class UserModule {}