import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../user/entities/user.entity';
import { RequestLog } from './entity/log.entity';
import { EmailServiceForSupension } from '../auth/services/suspend-mail.service';
import { WebSocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, RequestLog]), WebSocketsModule],
  controllers: [AdminController],
  providers: [AdminService, EmailServiceForSupension],
  exports: [AdminService],
})
export class AdminModule {}
