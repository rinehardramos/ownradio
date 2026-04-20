# Frontend/Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Next.js frontend to the real Fastify API and Socket.io backend, replacing all mock data and local state so the app works end-to-end with local Docker Compose.

**Architecture:** Fix the API client contract mismatch (wrong token fields, wrong endpoints), create a Socket.io singleton, rebuild the `useStation` hook with real-time wiring, and replace `MOCK_STATIONS` in both server-rendered pages with live API fetches.

**Tech Stack:** TypeScript, Next.js 15 (App Router), Socket.io client, Fastify backend on port 4000.

**Spec:** `docs/superpowers/specs/2026-04-19-frontend-backend-integration.md`

**Environment:** All URLs come from `.env.local` — never hardcoded. `NEXT_PUBLIC_API_URL=http://localhost:4000` and `NEXT_PUBLIC_WS_URL=http://localhost:4000`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/.env.local` | Create | Local dev environment variables |
| `apps/web/src/lib/api.ts` | Rewrite | HTTP client — correct contract, single token key |
| `apps/web/src/lib/socket.ts` | Create | Socket.io singleton with auth |
| `apps/web/src/hooks/useAuth.ts` | Fix | Remove refresh token logic |
| `apps/web/src/hooks/useStation.ts` | Rebuild | Real-time Socket.io wiring |
| `apps/web/src/components/station/StationCard.tsx` | Fix | Update `sendMessage` call signature |
| `apps/web/src/app/page.tsx` | Fix | Fetch stations from API |
| `apps/web/src/app/station/[slug]/page.tsx` | Fix | Fetch stations from API |
| `apps/web/src/lib/mock-data.ts` | Delete | No longer needed |

---

## Task 1: Environment Setup

**Files:**
- Create: `apps/web/.env.local`

- [ ] Create `apps/web/.env.local`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:4000
  NEXT_PUBLIC_WS_URL=http://localhost:4000
  ```

- [ ] Verify `.gitignore` at repo root already excludes `.env.local` (it should — check with `grep env.local .gitignore`):
  ```bash
  grep env.local .gitignore
  ```
  Expected output: `.env.local` or `*.local` on a line. If missing, add `.env.local` to `.gitignore`.

- [ ] Commit:
  ```bash
  git add .gitignore  # only if you had to add the rule
  git commit -m "chore: add .env.local for local development"
  ```
  Note: `.env.local` itself is gitignored and should NOT be staged.

---

## Task 2: Fix API Client

**Files:**
- Modify: `apps/web/src/lib/api.ts`

The backend returns `{ user, token }` from login. The frontend wrongly expects `{ access_token, refresh_token }` and calls non-existent endpoints. This task fixes the contract.

- [ ] Replace the entire contents of `apps/web/src/lib/api.ts` with:

  ```ts
  import type { Listener, Station, StationWithDJ, Song } from "@ownradio/shared";

  const TOKEN_KEY = "ownradio_token";

  function getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
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
  ```

- [ ] Run typecheck to verify no type errors:
  ```bash
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && cd /Users/rinehardramos/Projects/ownradio && npx turbo typecheck
  ```
  Expected: `3 successful`

- [ ] Commit:
  ```bash
  git add apps/web/src/lib/api.ts
  git commit -m "fix: correct api client contract to match backend"
  ```

---

## Task 3: Fix useAuth Hook

**Files:**
- Modify: `apps/web/src/hooks/useAuth.ts`

Remove the two-key token pattern and all refresh token logic. Use the single `ownradio_token` key from `api.ts`. Also import `reconnectSocket` from `socket.ts` (which you will create in Task 4 — create the file with just the exports before running typecheck here, or do Tasks 3 and 4 together).

