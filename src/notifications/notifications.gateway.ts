import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/wsJwt.guard';

export interface NotificationPayload {
  type: 'new' | 'accepted' | 'rejected';
  skillTitle: string;
  fromUser: { id: string; name: string };
}

@WebSocketGateway({ cors: true })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly wsJwtGuard: WsJwtGuard) {}

  handleConnection(client: Socket): void {
    try {
      const user = this.wsJwtGuard.verify(client);
      void client.join(user.sub);
    } catch {
      void client.disconnect();
    }
  }

  notifyUser(userId: string, payload: NotificationPayload): void {
    this.server.to(userId).emit('notificateNewRequest', payload);
  }
}
