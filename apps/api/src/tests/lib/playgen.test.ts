import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const TEST_BASE = 'MOCK_PLAYGEN';

beforeEach(() => {
  vi.stubEnv('PLAYGEN_BASE_URL', TEST_BASE);
  vi.stubEnv('PLAYGEN_API_KEY', 'test-key');
  vi.stubEnv('PLAYGEN_COMPANY_ID', 'co-123');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('createPlayGenStation', () => {
  it('POSTs to /companies/:companyId/stations and returns the created station', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'pg-st-1', name: 'Test FM', slug: 'test-fm' }),
    }));
    const { createPlayGenStation } = await import('../../lib/playgen.js');
    const result = await createPlayGenStation({ name: 'Test FM', genre: 'OPM', slug: 'test-fm' });
    expect(result).toMatchObject({ id: 'pg-st-1', slug: 'test-fm' });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      `${TEST_BASE}/companies/co-123/stations`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 422,
      json: async () => ({ error: 'Invalid' }),
    }));
    const { createPlayGenStation } = await import('../../lib/playgen.js');
    await expect(createPlayGenStation({ name: 'Bad', genre: '', slug: 'bad' }))
      .rejects.toThrow('PlayGen error 422');
  });
});

describe('createDjProfile', () => {
  it('POSTs to /dj/profiles', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'pg-dj-1', name: 'DJ Rino' }),
    }));
    const { createDjProfile } = await import('../../lib/playgen.js');
    const result = await createDjProfile({
      name: 'DJ Rino', bio: 'OPM DJ',
      localeCities: ['Manila'],
      languages: [{ code: 'fil', weight: 0.8 }, { code: 'en', weight: 0.2 }],
    });
    expect(result).toMatchObject({ id: 'pg-dj-1' });
  });
});

describe('listTtsVoices', () => {
  it('GETs /dj/tts/voices', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'v1', name: 'Jasmine', locale: 'fil-PH' }],
    }));
    const { listTtsVoices } = await import('../../lib/playgen.js');
    const voices = await listTtsVoices();
    expect(voices).toHaveLength(1);
    expect(voices[0].id).toBe('v1');
  });
});
