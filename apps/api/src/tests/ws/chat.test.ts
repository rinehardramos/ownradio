import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { io as ioClient } from "socket.io-client";

// Mock prisma
vi.mock("../../db/client.js", () => ({
  prisma: {
    station: { findUnique: vi.fn() },
    chatMessage: { create: vi.fn() },
    reaction: { findFirst: vi.fn(), create: vi.fn(), delete: vi.fn(), groupBy: vi.fn() },
  },
}));

import { prisma } from "../../db/client.js";
import { setupSocketHandlers } from "../../ws/index.js";

describe("WebSocket chat", () => {
  let httpServer: ReturnType<typeof createServer>;
  let io: IOServer;
  let port: number;

  beforeAll(async () => {
    httpServer = createServer();
    io = new IOServer(httpServer, { cors: { origin: "*" } });
    setupSocketHandlers(io);
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it("broadcasts new_message when client sends chat_message", async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue({
      id: "st1",
      slug: "rock-haven",
    } as any);
    vi.mocked(prisma.chatMessage.create).mockResolvedValue({
      id: "msg1",
      stationId: "st1",
      listenerId: null,
      displayName: "Guest",
      content: "Hello!",
      createdAt: new Date(),
    } as any);

    const client = ioClient(`http://localhost:${port}`);

    await new Promise<void>((resolve) => client.on("connect", resolve));
    client.emit("join_station", { slug: "rock-haven" });

    const messageReceived = new Promise<any>((resolve) => {
      client.on("new_message", resolve);
    });

    // Small delay for join to process
    await new Promise((r) => setTimeout(r, 50));
    client.emit("chat_message", { stationId: "st1", content: "Hello!" });

    const msg = await messageReceived;
    expect(msg.content).toBe("Hello!");

    client.disconnect();
  });
});
