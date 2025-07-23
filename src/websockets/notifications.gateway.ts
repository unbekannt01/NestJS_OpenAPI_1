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
import { UserService } from 'src/user/user.service';
import { configService } from 'src/common/services/config.service';

interface ConnectedUser {
  userId: string;
  socketId: string;
  role: string;
  connectedAt: Date;
  userName: string;
  email: string;
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
    private readonly userService: UserService,
  ) {}

  private emitAdminConsoleLog(message: string) {
    const log = {
      message,
      timestamp: new Date(),
    };
    this.server.to('admins').emit('adminConsoleLog', log);
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client attempting to connect: ${client.id}`);
      this.emitAdminConsoleLog(`Client attempting to connect: ${client.id}`);

      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1] ||
        client.handshake.query?.token;

      if (!token) {
        const msg = `Client ${client.id} connected without token`;
        this.logger.warn(msg);
        this.emitAdminConsoleLog(`${msg}`);
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: configService.getValue('JWT_SECRET'),
      });

      const user = await this.userService.getUserById(payload.id);

      if (!user) {
        this.logger.warn(`User with ID ${payload.id} not found`);
        client.emit('error', { message: 'User not found' });
        client.disconnect();
        return;
      }

      const connectedUser: ConnectedUser = {
        userId: payload.id,
        userName: user.userName,
        email: user.email,
        socketId: client.id,
        role: payload.role,
        connectedAt: new Date(),
      };

      this.connectedUsers.set(client.id, connectedUser);

      await client.join(`user_${payload.id}`);
      if (payload.role === 'ADMIN') {
        await client.join('admins');
      }

      const successMsg = `User ${user.userName} (${user.email}) connected with socket ${client.id}`;
      this.logger.log(successMsg);
      this.emitAdminConsoleLog(successMsg);

      client.emit('connected', {
        message: 'Successfully connected to notifications',
        userId: payload.id,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMsg = `Authentication failed for socket ${client.id}: ${error.message}`;
      this.logger.error(errorMsg);
      this.emitAdminConsoleLog(errorMsg);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const connectedUser = this.connectedUsers.get(client.id);
    if (connectedUser) {
      const msg = `User ${connectedUser.userId} disconnected`;
      this.logger.log(msg);
      this.emitAdminConsoleLog(msg);
      this.connectedUsers.delete(client.id);
    }
  }

  handlePing(client: Socket) {
    const msg = `Ping received from ${client.id}`;
    this.logger.log(msg);
    this.emitAdminConsoleLog(msg);
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

    const logMsg = `Account status changed: ${statusData.oldStatus} → ${statusData.newStatus} (user: ${userId})`;
    this.logger.log(logMsg);
    this.emitAdminConsoleLog(logMsg);
  }

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

    const msg = `Account suspended: ${userId} (by: ${suspendedBy})`;
    this.logger.log(msg);
    this.emitAdminConsoleLog(msg);
  }

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
    const msg = `Account reactivated: ${userId} (by: ${reactivatedBy})`;
    this.logger.log(msg);
    this.emitAdminConsoleLog(msg);
  }

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
    const msg = `Account blocked: ${userId}`;
    this.logger.log(msg);
    this.emitAdminConsoleLog(msg);
  }

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
    const msg = `Account unblocked: ${userId} (by: ${unblockedBy})`;
    this.logger.log(msg);
    this.emitAdminConsoleLog(msg);
  }

  notifyLoginAttempt(
    userId: string,
    location: string,
    success: boolean,
    userName: string,
    email: string,
  ) {
    const notification = {
      type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      data: {
        location,
        success,
        userName,
        email,
        timestamp: new Date(),
        action: success
          ? 'Successful login detected'
          : 'Failed login attempt detected',
      },
    };

    this.server.to(`user_${userId}`).emit('loginAttempt', notification);

    const msg = `Login attempt (${success ? 'success' : 'failed'}) for ${userName} -${email} at ${location}`;
    this.logger.log(msg);
    this.emitAdminConsoleLog(msg);
  }

  notifyLogout(
    userId: string,
    location: string,
    success: boolean,
    userName: string,
    email: string,
  ) {
    const notification = {
      type: success ? 'LOGOUT_SUCCESS' : 'LOGOUT_FAILED',
      data: {
        location,
        success,
        userName,
        email,
        timestamp: new Date(),
        action: success
          ? 'Successful logout detected'
          : 'Failed logout attempt detected',
      },
    };

    this.server.to(`user_${userId}`).emit('logoutAttempt', notification);

    const msg = `Logout attempt (${success ? 'success' : 'failed'}) for ${userName} -${email} at ${location}`;
    this.logger.log(msg);
    this.emitAdminConsoleLog(msg);
  }

  getConnectedUsers(): ConnectedUser[] {
    return Array.from(this.connectedUsers.values());
  }

  isUserOnline(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).some(
      (user) => user.userId === userId,
    );
  }

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

    this.server.emit('broadcast', notification);
    const msg = `Broadcast message sent to all users: ${message}`;
    this.logger.log(msg);
    this.emitAdminConsoleLog(msg);
  }
}
