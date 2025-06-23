import { Controller, Get, Post, UseGuards } from "@nestjs/common"
import { AdminService } from "./admin.service"
import { JwtAuthGuard } from "../auth/guards/jwt.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../common/decorators/roles.decorator"
import { UserRole } from "../user/entities/user.entity"
import { NotificationsGateway } from "../websockets/notifications.gateway"

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // Suspend user endpoint
  @Post("suspend/:id")
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
