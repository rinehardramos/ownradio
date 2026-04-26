import type { Listener, StationWithDJ, Song } from "@ownradio/shared";

const TOKEN_KEY = "ownradio_token";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  return url;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...buildHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function login(
  email: string,
  password: string
): Promise<{ user: Listener; token: string }> {
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed: ${body}`);
  }

  const data = (await res.json()) as { user: Listener; token: string };
  setToken(data.token);
  return data;
}

export function logout(): void {
  removeToken();
}

export async function getMe(): Promise<Listener> {
  return apiFetch<Listener>("/me");
}

export async function getStations(): Promise<StationWithDJ[]> {
  return apiFetch<StationWithDJ[]>("/stations");
}

export async function getStation(slug: string): Promise<StationWithDJ> {
  return apiFetch<StationWithDJ>(`/stations/${slug}`);
}

export async function getStationTopSongs(slug: string): Promise<Song[]> {
  return apiFetch<Song[]>(`/stations/${slug}/top-songs`);
}

// --- User Station APIs ---

export interface CreateStationPayload {
  name: string;
  genre: string;
  slug: string;
  description?: string;
}

export interface CreateDjPayload {
  stationSlug: string;
  name: string;
  bio: string;
  localeCities: string[];
  languages: Array<{ code: string; weight: number }>;
  personality?: string;
  ttsVoiceId?: string;
}

export interface CreateProgramPayload {
  title: string;
  scheduledAt: string;
  durationSecs: number;
  description?: string;
}

export interface ReadinessCheck {
  station: boolean;
  dj: boolean;
  program: boolean;
  status: 'off_air' | 'on_air';
}

export interface TtsVoice {
  id: string;
  name: string;
  locale: string;
}

export function createUserStation(data: CreateStationPayload) {
  return apiFetch('/user/stations', { method: 'POST', body: JSON.stringify(data) });
}

export function getUserStations() {
  return apiFetch('/user/stations');
}

export function createDjProfile(data: CreateDjPayload) {
  return apiFetch('/user/dj-profiles', { method: 'POST', body: JSON.stringify(data) });
}

export function getTtsVoices(): Promise<TtsVoice[]> {
  return apiFetch('/user/tts-voices');
}

export function createStationProgram(slug: string, data: CreateProgramPayload) {
  return apiFetch(`/user/stations/${slug}/programs`, {
    method: 'POST', body: JSON.stringify(data),
  });
}

export function getStationReadiness(slug: string): Promise<ReadinessCheck> {
  return apiFetch(`/user/stations/${slug}/readiness`);
}
