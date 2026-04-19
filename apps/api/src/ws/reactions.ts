import type { Server as IOServer, Socket } from "socket.io";
import { prisma } from "../db/client.js";
import type { ReactionType } from "@ownradio/shared";

// Debounce map: stationId:songId -> timeout
const debounceMap = new Map<string, NodeJS.Timeout>();

async function broadcastReactionCounts(
  io: IOServer,
  stationId: string,
  stationSlug: string,
  songId: string,
) {
  const groups = await prisma.reaction.groupBy({
    by: ["type"],
    where: { stationId, songId },
    _count: { type: true },
  });

  const counts = { heart: 0, rock: 0, party: 0, broken_heart: 0 };
  for (const group of groups) {
    (counts as any)[group.type] = group._count.type;
  }

  io.to(`station:${stationSlug}`).emit("reaction_update", { songId, counts });
}

export function handleReactions(io: IOServer, socket: Socket) {
  socket.on(
    "reaction",
    async (data: { songId: string; stationId: string; type: ReactionType }) => {
      const userId: string | null = (socket as any).userId ?? null;
      const stationSlug: string = (socket as any).stationSlug;

      if (!stationSlug) return;

      try {
        const existing = await prisma.reaction.findFirst({
          where: {
            songId: data.songId,
            stationId: data.stationId,
            listenerId: userId,
            type: data.type,
          },
        });

        if (existing) {
          await prisma.reaction.delete({ where: { id: existing.id } });
        } else {
          await prisma.reaction.create({
            data: {
              songId: data.songId,
              stationId: data.stationId,
              listenerId: userId,
              type: data.type,
            },
          });
        }

        // Debounce broadcast: 500ms
        const key = `${data.stationId}:${data.songId}`;
        const existingTimeout = debounceMap.get(key);
        if (existingTimeout) clearTimeout(existingTimeout);
        debounceMap.set(
          key,
          setTimeout(() => {
            debounceMap.delete(key);
            broadcastReactionCounts(io, data.stationId, stationSlug, data.songId);
          }, 500),
        );
      } catch {
        socket.emit("error", { message: "Failed to process reaction" });
      }
    },
  );
}
