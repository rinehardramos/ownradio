import OpenAI from 'openai';
import hash from 'imghash';
import { uploadToR2, downloadFromUrl } from '../lib/r2.js';
import { prisma } from '../db/client.js';

export interface AvatarGeneratorOptions {
  djId: string;
  djName: string;
  djBio: string;
  genre: string;
}

const PROVIDER = process.env.AVATAR_PROVIDER ?? 'openai';
const MODEL = process.env.AVATAR_MODEL ?? 'dall-e-3';
const THRESHOLD = Number(process.env.AVATAR_PHASH_THRESHOLD ?? 90);
const MAX_RETRIES = Number(process.env.AVATAR_MAX_RETRIES ?? 3);
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

function buildPrompt(opts: AvatarGeneratorOptions, variation = ''): string {
  const bio = opts.djBio.slice(0, 120);
  return `Professional DJ portrait photograph of a ${opts.genre} music artist named ${opts.djName}. Persona: ${bio}. Photorealistic, studio lighting, looking at camera, unique facial features, high detail, no text, no watermark.${variation}`;
}

function hammingDistance(a: string, b: string): number {
  let dist = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return Math.round(((maxLen - hammingDistance(a, b)) / maxLen) * 100);
}

async function getExistingHashes(): Promise<string[]> {
  const djs = await prisma.dJ.findMany({ where: { avatarUrl: { not: null } }, select: { avatarUrl: true } });
  const hashes: string[] = [];
  for (const dj of djs) {
    try {
      const buf = await downloadFromUrl(dj.avatarUrl!);
      hashes.push(await hash.hash(buf, 16));
    } catch { /* skip unreachable avatars */ }
  }
  return hashes;
}

export async function generateDjAvatar(opts: AvatarGeneratorOptions): Promise<string> {
  if (PROVIDER === 'mock') {
    return `${PUBLIC_URL}/placeholders/djs/mock.jpg`;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const existingHashes = await getExistingHashes();

  const variations = [
    '',
    ' distinct from previous, different hair colour and style',
    ' clearly different ethnicity, unique facial structure',
  ];

  let imgBuffer: Buffer | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const prompt = buildPrompt(opts, variations[attempt] ?? variations[variations.length - 1]);
    const result = await openai.images.generate({ model: MODEL, prompt, size: '1024x1024', quality: 'standard', n: 1 });
    const tmpUrl = result.data[0].url!;
    const buf = await downloadFromUrl(tmpUrl);
    const imgHash = await hash.hash(buf, 16);

    const isTooSimilar = existingHashes.some((h) => similarity(imgHash, h) > THRESHOLD);
    if (!isTooSimilar) {
      imgBuffer = buf;
      break;
    }
  }

  if (!imgBuffer) {
    // All retries exhausted — use last generated image anyway
    const prompt = buildPrompt(opts);
    const result = await openai.images.generate({ model: MODEL, prompt, size: '1024x1024', quality: 'standard', n: 1 });
    imgBuffer = await downloadFromUrl(result.data[0].url!);
  }

  const key = `djs/${opts.djId}.jpg`;
  await uploadToR2(key, imgBuffer, 'image/jpeg');
  return `${PUBLIC_URL}/${key}`;
}
