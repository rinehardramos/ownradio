import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../server.js';

vi.mock('../../db/client.js', () => ({
  prisma: {
    station: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    dJ: { create: vi.fn(), update: vi.fn() },
    stationProgram: { create: vi.fn() },
    listener: { findUnique: vi.fn() },
    song: { findMany: vi.fn() },
    program: { findMany: vi.fn() },
  },
}));

vi.mock('../../lib/playgen.js', () => ({
  createPlayGenStation: vi.fn(),
  createDjProfile: vi.fn(),
  listDjProfiles: vi.fn(),
  assignDjToStation: vi.fn(),
  createPlayGenProgram: vi.fn(),
  listTtsVoices: vi.fn(),
}));

vi.mock('../../services/avatarGenerator.js', () => ({
  generateDjAvatar: vi.fn().mockResolvedValue('mock-avatar'),
}));

vi.mock('../../lib/jwt.js', () => ({
  signToken: vi.fn(),
  verifyToken: vi.fn().mockReturnValue({ userId: 'usr-1', username: 'testuser' }),
}));

import { prisma } from '../../db/client.js';
import * as playgen from '../../lib/playgen.js';

const AUTH = 'Bearer test-jwt';

// --- POST /user/stations ---

describe('POST /user/stations', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });
  afterEach(() => vi.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await supertest(app.server)
      .post('/user/stations')
      .send({ name: 'Test', genre: 'OPM', slug: 'test-fm' });
    expect(res.status).toBe(401);
  });

  it('creates station and calls PlayGen, returns 201', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(null);
    vi.mocked(playgen.createPlayGenStation).mockResolvedValue({
      id: 'pg-1', name: 'Test FM', slug: 'test-fm',
    });
    vi.mocked(prisma.station.create).mockResolvedValue({
      id: 'st-1', slug: 'test-fm', name: 'Test FM', genre: 'OPM',
      description: '', streamUrl: '', metadataUrl: '', artworkUrl: null,
      isLive: false, status: 'off_air', playgenStationId: 'pg-1',
      ownerId: 'usr-1', dj: null, createdAt: new Date(), updatedAt: new Date(),
    } as any);

    const res = await supertest(app.server)
      .post('/user/stations')
      .set('Authorization', AUTH)
      .send({ name: 'Test FM', genre: 'OPM', slug: 'test-fm' });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('test-fm');
    expect(vi.mocked(playgen.createPlayGenStation)).toHaveBeenCalledOnce();
  });

  it('returns 409 when slug taken', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue({ id: 'st-1' } as any);
    const res = await supertest(app.server)
      .post('/user/stations')
      .set('Authorization', AUTH)
      .send({ name: 'Test FM', genre: 'OPM', slug: 'test-fm' });
    expect(res.status).toBe(409);
  });

  it('returns 400 when slug missing', async () => {
    const res = await supertest(app.server)
      .post('/user/stations')
      .set('Authorization', AUTH)
      .send({ name: 'Test FM', genre: 'OPM' });
    expect(res.status).toBe(400);
  });
});

// --- POST /user/dj-profiles ---

