import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@WebSocketGateway({
  cors: { origin: '*' }, // for demo allow all origins
  path: '/socket.io',
})
@Injectable()
export class LeaderboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LeaderboardGateway.name);

  constructor(
    private authService: AuthService,
    @Inject(forwardRef(() => LeaderboardService))
    private readonly leaderboardService: LeaderboardService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        this.logger.warn('Socket connection refused (no token)');
        client.disconnect(true);
        return;
      }
      const payload = this.authService.verifyToken(token);
      if (!payload) {
        this.logger.warn('Socket connection refused (invalid token)');
        client.disconnect(true);
        return;
      }
      // attach user info to socket
      (client as any).user = { id: payload.sub, username: payload.username };
      this.logger.log(`Socket connected: ${payload.username} (${payload.sub})`);
      // send initial leaderboard
      const top = await this.leaderboardService.getTop(10);
      client.emit('leaderboard:update', top);
    } catch (err) {
      this.logger.error('Socket connection error', err);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const u = (client as any).user;
    this.logger.log(`Socket disconnected: ${u?.username ?? client.id}`);
  }

  // broadcast helper
  async broadcastTop(limit = 10) {
    const top = await this.leaderboardService.getTop(limit);
    this.server.emit('leaderboard:update', top);
  }
}
