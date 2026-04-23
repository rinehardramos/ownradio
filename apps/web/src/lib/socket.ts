import { io, type Socket } from "socket.io-client";
import { getToken } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket?.connected || socket?.active) {
    return socket;
  }

  const token = getToken();
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) throw new Error("NEXT_PUBLIC_WS_URL is not configured");
  socket = io(wsUrl, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function reconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  getSocket();
}