- [ ] Replace the entire contents of `apps/web/src/hooks/useAuth.ts` with:

  ```ts
  "use client";

  import { useState, useEffect, useCallback } from "react";
  import type { Listener } from "@ownradio/shared";
  import { getMe, login as apiLogin, logout as apiLogout, getToken } from "../lib/api";
  import { reconnectSocket } from "../lib/socket";

  interface UseAuthReturn {
    user: Listener | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
  }

  export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<Listener | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const token = getToken();

      async function restoreSession() {
        if (!token) {
          setIsLoading(false);
          return;
        }
        try {
          const me = await getMe();
          setUser(me);
        } catch {
          // Token invalid or expired — clear it
          apiLogout();
        } finally {
          setIsLoading(false);
        }
      }

      restoreSession();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
      const data = await apiLogin(email, password);
      setUser(data.user);
      reconnectSocket(); // re-auth the socket with the new token
    }, []);

    const logout = useCallback(() => {
      apiLogout();
      setUser(null);
      reconnectSocket(); // reconnect as anonymous
    }, []);

    return { user, isLoading, login, logout };
  }
  ```

- [ ] Run typecheck:
  ```bash
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && cd /Users/rinehardramos/Projects/ownradio && npx turbo typecheck
  ```
  Expected: `3 successful`

- [ ] Commit:
  ```bash
  git add apps/web/src/hooks/useAuth.ts
  git commit -m "fix: remove refresh token logic from useAuth"
  ```

---

## Task 4: Create Socket.io Singleton

**Files:**
- Create: `apps/web/src/lib/socket.ts`

- [ ] Create `apps/web/src/lib/socket.ts`:

  ```ts
  import { io, type Socket } from "socket.io-client";
  import { getToken } from "./api";

  let socket: Socket | null = null;

  export function getSocket(): Socket {
    if (socket?.connected || socket?.active) {
      return socket;
    }

    const token = getToken();
    socket = io(process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000", {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    return socket;
  }

  export function reconnectSocket(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    getSocket();
  }
  ```

- [ ] Verify `socket.io-client` is in `apps/web/package.json` dependencies:
  ```bash
  grep "socket.io-client" apps/web/package.json
  ```
  Expected: a line with `"socket.io-client": "..."`. If missing, run:
  ```bash
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && cd apps/web && npm install socket.io-client
  ```

- [ ] Run typecheck:
  ```bash
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && cd /Users/rinehardramos/Projects/ownradio && npx turbo typecheck
  ```
  Expected: `3 successful`

- [ ] Commit:
  ```bash
  git add apps/web/src/lib/socket.ts apps/web/package.json apps/web/package-lock.json
  git commit -m "feat: add socket.io client singleton"
  ```

---

## Task 5: Rebuild useStation Hook

**Files:**
- Modify: `apps/web/src/hooks/useStation.ts`
- Modify: `apps/web/src/components/station/StationCard.tsx` (update `sendMessage` call)

The hook currently uses local state only. Replace it with Socket.io real-time wiring. Also simplify `sendMessage` — the server gets auth from the socket connection, so we don't need to pass `user`.

