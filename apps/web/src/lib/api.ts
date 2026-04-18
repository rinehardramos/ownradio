import type { Listener, Station, Song, StationWithDJ } from "@ownradio/shared";

const ACCESS_TOKEN_KEY = "ownradio_access_token";
const REFRESH_TOKEN_KEY = "ownradio_refresh_token";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:80";
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function buildHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const t = token ?? getAccessToken();
  if (t) {
    headers["Authorization"] = `Bearer ${t}`;
  }
  return headers;
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string };
  setAccessToken(data.access_token);
  return data.access_token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _retried = false
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...buildHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401 && !_retried) {
    try {
      const newToken = await refreshAccessToken();
      const retryRes = await fetch(url, {
        ...options,
        headers: {
          ...buildHeaders(newToken),
          ...(options.headers as Record<string, string> | undefined),
        },
      });

      if (!retryRes.ok) {
        const body = await retryRes.text();
        throw new Error(
          `API error ${retryRes.status} ${retryRes.statusText}: ${body}`
        );
      }

      return retryRes.json() as Promise<T>;
    } catch {
      throw new Error("Authentication failed — please log in again");
    }
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status} ${res.statusText}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// Typed helpers

export async function login(
  email: string,
  password: string
): Promise<{ access_token: string; refresh_token: string; user?: Listener }> {
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed ${res.status} ${res.statusText}: ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    user?: Listener;
  };
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  return data;
}

export function logout(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function getMe(): Promise<Listener> {
  return apiFetch<Listener>("/me");
}

export async function getStations(companyId: string): Promise<Station[]> {
  return apiFetch<Station[]>(`/companies/${companyId}/stations`);
}

export async function getStation(id: string): Promise<StationWithDJ> {
  return apiFetch<StationWithDJ>(`/stations/${id}`);
}

export async function getStationSongs(id: string): Promise<Song[]> {
  return apiFetch<Song[]>(`/stations/${id}/songs`);
}
