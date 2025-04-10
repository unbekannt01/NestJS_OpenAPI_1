import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { SmsService } from 'src/user/sms/sms.service';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './Guard/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot(), 
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    UserService, 
    EmailService,
    SmsService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Ensure RolesGuard is globally applied
    },
  ],
  controllers: [UserController],
  exports: [UserService, EmailService, JwtModule], // Export JwtModule
})
export class UserModule {}