- [ ] Replace the entire contents of `apps/web/src/hooks/useStation.ts` with:

  ```ts
  "use client";

  import { useState, useEffect, useCallback, useRef } from "react";
  import type {
    StationWithDJ,
    Song,
    ReactionType,
    ReactionCounts,
    ChatMessage,
  } from "@ownradio/shared";
  import { getSocket } from "../lib/socket";

  interface UseStationReturn {
    currentSong: Song | null;
    reactions: ReactionCounts;
    messages: ChatMessage[];
    listenerCount: number;
    activeReactions: Set<ReactionType>;
    sendReaction: (type: ReactionType) => void;
    sendMessage: (content: string) => void;
  }

  export function useStation(station: StationWithDJ): UseStationReturn {
    const [currentSong, setCurrentSong] = useState<Song | null>(
      station.currentSong ?? null
    );
    const [reactions, setReactions] = useState<ReactionCounts>({
      heart: 0,
      rock: 0,
      broken_heart: 0,
      party: 0,
    });
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [listenerCount, setListenerCount] = useState<number>(
      station.listenerCount ?? 0
    );
    const [activeReactions, setActiveReactions] = useState<Set<ReactionType>>(
      new Set()
    );

    // Keep a ref to currentSong so event handlers always see the latest value
    const currentSongRef = useRef<Song | null>(currentSong);
    useEffect(() => {
      currentSongRef.current = currentSong;
    }, [currentSong]);

    useEffect(() => {
      const socket = getSocket();

      socket.emit("join_station", { slug: station.slug });

      function onNowPlaying(song: Song) {
        setCurrentSong(song);
      }

      function onReactionUpdate(data: { songId: string; counts: ReactionCounts }) {
        if (
          !currentSongRef.current ||
          data.songId === currentSongRef.current.id
        ) {
          setReactions(data.counts);
        }
      }

      function onNewMessage(message: ChatMessage) {
        setMessages((prev) => [...prev, message]);
      }

      function onListenerCount(data: { slug: string; count: number }) {
        if (data.slug === station.slug) {
          setListenerCount(data.count);
        }
      }

      socket.on("now_playing", onNowPlaying);
      socket.on("reaction_update", onReactionUpdate);
      socket.on("new_message", onNewMessage);
      socket.on("listener_count", onListenerCount);

      return () => {
        socket.emit("leave_station");
        socket.off("now_playing", onNowPlaying);
        socket.off("reaction_update", onReactionUpdate);
        socket.off("new_message", onNewMessage);
        socket.off("listener_count", onListenerCount);
      };
    }, [station.slug]);

    const sendReaction = useCallback(
      (type: ReactionType) => {
        const song = currentSongRef.current;
        if (!song) return;

        // Optimistic toggle
        setActiveReactions((prev) => {
          const next = new Set(prev);
          if (next.has(type)) {
            next.delete(type);
          } else {
            next.add(type);
          }
          return next;
        });

        const socket = getSocket();
        socket.emit("reaction", {
          songId: song.id,
          stationId: station.id,
          type,
        });
      },
      [station.id]
    );

    const sendMessage = useCallback(
      (content: string) => {
        const socket = getSocket();
        socket.emit("chat_message", {
          stationId: station.id,
          content,
        });
      },
      [station.id]
    );

    return {
      currentSong,
      reactions,
      messages,
      listenerCount,
      activeReactions,
      sendReaction,
      sendMessage,
    };
  }
  ```

- [ ] Update `apps/web/src/components/station/StationCard.tsx` — change `handleSend` to match the new `sendMessage(content: string)` signature (no longer takes `user`):

  Find this block in `StationCard.tsx`:
  ```ts
  function handleSend(content: string) {
    if (!user) return;
    sendMessage(content, user);
  }
  ```
  Replace it with:
  ```ts
  function handleSend(content: string) {
    if (!user) return;
    sendMessage(content);
  }
  ```

- [ ] Run typecheck:
  ```bash
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && cd /Users/rinehardramos/Projects/ownradio && npx turbo typecheck
  ```
  Expected: `3 successful`

- [ ] Commit:
  ```bash
  git add apps/web/src/hooks/useStation.ts apps/web/src/components/station/StationCard.tsx
  git commit -m "feat: rebuild useStation with socket.io real-time wiring"
  ```

---

## Task 6: Wire Landing Page to API

**Files:**
- Modify: `apps/web/src/app/page.tsx`

Replace `MOCK_STATIONS` with a server-side fetch from the real API. The `TrendingSongs` component expects `reactionCount` — since we don't have a top-songs endpoint wired to the landing page, derive it from `listenerCount` as a proxy (or default to 0).

- [ ] Replace the entire contents of `apps/web/src/app/page.tsx` with:

  ```tsx
  import type { StationWithDJ } from "@ownradio/shared";
  import { Hero } from "@/components/landing/Hero";
  import { FeaturedStations } from "@/components/landing/FeaturedStations";
  import { TopDJs } from "@/components/landing/TopDJs";
  import { TrendingSongs } from "@/components/landing/TrendingSongs";
  import { LoginSection } from "@/components/landing/LoginSection";

  async function fetchStations(): Promise<StationWithDJ[]> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    try {
      const res = await fetch(`${apiUrl}/stations`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      return res.json() as Promise<StationWithDJ[]>;
    } catch {
      return [];
    }
  }

  export default async function Home() {
    const stations = await fetchStations();

    const djs = stations.flatMap((s) => (s.dj ? [s.dj] : []));

    const songs = stations.flatMap((s) =>
      s.currentSong
        ? [
            {
              song: s.currentSong,
              stationName: s.name,
              reactionCount: s.listenerCount ?? 0,
            },
          ]
        : []
    );

    const totalListeners = stations.reduce(
      (sum, s) => sum + (s.listenerCount ?? 0),
      0
    );

    return (
      <main className="min-h-screen bg-brand-dark overflow-y-auto">
        <Hero
          stationCount={stations.length}
          listenerCount={totalListeners}
          djCount={djs.length}
        />
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
          <FeaturedStations stations={stations} />
          <TopDJs djs={djs} />
          <TrendingSongs songs={songs} />
          <LoginSection />
        </div>
      </main>
    );
  }
  ```

