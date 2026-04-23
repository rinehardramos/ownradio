# OwnRadio — Task Tracking

## HLS Streaming Integration (PlayGen)

**Status: OwnRadio-side COMPLETE. No code changes needed.**

The OwnRadio browser and API are already fully wired for HLS streaming from PlayGen:

- [x] `useStation` hook handles `stream_control` events (`url_change`, `stop`, `resume`)
- [x] `AudioControls` uses HLS.js for `.m3u8` URLs; falls back to native `<audio>` for direct streams
- [x] `webhooks.ts` receives `POST /webhooks/stations/:slug/stream-control` from PlayGen, verifies `X-PlayGen-Secret`, and relays the event via Socket.io
- [x] `StreamControlPayload` and `DjSwitchPayload` types defined in `@ownradio/shared`
- [x] `PLAYGEN_WEBHOOK_SECRET` env var documented in `.env.example`

**Remaining work is entirely on the PlayGen side (see `playgen` repo):**

- [ ] Wire 1: Add `/stream/*` location block to PlayGen nginx gateway (DJ service port 3007)
- [ ] Wire 2: Call `startPlayout` + `generateHls` + `notifyStreamUrlChange` after `buildProgramManifest` completes in `manifestService.ts`
- [ ] Wire 3 (documented constraint, no code change): R2 prefetch size limit — log a warning if total audio exceeds `HLS_MAX_PREFETCH_MB` (default 500 MB)

Streaming will activate automatically once the PlayGen wires are in place.

Reference: `docs/superpowers/specs/2026-04-23-playgen-hls-streaming.md`

---

## Backlog

- Google OAuth (deferred from MVP — placeholder button exists)
- Contests/promos
- Admin/DJ dashboard UI
- React Native mobile app (`apps/mobile`)
- Scaling: swap Socket.io for Ably/Pusher at >100 concurrent listeners per station
- HLS segment-by-segment streaming (optimization for full-day shows exceeding `HLS_MAX_PREFETCH_MB`)
