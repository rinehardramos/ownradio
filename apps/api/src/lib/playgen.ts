const BASE = process.env.PLAYGEN_BASE_URL ?? '';
const API_KEY = process.env.PLAYGEN_API_KEY ?? '';
const COMPANY_ID = process.env.PLAYGEN_COMPANY_ID ?? '';

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    throw new Error(`PlayGen error ${res.status}: ${JSON.stringify(await res.json())}`);
  }
  return res.json() as Promise<T>;
}

export interface PlayGenStation {
  id: string;
  name: string;
  slug: string;
  streamUrl?: string;
  metadataUrl?: string;
}

export interface PlayGenDjProfile {
  id: string;
  name: string;
  bio?: string;
}

export interface PlayGenProgram {
  id: string;
  stationId: string;
  title: string;
}

export interface TtsVoice {
  id: string;
  name: string;
  locale: string;
}

export interface LanguageWeight {
  code: string;
  weight: number;
}

export function createPlayGenStation(data: {
  name: string;
  genre: string;
  slug: string;
  description?: string;
}): Promise<PlayGenStation> {
  return call('POST', `/companies/${COMPANY_ID}/stations`, data);
}

export function createDjProfile(data: {
  name: string;
  bio: string;
  localeCities: string[];
  languages: LanguageWeight[];
  personality?: string;
  ttsVoiceId?: string;
}): Promise<PlayGenDjProfile> {
  return call('POST', '/dj/profiles', data);
}

export function listDjProfiles(): Promise<PlayGenDjProfile[]> {
  return call('GET', '/dj/profiles');
}

export function assignDjToStation(
  stationId: string,
  djId: string,
): Promise<{ ok: boolean }> {
  return call('POST', `/stations/${stationId}/dj`, { djId });
}

export function createPlayGenProgram(
  stationId: string,
  data: {
    title: string;
    description?: string;
    scheduledAt: string;
    durationSecs: number;
  },
): Promise<PlayGenProgram> {
  return call('POST', `/stations/${stationId}/programs`, data);
}

export function listTtsVoices(): Promise<TtsVoice[]> {
  return call('GET', '/dj/tts/voices');
}
