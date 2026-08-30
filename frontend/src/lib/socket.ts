import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4051';

let socket: Socket | null = null;

export function getSocket(userId: string): Socket {
  if (!socket) {
    socket = io(`${SOCKET_URL}/notifications`, {
      query: { userId },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
