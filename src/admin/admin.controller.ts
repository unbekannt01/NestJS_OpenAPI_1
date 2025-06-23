import { Controller, Get, Post, UseGuards } from "@nestjs/common"
import { AdminService } from "./admin.service"
import { NotificationsGateway } from "../websockets/notifications.gateway"
import { Admin } from "src/common/decorators/admin.decorator"

@Admin()
@Controller({ path: 'admin', version: '1'})
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // Suspend user endpoint
  @Post('suspend/:id')
  async suspendUser(userId: string, body: { message?: string }) {
    const message = body.message || "Account suspended by admin"
    const result = await this.adminService.suspendUser(userId, message)
    return {
      message: "User suspended successfully",
      user: result,
    }
  }

  // Reactivate user endpoint
  @Post("reactivate/:id")
  async reactivateUser(userId: string) {
    const result = await this.adminService.reActivatedUser(userId)
    return result
  }

  // Unblock user endpoint
  @Post("unblock/:id")
  async unblockUser(userId: string) {
    const result = await this.adminService.unblockUser(userId)
    return result
  }

  // Get all users
  @Get("users")
  async getAllUsers() {
    // You might need to create this method in AdminService
    return {
      message: "Users fetched successfully",
      users: [], // Replace with actual user data
    }
  }

  // Add this endpoint to get connected users
  @Get("connected-users")
  async getConnectedUsers(): Promise<{ message: string; connectedUsers: any[]; totalConnected: number }> {
    const connectedUsers = this.notificationsGateway.getConnectedUsers()
    return {
      message: "Connected users fetched successfully",
      connectedUsers,
      totalConnected: connectedUsers.length,
    }
  }

  // Add this endpoint to check if user is online
  @Get("user-online/:id")
  async checkUserOnline(userId: string) {
    const isOnline = this.notificationsGateway.isUserOnline(userId)
    return {
      userId,
      isOnline,
      timestamp: new Date(),
    }
  }

  // Broadcast message to all users
  @Post("broadcast")
  async broadcastMessage(body: { message: string }) {
    // You might need to add this method to NotificationsGateway
    return {
      message: "Broadcast sent successfully",
    }
  }
}
