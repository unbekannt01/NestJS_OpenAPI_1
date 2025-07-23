import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
import { UserService } from 'src/user/user.service';
import { Socket } from 'socket.io';
import { configService } from 'src/common/services/config.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST']
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const payload = this.jwtService.verify(token, {
      secret: configService.getValue('JWT_SECRET'),
    });
    this.onlineUsers.set(payload.id, client.id);
    client.join(`user_${payload.id}`);
  }

  handleDisconnect(client: Socket) {
    [...this.onlineUsers.entries()].forEach(([userId, socketId]) => {
      if (socketId === client.id) this.onlineUsers.delete(userId);
    });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { to: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const token = client.handshake.auth.token;
    const payload = this.jwtService.verify(token, {
      secret: configService.getValue('JWT_SECRET'),
    });

    const savedMessage = await this.chatService.sendMessage(
      payload.id,
      data.to,
      data.message,
    );

    // Emit to receiver if online
    const receiverSocketId = this.onlineUsers.get(data.to);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('newMessage', {
        from: payload.id,
        message: data.message,
        timestamp: savedMessage.createdAt,
      });
    }

    // Confirm back to sender
    client.emit('messageSent', {
      to: data.to,
      message: data.message,
      timestamp: savedMessage.createdAt,
    });
  }
}
