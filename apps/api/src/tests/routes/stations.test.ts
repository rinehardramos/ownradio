import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import supertest from "supertest";
import { buildApp } from "../../server.js";

// Mock Prisma client
vi.mock("../../db/client.js", () => ({
  prisma: {
    station: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    song: {
      findMany: vi.fn(),
    },
    dJ: {
      update: vi.fn(),
    },
    program: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("../../services/avatarGenerator.js", () => ({
  generateDjAvatar: vi.fn().mockResolvedValue("https://assets.example.com/djs/dj-new.jpg"),
}));

import { prisma } from "../../db/client.js";
import { generateDjAvatar } from "../../services/avatarGenerator.js";

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

const NEW_STATION = {
  id: "st-new",
  name: "Metro Manila Mix",
  slug: "metro-manila-mix",
  description: "Metro Manila's Freshest Mix",
  streamUrl: "https://cdn.example.com/metro/playlist.m3u8",
  metadataUrl: null,
  genre: "OPM",
  artworkUrl: null,
  isLive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  dj: { id: "dj-new", stationId: "st-new", name: "Camille", bio: "Taglish DJ", avatarUrl: null },
};

describe("POST /stations", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => vi.clearAllMocks());

  it("creates a new station and returns 201", async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.station.create).mockResolvedValue(NEW_STATION as any);

    const res = await supertest(app.server)
      .post("/stations")
      .set("x-playgen-secret", "")
      .send({
        slug: "metro-manila-mix",
        name: "Metro Manila Mix",
        description: "Metro Manila's Freshest Mix",
        genre: "OPM",
        streamUrl: "https://cdn.example.com/metro/playlist.m3u8",
        dj: { name: "Camille", bio: "Taglish DJ" },
      });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe("metro-manila-mix");
    expect(res.body.dj.name).toBe("Camille");
  });

  it("upserts (200) when station slug already exists", async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(NEW_STATION as any);
    vi.mocked(prisma.station.update).mockResolvedValue({
      ...NEW_STATION,
      streamUrl: "https://cdn.example.com/metro/v2.m3u8",
    } as any);

    const res = await supertest(app.server)
      .post("/stations")
      .set("x-playgen-secret", "")
      .send({
        slug: "metro-manila-mix",
        name: "Metro Manila Mix",
        streamUrl: "https://cdn.example.com/metro/v2.m3u8",
      });

    expect(res.status).toBe(200);
    expect(prisma.station.update).toHaveBeenCalledOnce();
    expect(prisma.station.create).not.toHaveBeenCalled();
  });

  it("returns 400 when slug is missing", async () => {
    const res = await supertest(app.server)
      .post("/stations")
      .set("x-playgen-secret", "")
      .send({ name: "No Slug Station" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when name is missing", async () => {
    const res = await supertest(app.server)
      .post("/stations")
      .set("x-playgen-secret", "")
      .send({ slug: "no-name" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("generates avatar when DJ is created without avatarUrl", async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.station.create).mockResolvedValue({
      ...NEW_STATION,
      dj: { ...NEW_STATION.dj, avatarUrl: null },
    } as any);
    vi.mocked(prisma.dJ.update).mockResolvedValue({
      ...NEW_STATION.dj,
      avatarUrl: "https://assets.example.com/djs/dj-new.jpg",
    } as any);

    const res = await supertest(app.server)
      .post("/stations")
      .set("x-playgen-secret", "")
      .send({ slug: "metro-manila-mix", name: "Metro Manila Mix", genre: "OPM", dj: { name: "Camille", bio: "Taglish DJ" } });

    expect(res.status).toBe(201);
    expect(vi.mocked(generateDjAvatar)).toHaveBeenCalledWith(
      expect.objectContaining({ djName: "Camille", genre: "OPM" })
    );
  });
});

describe("GET /stations", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => vi.clearAllMocks());

  it("returns array of stations with dj name", async () => {
    vi.mocked(prisma.station.findMany).mockResolvedValue([{ ...MOCK_STATION, songs: [] }] as any);
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

  afterEach(() => vi.clearAllMocks());

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
    expect(res.body.error).toBeDefined();
  });
});

describe("GET /stations/:slug/top-songs", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  const MOCK_SONGS = [
    { id: "song1", title: "Rock Anthem", artist: "The Rockers", playCount: 100, stationId: "st1" },
    { id: "song2", title: "Power Chord", artist: "Guitar Hero", playCount: 80, stationId: "st1" },
  ];

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => vi.clearAllMocks());

  it("returns top songs for a valid station slug", async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(MOCK_STATION as any);
    vi.mocked(prisma.song.findMany).mockResolvedValue(MOCK_SONGS as any);
    const res = await supertest(app.server).get("/stations/rock-haven/top-songs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe("Rock Anthem");
  });

  it("returns 404 when station slug is not found", async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(null);
    const res = await supertest(app.server).get("/stations/unknown/top-songs");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /stations/:slug/programs', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  const MOCK_PROGRAMS = [
    {
      id: 'prog1',
      stationId: 'st1',
      djId: 'dj1',
      title: 'Late Night Vibes ep 1',
      description: null,
      recordedAt: new Date('2026-04-26T02:00:00Z'),
      durationSecs: 3600,
      playbackUrl: 'programs/prog1.mp3',
      coverArtUrl: null,
      createdAt: new Date(),
    },
  ];

  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });
  afterEach(() => vi.clearAllMocks());

  it('returns programs for a valid station slug', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(MOCK_STATION as any);
    vi.mocked(prisma.program.findMany).mockResolvedValue(MOCK_PROGRAMS as any);

    const res = await supertest(app.server).get('/stations/rock-haven/programs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Late Night Vibes ep 1');
  });

  it('returns 404 for unknown station', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(null);
    const res = await supertest(app.server).get('/stations/unknown/programs');
    expect(res.status).toBe(404);
  });
});
