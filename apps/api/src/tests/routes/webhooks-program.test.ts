import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../server.js';

vi.mock('../../db/client.js', () => ({
  prisma: {
    station: { findUnique: vi.fn() },
    program: { upsert: vi.fn() },
    song: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { prisma } from '../../db/client.js';

const MOCK_STATION = { id: 'st1', slug: 'rock-haven', dj: { id: 'dj1' } };
const CLOUD_PLAYBACK_URL = 'https://cdn.playgen.site/programs/prog1.mp3';
const MOCK_PROGRAM = {
  id: 'prog1', stationId: 'st1', djId: 'dj1',
  title: 'Late Night Vibes ep 1', description: null,
  recordedAt: new Date('2026-04-26T02:00:00Z'),
  durationSecs: 3600, playbackUrl: CLOUD_PLAYBACK_URL,
  coverArtUrl: null, createdAt: new Date(),
};

describe('POST /webhooks/stations/:slug/program', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });
  afterEach(() => vi.clearAllMocks());

  it('creates a program and returns 201', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(MOCK_STATION as any);
    vi.mocked(prisma.program.upsert).mockResolvedValue(MOCK_PROGRAM as any);

    const res = await supertest(app.server)
      .post('/webhooks/stations/rock-haven/program')
      .set('x-playgen-secret', '')
      .send({
        title: 'Late Night Vibes ep 1',
        recordedAt: '2026-04-26T02:00:00Z',
        durationSecs: 3600,
        playbackUrl: CLOUD_PLAYBACK_URL,
      });

    expect(res.status).toBe(201);
    expect(res.body.program.title).toBe('Late Night Vibes ep 1');
  });

  it('returns 422 when playbackUrl is a local/non-cloud URL', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(MOCK_STATION as any);
    const res = await supertest(app.server)
      .post('/webhooks/stations/rock-haven/program')
      .set('x-playgen-secret', '')
      .send({
        title: 'Local Show',
        recordedAt: '2026-04-26T02:00:00Z',
        durationSecs: 3600,
        playbackUrl: 'http://localhost:3000/programs/local.mp3',
      });
    expect(res.status).toBe(422);
  });

  it('returns 401 when a configured secret is sent incorrectly', async () => {
    const original = process.env.PLAYGEN_WEBHOOK_SECRET;
    process.env.PLAYGEN_WEBHOOK_SECRET = 'test-only-not-real';
    const res = await supertest(app.server)
      .post('/webhooks/stations/rock-haven/program')
      .set('x-playgen-secret', 'wrong-value')
      .send({ title: 'T', recordedAt: '2026-04-26T00:00:00Z', durationSecs: 1, playbackUrl: 'programs/t.mp3' });
    expect(res.status).toBe(401);
    if (original === undefined) {
      delete process.env.PLAYGEN_WEBHOOK_SECRET;
    } else {
      process.env.PLAYGEN_WEBHOOK_SECRET = original;
    }
  });

  it('returns 400 when required fields are missing', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(MOCK_STATION as any);
    const res = await supertest(app.server)
      .post('/webhooks/stations/rock-haven/program')
      .set('x-playgen-secret', '')
      .send({ title: 'Incomplete' });
    expect(res.status).toBe(400);
  });
});
