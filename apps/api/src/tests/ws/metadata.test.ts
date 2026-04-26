import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchIcecastMetadata } from '../../ws/metadata.js';

afterEach(() => vi.restoreAllMocks());

describe('fetchIcecastMetadata', () => {
  it('parses PlayGen flat format (artist + song fields)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ artist: 'Maki', song: 'Dilaw', title: 'Maki - Dilaw' }),
    }));
    const result = await fetchIcecastMetadata('https://api.playgen.site/stream/x/status.json');
    expect(result).toEqual({ artist: 'Maki', title: 'Dilaw' });
  });

  it('parses Icecast nested format', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ icestats: { source: { title: 'AC/DC - Highway to Hell' } } }),
    }));
    const result = await fetchIcecastMetadata('https://example.com/status.json');
    expect(result).toEqual({ artist: 'AC/DC', title: 'Highway to Hell' });
  });

  it('returns null when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const result = await fetchIcecastMetadata('https://example.com/status.json');
    expect(result).toBeNull();
  });

  it('returns null when no recognisable fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ unknown: 'data' }),
    }));
    const result = await fetchIcecastMetadata('https://example.com/status.json');
    expect(result).toBeNull();
  });
});
