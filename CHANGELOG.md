# Changelog

All notable changes to OwnRadio are documented here.

## [Unreleased]

### Added — 2026-04-23

- **PlayGen HLS streaming wired end-to-end.** OwnRadio receives `stream_control` webhooks from PlayGen when a DJ show goes live. `useStation` hook updates `streamUrl`; `AudioControls.tsx` re-initialises HLS.js with the new `.m3u8` URL. All three PlayGen-side wires are now in place (gateway `/stream/*`, playout auto-start in DJ service, R2 prefetch). `PLAYGEN_WEBHOOK_SECRET` env var required on the OwnRadio API service to authenticate incoming webhooks.

## [MVP] — 2026-04-18

### Added

- Turborepo monorepo with `apps/api` (Fastify + Socket.io) and `apps/web` (Next.js 15)
- Station carousel with swipe/tap navigation
- `AudioControls` component — HLS.js for `.m3u8` streams; native `<audio>` fallback for Icecast/Shoutcast direct streams
- `useStation` hook — Socket.io real-time: `now_playing`, `reaction_update`, `new_message`, `listener_count`, `stream_control`, `dj_switch`
- Webhook routes: `POST /webhooks/stations/:slug/stream-control` and `POST /webhooks/stations/:slug/dj-switch` — secured by `X-PlayGen-Secret` header
- Email auth with JWT (7-day tokens, bcrypt)
- Reactions (rock, love, vibe, sleepy, nah) with debounced Socket.io broadcast
- Live chat (authenticated users only; 1–280 chars)
- Icecast/Shoutcast metadata poller (5 s interval)
- Prisma schema + seed data (4 stations, demo listener)
- Playwright E2E tests + Vitest unit/integration tests
- GitHub Actions CI pipeline
- Docker Compose local dev stack