describe('POST /user/dj-profiles', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });
  afterEach(() => vi.clearAllMocks());

  it('creates DJ via PlayGen and saves to DB', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue({
      id: 'st-1', ownerId: 'usr-1', playgenStationId: 'pg-1', slug: 'test-fm',
    } as any);
    vi.mocked(playgen.createDjProfile).mockResolvedValue({ id: 'pg-dj-1', name: 'DJ Rino' });
    vi.mocked(playgen.assignDjToStation).mockResolvedValue({ ok: true });
    vi.mocked(prisma.dJ.create).mockResolvedValue({
      id: 'dj-1', stationId: 'st-1', name: 'DJ Rino', bio: 'OPM DJ',
      avatarUrl: null, playgenDjId: 'pg-dj-1',
      localeCities: ['Manila'], languages: [{ code: 'fil', weight: 1 }],
      personality: null,
    } as any);

    const res = await supertest(app.server)
      .post('/user/dj-profiles')
      .set('Authorization', AUTH)
      .send({
        stationSlug: 'test-fm', name: 'DJ Rino', bio: 'OPM DJ',
        localeCities: ['Manila'], languages: [{ code: 'fil', weight: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('DJ Rino');
  });

  it('returns 400 when fields missing', async () => {
    const res = await supertest(app.server)
      .post('/user/dj-profiles')
      .set('Authorization', AUTH)
      .send({ name: 'DJ Rino' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when station not owned', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue({
      id: 'st-1', ownerId: 'other-user', slug: 'test-fm',
    } as any);
    const res = await supertest(app.server)
      .post('/user/dj-profiles')
      .set('Authorization', AUTH)
      .send({
        stationSlug: 'test-fm', name: 'DJ', bio: 'bio',
        localeCities: ['Manila'], languages: [{ code: 'fil', weight: 1 }],
      });
    expect(res.status).toBe(404);
  });
});

// --- GET /user/tts-voices ---

describe('GET /user/tts-voices', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });
  afterEach(() => vi.clearAllMocks());

  it('returns TTS voice list', async () => {
    vi.mocked(playgen.listTtsVoices).mockResolvedValue([
      { id: 'v1', name: 'Jasmine', locale: 'fil-PH' },
    ]);
    const res = await supertest(app.server)
      .get('/user/tts-voices')
      .set('Authorization', AUTH);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// --- POST /user/stations/:slug/programs ---

describe('POST /user/stations/:slug/programs', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });
  afterEach(() => vi.clearAllMocks());

  it('creates program via PlayGen and saves StationProgram', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue({
      id: 'st-1', ownerId: 'usr-1', playgenStationId: 'pg-1', slug: 'test-fm',
    } as any);
    vi.mocked(playgen.createPlayGenProgram).mockResolvedValue({
      id: 'pg-prog-1', stationId: 'pg-1', title: 'Morning OPM',
    });
    vi.mocked(prisma.stationProgram.create).mockResolvedValue({
      id: 'prog-1', stationId: 'st-1', playgenProgramId: 'pg-prog-1',
      title: 'Morning OPM', description: null,
      scheduledAt: new Date('2026-05-01T08:00:00Z'),
      durationSecs: 3600, createdAt: new Date(),
    } as any);

    const res = await supertest(app.server)
      .post('/user/stations/test-fm/programs')
      .set('Authorization', AUTH)
      .send({ title: 'Morning OPM', scheduledAt: '2026-05-01T08:00:00Z', durationSecs: 3600 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Morning OPM');
  });

  it('returns 404 for unknown station', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(null);
    const res = await supertest(app.server)
      .post('/user/stations/unknown/programs')
      .set('Authorization', AUTH)
      .send({ title: 'X', scheduledAt: '2026-05-01T08:00:00Z', durationSecs: 3600 });
    expect(res.status).toBe(404);
  });

  it('returns 400 when title missing', async () => {
    const res = await supertest(app.server)
      .post('/user/stations/test-fm/programs')
      .set('Authorization', AUTH)
      .send({ scheduledAt: '2026-05-01T08:00:00Z', durationSecs: 3600 });
    expect(res.status).toBe(400);
  });
});

// --- GET /user/stations/:slug/readiness ---

describe('GET /user/stations/:slug/readiness', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });
  afterEach(() => vi.clearAllMocks());

  it('returns on_air when all checks pass', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue({
      id: 'st-1', ownerId: 'usr-1', slug: 'test-fm', status: 'off_air',
      playgenStationId: 'pg-1',
      dj: { id: 'dj-1', playgenDjId: 'pg-dj-1' },
      stationPrograms: [{ id: 'prog-1' }],
    } as any);
    vi.mocked(prisma.station.update).mockResolvedValue({ status: 'on_air' } as any);

    const res = await supertest(app.server)
      .get('/user/stations/test-fm/readiness')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      station: true, dj: true, program: true, status: 'on_air',
    });
    expect(vi.mocked(prisma.station.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'on_air', isLive: true } }),
    );
  });

  it('returns off_air when DJ missing', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue({
      id: 'st-1', ownerId: 'usr-1', slug: 'test-fm', status: 'off_air',
      playgenStationId: 'pg-1', dj: null, stationPrograms: [],
    } as any);

    const res = await supertest(app.server)
      .get('/user/stations/test-fm/readiness')
      .set('Authorization', AUTH);

    expect(res.body.dj).toBe(false);
    expect(res.body.program).toBe(false);
    expect(res.body.status).toBe('off_air');
    expect(prisma.station.update).not.toHaveBeenCalled();
  });

  it('returns 404 for unowned station', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue({
      id: 'st-1', ownerId: 'other-user', slug: 'test-fm', status: 'off_air',
      playgenStationId: 'pg-1', dj: null, stationPrograms: [],
    } as any);

    const res = await supertest(app.server)
      .get('/user/stations/test-fm/readiness')
      .set('Authorization', AUTH);

    expect(res.status).toBe(404);
  });
});
