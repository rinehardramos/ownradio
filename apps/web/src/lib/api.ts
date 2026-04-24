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