- [ ] Run typecheck:
  ```bash
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && cd /Users/rinehardramos/Projects/ownradio && npx turbo typecheck
  ```
  Expected: `3 successful`

- [ ] Commit:
  ```bash
  git add apps/web/src/app/page.tsx
  git commit -m "feat: wire landing page to real stations API"
  ```

---

## Task 7: Wire Station Page to API

**Files:**
- Modify: `apps/web/src/app/station/[slug]/page.tsx`

Replace `MOCK_STATIONS` with a server-side fetch. If the API is unreachable, redirect to home rather than crashing.

- [ ] Replace the entire contents of `apps/web/src/app/station/[slug]/page.tsx` with:

  ```tsx
  import { notFound } from "next/navigation";
  import type { StationWithDJ } from "@ownradio/shared";
  import { StationCarousel } from "@/components/station/StationCarousel";

  interface StationPageProps {
    params: Promise<{ slug: string }>;
  }

  async function fetchStations(): Promise<StationWithDJ[]> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    try {
      const res = await fetch(`${apiUrl}/stations`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      return res.json() as Promise<StationWithDJ[]>;
    } catch {
      return [];
    }
  }

  export default async function StationPage({ params }: StationPageProps) {
    const { slug } = await params;
    const stations = await fetchStations();

    const initialIndex = stations.findIndex((s) => s.slug === slug);

    if (initialIndex === -1) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-brand-dark flex justify-center">
        <div className="w-full max-w-[430px]">
          <StationCarousel stations={stations} initialIndex={initialIndex} />
        </div>
      </div>
    );
  }
  ```

- [ ] Run typecheck:
  ```bash
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && cd /Users/rinehardramos/Projects/ownradio && npx turbo typecheck
  ```
  Expected: `3 successful`

- [ ] Commit:
  ```bash
  git add 'apps/web/src/app/station/[slug]/page.tsx'
  git commit -m "feat: wire station page to real stations API"
  ```

---

## Task 8: Delete Mock Data

**Files:**
- Delete: `apps/web/src/lib/mock-data.ts`

- [ ] Verify no files still import from `mock-data`:
  ```bash
  grep -r "mock-data" apps/web/src --include="*.ts" --include="*.tsx"
  ```
  Expected: no output. If any files appear, fix them before deleting.

- [ ] Delete the file:
  ```bash
  rm apps/web/src/lib/mock-data.ts
  ```

- [ ] Run typecheck one final time:
  ```bash
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && cd /Users/rinehardramos/Projects/ownradio && npx turbo typecheck
  ```
  Expected: `3 successful`

- [ ] Commit:
  ```bash
  git add -u apps/web/src/lib/mock-data.ts
  git commit -m "chore: remove mock data"
  ```

---

## Verification

After all tasks, verify end-to-end locally:

- [ ] Start backend: `docker compose up db api -d` (or run API directly: `cd apps/api && npx tsx src/server.ts`)
- [ ] Run seed if DB is fresh: `cd apps/api && npx prisma db push && npx tsx prisma/seed.ts`
- [ ] Start frontend: `cd apps/web && npm run dev`
- [ ] Open `http://localhost:3000` — landing page shows 4 stations from DB
- [ ] Click a station — station page loads with real DJ info
- [ ] Open browser devtools > Network > WS — Socket.io connection established
- [ ] Log in with `demo@ownradio.com` / `demo1234` — redirects to home, name appears
- [ ] On station page: type a chat message — broadcasts in real time
- [ ] Click a reaction button — toggles and emits to server
