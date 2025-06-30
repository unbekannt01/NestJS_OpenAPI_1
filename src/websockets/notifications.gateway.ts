import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface ConnectedUser {
  userId: string;
  socketId: string;
  role: string;
  connectedAt: Date;
}

@Injectable()
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, ConnectedUser>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client attempting to connect: ${client.id}`);

      // Get token from auth object or handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1] ||
        client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const connectedUser: ConnectedUser = {
        userId: payload.id,
        socketId: client.id,
        role: payload.role,
        connectedAt: new Date(),
      };

      this.connectedUsers.set(client.id, connectedUser);

      await client.join(`user_${payload.id}`);

      if (payload.role === 'ADMIN') {
        await client.join('admins');
      }

      this.logger.log(`User ${payload.id} connected with socket ${client.id}`);

      client.emit('connected', {
        message: 'Successfully connected to notifications',
        userId: payload.id,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Authentication failed for socket ${client.id}:`,
        error.message,
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const connectedUser = this.connectedUsers.get(client.id);
    if (connectedUser) {
      this.logger.log(`User ${connectedUser.userId} disconnected`);
      this.connectedUsers.delete(client.id);
    }
  }
  
  handlePing(client: Socket) {
    this.logger.log(`Ping received from ${client.id}`);
    client.emit('pong', { timestamp: new Date() });
  }

  notifyAccountStatusChange(
    userId: string,
    statusData: {
      oldStatus: string;
      newStatus: string;
      reason?: string;
      suspensionReason?: string;
      changedBy?: string;
    },
  ) {
    const notification = {
      type: 'ACCOUNT_STATUS_CHANGED',
      data: {
        oldStatus: statusData.oldStatus,
        newStatus: statusData.newStatus,
        reason: statusData.reason,
        suspensionReason: statusData.suspensionReason,
        changedBy: statusData.changedBy,
        timestamp: new Date(),
      },
    };

    this.server.to(`user_${userId}`).emit('accountStatusChanged', notification);

    this.server.to('admins').emit('userStatusChanged', {
      ...notification,
      userId,
    });

    this.logger.log(
      `Account status notification sent to user ${userId}: ${statusData.oldStatus} -> ${statusData.newStatus}`,
    );
  }

  // Account suspension notification
  notifyAccountSuspended(userId: string, reason: string, suspendedBy: string) {
    const notification = {
      type: 'ACCOUNT_SUSPENDED',
      data: {
        reason,
        suspendedBy,
        timestamp: new Date(),
        action: 'Your account has been suspended',
      },
    };

    this.server.to(`user_${userId}`).emit('accountSuspended', notification);
    this.logger.log(`Account suspension notification sent to user ${userId}`);
  }

  // Account reactivation notification
  notifyAccountReactivated(userId: string, reactivatedBy: string) {
    const notification = {
      type: 'ACCOUNT_REACTIVATED',
      data: {
        reactivatedBy,
        timestamp: new Date(),
        action: 'Your account has been reactivated',
      },
    };

    this.server.to(`user_${userId}`).emit('accountReactivated', notification);
    this.logger.log(`Account reactivation notification sent to user ${userId}`);
  }

  // Account blocked notification
  notifyAccountBlocked(userId: string, reason: string) {
    const notification = {
      type: 'ACCOUNT_BLOCKED',
      data: {
        reason,
        timestamp: new Date(),
        action:
          'Your account has been blocked due to multiple failed login attempts',
      },
    };

    this.server.to(`user_${userId}`).emit('accountBlocked', notification);
    this.logger.log(`Account blocked notification sent to user ${userId}`);
  }

  // Account unblocked notification
  notifyAccountUnblocked(userId: string, unblockedBy: string) {
    const notification = {
      type: 'ACCOUNT_UNBLOCKED',
      data: {
        unblockedBy,
        timestamp: new Date(),
        action: 'Your account has been unblocked',
      },
    };

    this.server.to(`user_${userId}`).emit('accountUnblocked', notification);
    this.logger.log(`Account unblocked notification sent to user ${userId}`);
  }

  // Login attempt notification
  notifyLoginAttempt(userId: string, location: string, success: boolean) {
    const notification = {
      type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      data: {
        location,
        success,
        timestamp: new Date(),
        action: success
          ? 'Successful login detected'
          : 'Failed login attempt detected',
      },
    };

    this.server.to(`user_${userId}`).emit('loginAttempt', notification);
    this.logger.log(
      `Login attempt notification sent to user ${userId}: ${success ? 'success' : 'failed'}`,
    );
  }

  // Get connected users (for admin dashboard)
  getConnectedUsers(): ConnectedUser[] {
    return Array.from(this.connectedUsers.values());
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).some(
      (user) => user.userId === userId,
    );
  }

  // Add this method to your existing NotificationsGateway class
  broadcastToAllUsers(message: string, type = 'info') {
    const notification = {
      type: 'BROADCAST',
      data: {
        message,
        type,
        timestamp: new Date(),
        from: 'Admin',
      },
    };

    // Send to all connected users
    this.server.emit('broadcast', notification);
    this.logger.log(`Broadcast message sent to all users: ${message}`);
  }
}
