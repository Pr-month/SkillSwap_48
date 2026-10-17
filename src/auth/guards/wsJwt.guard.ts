import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { JwtPayload } from '../auth.types';

interface SocketWithUser extends Socket {
  data: {
    user?: JwtPayload;
  };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<SocketWithUser>();
    this.verify(client);
    return true;
  }

  verify(client: SocketWithUser): JwtPayload {
    const token = client.handshake?.query?.token;

    if (!token || typeof token !== 'string') {
      throw new WsException('Unauthorized: no token provided');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      client.data.user = payload;
      return payload;
    } catch {
      throw new WsException('Unauthorized: invalid token');
    }
  }
}
