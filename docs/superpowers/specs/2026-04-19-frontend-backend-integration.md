# OwnRadio — Frontend/Backend Integration Design

**Date:** 2026-04-19  
**Scope:** Wire the Next.js frontend to the real Fastify API and Socket.io backend, replacing all mock data and local state. Target environment: local Docker Compose.

---

## Problem

The frontend was built against mock data and has never talked to the real backend. Three categories of gaps:

1. **API contract mismatch** — `api.ts` expects `{ access_token, refresh_token }` but the backend returns `{ token }`. Endpoint paths are wrong (`/companies/:id/stations` → `/stations`). A `/auth/refresh` endpoint is called that doesn't exist.
2. **Pages use hardcoded mock data** — both `page.tsx` and `station/[slug]/page.tsx` import from `mock-data.ts` instead of fetching from the API.
3. **No Socket.io** — `useStation` hook is pure local state; `socket.ts` was never created; real-time chat, reactions, and listener count don't work.

---

## Approach

Surgical fixes to existing files (Option A). No rewrites, no new abstractions.

---

## Section 1: API Contract Fixes

### Token storage
- Drop the two-key pattern (`ownradio_access_token` + `ownradio_refresh_token`)
- Use single key: `ownradio_token`
- 7-day JWT from backend — no refresh flow needed

### `apps/web/src/lib/api.ts` changes
- Remove `refreshAccessToken()` and the 401-retry block entirely
- Fix `login()` response shape: `{ user, token }` (not `{ access_token, refresh_token }`)
- Fix `getStations()`: remove `companyId` param, call `GET /stations`
- Fix `getStation(slug: string)`: call `GET /stations/:slug`
- Token header: read from `ownradio_token` localStorage key

### `apps/web/src/hooks/useAuth.ts` changes
- Remove all `REFRESH_TOKEN_KEY` references
- Use `ownradio_token` key for session restore check

### Environment
- Add `apps/web/.env.local`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:4000
  NEXT_PUBLIC_WS_URL=http://localhost:4000
  ```
- This is for local `npm run dev`. Docker Compose already sets these for containers.

---

## Section 2: Socket.io Integration

### `apps/web/src/lib/socket.ts` (new file)
- Singleton Socket.io client
- `getSocket()`: returns existing instance or creates new one
  - Connects to `process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000"`
  - Passes `{ auth: { token } }` from `localStorage.getItem("ownradio_token")`
- `reconnectSocket()`: disconnects and reconnects with current token (called after login/logout)

### `apps/web/src/hooks/useStation.ts` rebuild
Replace local state with real-time Socket.io wiring:

**On mount:**
- Call `getSocket()`, emit `join_station { slug }`
- Register listeners: `now_playing`, `reaction_update`, `new_message`, `listener_count`

**State updates from server:**
- `now_playing` → `setCurrentSong(song)`
- `reaction_update { songId, counts }` → `setReactions(counts)` if songId matches current
- `new_message` → `setMessages(prev => [...prev, message])`
- `listener_count { slug, count }` → `setListenerCount(count)`

**Client actions:**
- `sendReaction(type)`: emit `reaction { songId, stationId, type }` + optimistically toggle `activeReactions`
- `sendMessage(content, user)`: emit `chat_message { stationId, content }` (server broadcasts back via `new_message`)

**On unmount:**
- Emit `leave_station`, remove all listeners for this station (don't disconnect socket)

**Initial state:** seed from `station.currentSong` and `station.listenerCount` passed as props, so UI is not blank before first server event.

---

## Section 3: Page Data Fetching

### `apps/web/src/app/page.tsx`
- Remove `MOCK_STATIONS` import
- Fetch stations with `fetch(\`${process.env.NEXT_PUBLIC_API_URL}/stations\`, { cache: "no-store" })` — `NEXT_PUBLIC_*` vars are available in server components too; for local dev `localhost:4000` is reachable from both server and browser
- On fetch error: render with `stations = []` (no crash)
- Delete derived mock values (reaction counts, listener totals) — compute from real data

### `apps/web/src/app/station/[slug]/page.tsx`
- Remove `MOCK_STATIONS` import
- Fetch all stations from `GET /stations` using `NEXT_PUBLIC_API_URL` (same pattern as landing page)
- If slug not found in result: `notFound()` (Next.js 404)

### `apps/web/src/lib/mock-data.ts`
- Delete after pages no longer import it

### `apps/web/src/app/login/page.tsx`
- No changes needed — already calls `useAuth().login()` which flows through `api.ts`

---

## Data Flow Summary

```
Landing page (server)
  └── fetch /stations → render FeaturedStations, TopDJs, TrendingSongs

Station page (server)
  └── fetch /stations → find initial index → render StationCarousel

StationCarousel (client)
  └── StationCard per station
        └── useStation(station)
              ├── Socket.io: join_station
              ├── now_playing → currentSong
              ├── reaction_update → reactions
              ├── new_message → messages
              ├── listener_count → listenerCount
              ├── sendReaction → emit reaction
              └── sendMessage → emit chat_message

Login page (client)
  └── useAuth().login() → api.ts POST /auth/login → store token → reconnectSocket()
```

---

## What Is NOT Changing

- Component markup and styling (untouched)
- Backend (all 13 tests still pass)
- Docker Compose (already correct for containers)
- Playwright tests (mocked/skipped for now — no live API in CI)

---

## Files Changed

| File | Action |
|------|--------|
| `apps/web/src/lib/api.ts` | Fix contract mismatches |
| `apps/web/src/lib/socket.ts` | Create (new) |
| `apps/web/src/hooks/useAuth.ts` | Remove refresh token logic |
| `apps/web/src/hooks/useStation.ts` | Rebuild with Socket.io |
| `apps/web/src/app/page.tsx` | Fetch from API |
| `apps/web/src/app/station/[slug]/page.tsx` | Fetch from API |
| `apps/web/src/lib/mock-data.ts` | Delete |
| `apps/web/.env.local` | Create with local URLs |
