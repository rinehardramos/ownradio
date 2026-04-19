import type { Server as IOServer } from "socket.io";
import { verifyToken } from "../lib/jwt.js";
import { handleChat } from "./chat.js";
import { handleReactions } from "./reactions.js";

function getListenerCount(io: IOServer, stationSlug: string): number {
  const room = io.sockets.adapter.rooms.get(`station:${stationSlug}`);
  return room?.size ?? 0;
}

export function setupSocketHandlers(io: IOServer) {
  io.on("connection", (socket) => {
    // Try to authenticate from handshake auth token
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const payload = verifyToken(token);
        (socket as any).userId = payload.userId;
        (socket as any).username = payload.username;
      } catch {
        // Anonymous connection — no userId set
      }
    }

    socket.on("join_station", (data: { slug: string }) => {
      const { slug } = data;

      // Leave any previous station
      const prevSlug = (socket as any).stationSlug as string | undefined;
      if (prevSlug) {
        socket.leave(`station:${prevSlug}`);
        io.to(`station:${prevSlug}`).emit("listener_count", {
          slug: prevSlug,
          count: getListenerCount(io, prevSlug),
        });
      }

      (socket as any).stationSlug = slug;
      socket.join(`station:${slug}`);
      io.to(`station:${slug}`).emit("listener_count", {
        slug,
        count: getListenerCount(io, slug),
      });
    });

    socket.on("leave_station", () => {
      const slug = (socket as any).stationSlug as string | undefined;
      if (!slug) return;
      socket.leave(`station:${slug}`);
      (socket as any).stationSlug = undefined;
      io.to(`station:${slug}`).emit("listener_count", {
        slug,
        count: getListenerCount(io, slug),
      });
    });

    socket.on("disconnect", () => {
      const slug = (socket as any).stationSlug as string | undefined;
      if (!slug) return;
      io.to(`station:${slug}`).emit("listener_count", {
        slug,
        count: getListenerCount(io, slug),
      });
    });

    handleChat(io, socket);
    handleReactions(io, socket);
  });
}
