import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { SmsService } from 'src/user/sms/sms.service';

@Module({
  imports: [
    ConfigModule.forRoot(), 
    TypeOrmModule.forFeature([User]),
  ],
  providers: [UserService, EmailService,SmsService],
  controllers: [UserController],
  exports: [UserService, EmailService],
})
export class UserModule {}
