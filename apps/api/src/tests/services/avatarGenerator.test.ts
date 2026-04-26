import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/r2.js', () => ({
  uploadToR2: vi.fn().mockResolvedValue(undefined),
  downloadFromUrl: vi.fn().mockResolvedValue(Buffer.from('fakeimage')),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    images: {
      generate: vi.fn().mockResolvedValue({
        data: [{ url: 'https://oai.example.com/tmp/img.png' }],
      }),
    },
  })),
}));

vi.mock('imghash', () => ({
  default: { hash: vi.fn().mockResolvedValue('abcdef123456') },
}));

vi.mock('../../db/client.js', () => ({
  prisma: {
    dJ: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

describe('generateDjAvatar — mock provider', () => {
  beforeEach(() => {
    process.env.AVATAR_PROVIDER = 'mock';
    process.env.R2_PUBLIC_URL = 'https://assets.example.com';
  });

  it('returns placeholder URL without calling DALL-E', async () => {
    const { generateDjAvatar } = await import('../../services/avatarGenerator.js');
    const url = await generateDjAvatar({ djId: 'dj1', djName: 'DJ Test', djBio: 'Bio', genre: 'Rock' });
    expect(url).toBe('https://assets.example.com/placeholders/djs/mock.jpg');
  });
});

describe('generateDjAvatar — openai provider', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AVATAR_PROVIDER = 'openai';
    process.env.R2_PUBLIC_URL = 'https://assets.example.com';
    process.env.AVATAR_MAX_RETRIES = '3';
    process.env.AVATAR_PHASH_THRESHOLD = '90';
  });

  it('calls DALL-E, uploads to R2, returns public URL', async () => {
    const { generateDjAvatar } = await import('../../services/avatarGenerator.js');
    const { uploadToR2 } = await import('../../lib/r2.js');
    const url = await generateDjAvatar({ djId: 'dj99', djName: 'DJ Nova', djBio: 'Bio text', genre: 'Lo-Fi' });
    expect(url).toBe('https://assets.example.com/djs/dj99.jpg');
    expect(uploadToR2).toHaveBeenCalledWith('djs/dj99.jpg', expect.any(Buffer), 'image/jpeg');
  });
});
