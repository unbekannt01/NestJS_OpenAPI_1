import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { NotificationsGateway } from '../websockets/notifications.gateway';
import { Admin } from 'src/common/decorators/admin.decorator';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Admin()
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    // private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('suspend/:id')
  async suspendUser(
    @Param('id') userId: string,
    @Body() body: { message?: string },
  ) {
    const message = body.message || 'Account suspended by admin';
    return this.adminService.suspendUser(userId, message);
  }

  @Post('reactivate/:id')
  async reactivateUser(@Param('id') userId: string) {
    const result = await this.adminService.reActivatedUser(userId);
    return result;
  }

  @Post('unblock/:id')
  async unblockUser(userId: string) {
    const result = await this.adminService.unblockUser(userId);
    return result;
  }

  @Delete('softDelete/:id')
  async softDelete(@Param('id') userId: string) {
    return await this.adminService.softDeleteUser(userId);
  }

  @Post('restore/:id')
  async reStoreUser(@Param('id') userId: string) {
    return await this.adminService.reStoreUser(userId);
  }

  @Get('users')
  async getAllUsers() {
    return {
      message: 'Users fetched successfully',
      users: [],
    };
  }

  // // Add this endpoint to get connected users
  // @Get('connected-users')
  // async getConnectedUsers(): Promise<{
  //   message: string;
  //   connectedUsers: any[];
  //   totalConnected: number;
  // }> {
  //   const connectedUsers = this.notificationsGateway.getConnectedUsers();
  //   return {
  //     message: 'Connected users fetched successfully',
  //     connectedUsers,
  //     totalConnected: connectedUsers.length,
  //   };
  // }

  // @Get('user-online/:id')
  // async checkUserOnline(userId: string) {
  //   const isOnline = this.notificationsGateway.isUserOnline(userId);
  //   return {
  //     userId,
  //     isOnline,
  //     timestamp: new Date(),
  //   };
  // }

  // Broadcast message to all users
  @Post('broadcast')
  async broadcastMessage(body: { message: string }) {
    return {
      message: 'Broadcast sent successfully',
    };
  }
}
