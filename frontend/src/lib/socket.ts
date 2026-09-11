import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4051';

let socket: Socket | null = null;
let feedbackSocket: Socket | null = null;

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

/**
 * Feedback Center live updates. The server identifies the caller from this
 * token rather than a self-declared user id, so an expired session simply
 * fails to connect — callers fall back to refetching on window focus.
 */
export function getFeedbackSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('machineiq_token');
  if (!token) return null;
  if (!feedbackSocket) {
    feedbackSocket = io(`${SOCKET_URL}/feedback`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return feedbackSocket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (feedbackSocket) {
    feedbackSocket.disconnect();
    feedbackSocket = null;
  }
}
