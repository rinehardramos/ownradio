import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import supertest from "supertest";
import { buildApp } from "../../server.js";

// Mock Prisma client
vi.mock("../../db/client.js", () => ({
  prisma: {
    station: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    song: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "../../db/client.js";

const MOCK_STATION = {
  id: "st1",
  name: "Rock Haven",
  slug: "rock-haven",
  description: "Rock music 24/7",
  streamUrl: "http://stream.example.com/rock",
  metadataUrl: "http://stream.example.com/rock/status",
  genre: "Rock",
  artworkUrl: null,
  isLive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  dj: {
    id: "dj1",
    stationId: "st1",
    name: "DJ Rock",
    bio: "Rock DJ",
    avatarUrl: null,
  },
};

describe("GET /stations", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns array of stations with dj name", async () => {
    vi.mocked(prisma.station.findMany).mockResolvedValue([MOCK_STATION] as any);
    const res = await supertest(app.server).get("/stations");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe("Rock Haven");
    expect(res.body[0].dj.name).toBe("DJ Rock");
  });
});

describe("GET /stations/:slug", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns station detail with DJ", async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(MOCK_STATION as any);
    const res = await supertest(app.server).get("/stations/rock-haven");
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe("rock-haven");
    expect(res.body.dj.name).toBe("DJ Rock");
  });

  it("returns 404 for unknown slug", async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(null);
    const res = await supertest(app.server).get("/stations/unknown");
    expect(res.status).toBe(404);
  });
});
