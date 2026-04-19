import type { Server as IOServer, Socket } from "socket.io";
import { prisma } from "../db/client.js";

export function handleChat(io: IOServer, socket: Socket) {
  socket.on("chat_message", async (data: { stationId: string; content: string }) => {
    // Get user from socket data (set during join)
    const stationSlug: string = (socket as any).stationSlug;
    const userId: string | null = (socket as any).userId ?? null;
    const username: string = (socket as any).username ?? "Guest";

    if (!stationSlug) return;

    const content = data.content?.trim();
    if (!content || content.length === 0 || content.length > 280) return;

    try {
      const message = await prisma.chatMessage.create({
        data: {
          stationId: data.stationId,
          listenerId: userId,
          displayName: username,
          content,
        },
      });

      io.to(`station:${stationSlug}`).emit("new_message", {
        id: message.id,
        stationId: message.stationId,
        listenerId: message.listenerId,
        displayName: message.displayName,
        content: message.content,
        createdAt: message.createdAt,
      });
    } catch {
      socket.emit("error", { message: "Failed to send message" });
    }
  });
}
