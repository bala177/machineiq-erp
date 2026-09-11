import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Role } from '../../common/enums';

// Mirrors the HTTP CORS allowlist in main.ts. Read directly from process.env
// (rather than ConfigService) because this decorator evaluates at module
// import time, before Nest's DI container exists.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4050')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const ADMIN_ROOM = 'feedback:admins';
export const userRoom = (userId: string) => `feedback:user:${userId}`;

/**
 * Pushes "something changed" signals to open Feedback Center pages.
 *
 * The signal deliberately carries no feedback content. Clients refetch through
 * the REST endpoints, so `@Roles()` on FeedbackController stays the single place
 * authorization is decided — internal notes and other people's reports can never
 * leak down a socket, even if room membership were ever wrong.
 *
 * Unlike NotificationsGateway, the caller's identity is taken from a verified
 * JWT rather than a self-declared handshake query parameter.
 */
@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  },
  namespace: '/feedback',
})
export class FeedbackGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const token = (client.handshake.auth as { token?: string } | undefined)?.token;
    if (!token) return client.disconnect(true);

    let payload: { sub?: string; role?: string };
    try {
      payload = this.jwt.verify(token);
    } catch {
      return client.disconnect(true);
    }

    if (!payload?.sub) return client.disconnect(true);

    client.join(userRoom(payload.sub));
    if (payload.role === Role.ADMIN) client.join(ADMIN_ROOM);
  }

  signalAdmins() {
    this.server?.to(ADMIN_ROOM).emit('feedback:changed', { scope: 'admin' });
  }

  signalUser(userId: string) {
    if (!userId) return;
    this.server?.to(userRoom(userId)).emit('feedback:changed', { scope: 'mine' });
  }
}
