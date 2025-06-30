import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GatewayService {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('User Connected...!', client.id);
    client.broadcast.emit('User-Joined...!', {
      message: `user Joined the Chat: ${client.id}`,
    });
  }

  handleDisconnection(client: Socket) {
    console.log('User Disconnected...!', client.id);
    client.broadcast.emit('User-Left', {
      message: `User Left From the Chat: ${client.id}`,
    });
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
    console.log(body);
    console.log('Connected... Client: ' + client.id);
    this.server.except(client.id).emit('message', body);
  }

  notifyuserlogin(email: string) {
    console.log('User Login Notification: ', email);
    this.server.emit('user-login', {
      message: `User Logged In: ${email}`,
    });
  }

  notifyuserlogout(email: string) {
    console.log('User Logout Notification: ', email);
    this.server.emit('user-logout', {
      message: `user Logged Out: ${email}`,
    });
  }

  notifyWhenFileUpload(email: string) {
    console.log('User File Uploaded...!', email);
    this.server.emit('user-file', {
      message: `User File Uploaded : ${email}`,
    });
  }
}
