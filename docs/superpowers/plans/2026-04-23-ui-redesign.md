# OwnRadio UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the OwnRadio web UI with dark glassmorphic aesthetics, collapsible AppShell layout (sidebar + chat panel + bottom player bar), 5-emoji reaction system, and mock Browse/Library/Profile pages.

**Architecture:** `useStation` is called once in `StationCarousel` and all data flows down as props to `StationCard`, eliminating duplicate socket connections. A new `AppShell` layout component wraps everything with collapsible sidebar, chat panel, and a persistent 72px bottom player bar.

**Tech Stack:** Next.js 15 App Router, React 19, TailwindCSS v4, Inter (Google Fonts via Next.js font optimization), socket.io-client, HLS.js

---

## File Map

### New Files
- `apps/web/src/components/layout/AppShell.tsx` — sidebar + main + chat panel + bottom bar wrapper
- `apps/web/src/components/layout/Sidebar.tsx` — collapsible nav sidebar with station list
- `apps/web/src/components/layout/BottomPlayerBar.tsx` — persistent 72px player
- `apps/web/src/components/station/ChatPanel.tsx` — replaces LiveChat.tsx
- `apps/web/src/components/station/PlaylistModal.tsx` — mock upcoming tracks sheet
- `apps/web/src/components/station/TopSongsModal.tsx` — mock ranked songs sheet
- `apps/web/src/components/station/FansModal.tsx` — mock listener grid sheet
- `apps/web/src/lib/placeholders.ts` — genre → placeholder image path mapping
- `apps/web/src/app/browse/page.tsx` — mock genre grid page
- `apps/web/src/app/library/page.tsx` — mock saved stations page
- `apps/web/src/app/profile/page.tsx` — mock user settings page

### Modified Files
- `apps/web/src/app/globals.css` — design tokens, glass utility, animations
- `apps/web/src/app/layout.tsx` — add Inter via next/font/google
- `packages/shared/src/station.ts` — ReactionType updated to 5 emojis
- `apps/web/src/hooks/useStation.ts` — activeReaction (single value) + reset on song change
- `apps/web/src/components/station/ReactionBar.tsx` — 5 emojis, no counts, glow active
- `apps/web/src/components/station/AudioControls.tsx` — gradient slider, forwardRef handle
- `apps/web/src/components/station/StationCard.tsx` — full hero redesign, receives props from carousel
- `apps/web/src/components/station/StationCarousel.tsx` — owns useStation, wraps in AppShell
- `apps/web/src/components/landing/FeaturedStations.tsx` — image-based cards
- `apps/web/src/components/landing/TopDJs.tsx` — avatar photos with online dots
- `apps/web/src/components/landing/TrendingSongs.tsx` — album art rows
- `apps/web/src/components/landing/LoginSection.tsx` — real Google OAuth redirect

### Deleted Files
- `apps/web/src/components/station/DJSection.tsx`
- `apps/web/src/components/station/DJBioModal.tsx`
- `apps/web/src/components/station/LiveChat.tsx`

---

## Task 1: Design Tokens & Inter Font

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Add Inter font via next/font/google in layout.tsx**

Read the current `apps/web/src/app/layout.tsx`. Add Inter using Next.js built-in font optimization (no external link tags needed):

```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700','800','900'] });
```

Apply it by adding `className={inter.className}` to the `<body>` tag (or `<html>` — wherever the root element is in the current file).

Remove any existing `<link>` tags for Google Fonts if present.

- [ ] **Step 2: Replace globals.css**

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";

:root {
  --bg-primary: #0f0f1a;
  --bg-secondary: #1a1a2e;
  --bg-card: #1e1e32;
  --bg-elevated: #252540;
  --border-subtle: rgba(255,255,255,.06);
  --border-medium: rgba(255,255,255,.1);
  --pink: #ff2d78;
  --pink-light: #ff6b9d;
  --text-primary: #ffffff;
  --text-secondary: rgba(255,255,255,.65);
  --text-tertiary: rgba(255,255,255,.4);
  --text-muted: rgba(255,255,255,.25);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;
  --shadow-card: 0 2px 8px rgba(0,0,0,.3);
  --shadow-elevated: 0 8px 32px rgba(0,0,0,.5);
}

* { box-sizing: border-box; }

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  margin: 0;
}

.glass {
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
}

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

input[type="range"] {
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  transition: opacity 150ms;
}
input[type="range"]:hover::-webkit-slider-thumb { opacity: 1; }

@keyframes equalize {
  0%, 100% { height: 4px; }
  50% { height: 14px; }
}
.playing-bar {
  width: 3px;
  background: var(--pink);
  border-radius: 2px;
  animation: equalize 800ms ease-in-out infinite;
}
.playing-bar:nth-child(2) { animation-delay: 150ms; }
.playing-bar:nth-child(3) { animation-delay: 300ms; }

.transition-fast { transition: all 150ms cubic-bezier(.4,0,.2,1); }
.transition-medium { transition: all 300ms cubic-bezier(.4,0,.2,1); }
```

- [ ] **Step 3: Verify font loads**

Run `npx turbo dev --filter=web`, open browser, inspect body computed font — should show Inter.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/app/layout.tsx
git commit -m "feat: add design tokens and Inter font"
```

---

## Task 2: Placeholder Images & Mapping Utility

**Files:**
- Create: `apps/web/public/placeholders/` directory tree
- Create: `apps/web/src/lib/placeholders.ts`

- [ ] **Step 1: Add placeholder images**

Create the following directory structure under `apps/web/public/placeholders/` and populate with royalty-free images (download from Pexels or Unsplash using the search terms):

```
stations/
  pop.jpg       search: "concert stage crowd"
  rock.jpg      search: "rock guitar concert"
  hiphop.jpg    search: "urban music studio"
  lofi.jpg      search: "cozy room study"
  opm.jpg       search: "tropical beach music"
  default.jpg   search: "music stage dark"
djs/
  default.jpg   search: "headphones silhouette"
songs/
  default.jpg   search: "vinyl record turntable"
profile/
  default.jpg   search: "avatar silhouette person"
```

Images should be JPG, 800x600 or larger, saved at reasonable quality.

- [ ] **Step 2: Create placeholders.ts**

```ts
// apps/web/src/lib/placeholders.ts
const GENRE_MAP: Record<string, string> = {
  pop: '/placeholders/stations/pop.jpg',
  rock: '/placeholders/stations/rock.jpg',
  'hip-hop': '/placeholders/stations/hiphop.jpg',
  hiphop: '/placeholders/stations/hiphop.jpg',
  'lo-fi': '/placeholders/stations/lofi.jpg',
  lofi: '/placeholders/stations/lofi.jpg',
  opm: '/placeholders/stations/opm.jpg',
};

export function getStationPlaceholder(genre?: string | null): string {
  if (!genre) return '/placeholders/stations/default.jpg';
  return GENRE_MAP[genre.toLowerCase()] ?? '/placeholders/stations/default.jpg';
}

export const DJ_PLACEHOLDER = '/placeholders/djs/default.jpg';
export const SONG_PLACEHOLDER = '/placeholders/songs/default.jpg';
export const PROFILE_PLACEHOLDER = '/placeholders/profile/default.jpg';
```

- [ ] **Step 3: Verify images serve**

Run dev server and open `/placeholders/stations/default.jpg` in the browser — it should load.

- [ ] **Step 4: Commit**

```bash
git add apps/web/public/placeholders/ apps/web/src/lib/placeholders.ts
git commit -m "feat: add placeholder images and genre mapping utility"
```

---

## Task 3: Update Shared ReactionType

**Files:**
- Modify: `packages/shared/src/station.ts`

- [ ] **Step 1: Read current ReactionType**

Read `packages/shared/src/station.ts` to find the ReactionType union and ReactionCounts interface.

- [ ] **Step 2: Replace ReactionType and ReactionCounts**

Change from:
```ts
export type ReactionType = "heart" | "rock" | "party" | "broken_heart";
export interface ReactionCounts {
  heart: number;
  rock: number;
  party: number;
  broken_heart: number;
}
```

To:
```ts
export type ReactionType = "rock" | "love" | "vibe" | "sleepy" | "nah";
export interface ReactionCounts {
  rock: number;
  love: number;
  vibe: number;
  sleepy: number;
  nah: number;
}
```

- [ ] **Step 3: Typecheck**

```bash
npx turbo typecheck
```

Expected: errors only in ReactionBar.tsx and useStation.ts — both fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/station.ts
git commit -m "feat: update ReactionType to 5-emoji system"
```

---

## Task 4: useStation — Single activeReaction + Reset on Song Change

**Files:**
- Modify: `apps/web/src/hooks/useStation.ts`

- [ ] **Step 1: Read current useStation**

Read `apps/web/src/hooks/useStation.ts`. Note the current `activeReactions` Set logic and socket event handlers.

- [ ] **Step 2: Replace activeReactions Set with single activeReaction value**

State change:
```ts
// Before:
const [activeReactions, setActiveReactions] = useState<Set<ReactionType>>(new Set());
// After:
const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);
```

In the `now_playing` socket handler, add a reset:
```ts
socket.on('now_playing', (data) => {
  setCurrentSong(data);
  setActiveReaction(null);
});
```

Replace `sendReaction`:
```ts
const sendReaction = useCallback((type: ReactionType) => {
  const next = activeReaction === type ? null : type;
  setActiveReaction(next);
  if (next !== null) {
    socket.emit('reaction', { songId: currentSong?.id, stationId: station.id, type: next });
  }
}, [activeReaction, currentSong, station.id, socket]);
```

Update the return value: replace `activeReactions` key with `activeReaction`.

- [ ] **Step 3: Typecheck**

```bash
npx turbo typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/useStation.ts
git commit -m "feat: single activeReaction with song-change reset"
```

---

## Task 5: ReactionBar — 5 Emojis, No Counts, Glow Active State

**Files:**
- Modify: `apps/web/src/components/station/ReactionBar.tsx`

- [ ] **Step 1: Read current ReactionBar**

Read `apps/web/src/components/station/ReactionBar.tsx`.

- [ ] **Step 2: Rewrite ReactionBar**

```tsx
// apps/web/src/components/station/ReactionBar.tsx
'use client';
import { ReactionType } from '@ownradio/shared';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'rock',   emoji: '🤘', label: 'Rock'   },
  { type: 'love',   emoji: '❤️', label: 'Love'   },
  { type: 'vibe',   emoji: '🎵', label: 'Vibe'   },
  { type: 'sleepy', emoji: '😴', label: 'Sleepy' },
  { type: 'nah',    emoji: '👎', label: 'Nah'    },
];

interface ReactionBarProps {
  activeReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  orientation?: 'vertical' | 'horizontal';
}

export function ReactionBar({ activeReaction, onReact, orientation = 'vertical' }: ReactionBarProps) {
  const isVertical = orientation === 'vertical';
  return (
    <div style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: '8px', padding: '8px' }}>
      {REACTIONS.map(({ type, emoji, label }) => {
        const isActive = activeReaction === type;
        return (
          <button
            key={type}
            onClick={() => onReact(type)}
            aria-label={label}
            aria-pressed={isActive}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              borderRadius: 'var(--radius-md)',
              border: isActive
                ? '1.5px solid rgba(255,45,120,0.4)'
                : '1.5px solid var(--border-subtle)',
              background: isActive ? 'rgba(255,45,120,0.15)' : 'rgba(0,0,0,0.2)',
              boxShadow: isActive ? '0 0 14px rgba(255,45,120,0.25)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms cubic-bezier(.4,0,.2,1)',
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.85)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
npx turbo typecheck
git add apps/web/src/components/station/ReactionBar.tsx
git commit -m "feat: 5-emoji ReactionBar with glow active state"
```

---

## Task 6: AudioControls — Gradient Slider + forwardRef Handle

**Files:**
- Modify: `apps/web/src/components/station/AudioControls.tsx`

- [ ] **Step 1: Read current AudioControls**

Read `apps/web/src/components/station/AudioControls.tsx`. Note any HLS.js wiring to carry forward.

- [ ] **Step 2: Rewrite with forwardRef**

```tsx
// apps/web/src/components/station/AudioControls.tsx
'use client';
import { forwardRef, useImperativeHandle, useState, useCallback, useRef } from 'react';

export interface AudioControlsHandle {
  isPlaying: boolean;
  volume: number;
  togglePlay: () => void;
  setVolume: (v: number) => void;
}

interface AudioControlsProps {
  streamUrl: string;
  onPlayStateChange?: (playing: boolean) => void;
  onVolumeChange?: (volume: number) => void;
}

export const AudioControls = forwardRef<AudioControlsHandle, AudioControlsProps>(
  function AudioControls({ streamUrl, onPlayStateChange, onVolumeChange }, ref) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(0.8);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // If the original file used HLS.js, add that logic here:
    // Check Hls.isSupported(), create hls instance, hls.loadSource(streamUrl),
    // hls.attachMedia(audioRef.current). Carry it from the old file verbatim.

    const togglePlay = useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        onPlayStateChange?.(false);
      } else {
        audio.play().then(() => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        }).catch(() => {});
      }
    }, [isPlaying, onPlayStateChange]);

    const setVolume = useCallback((v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setVolumeState(clamped);
      if (audioRef.current) audioRef.current.volume = clamped;
      onVolumeChange?.(clamped);
    }, [onVolumeChange]);

    useImperativeHandle(ref, () => ({ isPlaying, volume, togglePlay, setVolume }), [isPlaying, volume, togglePlay, setVolume]);

    const pct = Math.round(volume * 100);
    const sliderBg = `linear-gradient(to right, var(--pink) 0%, var(--pink) ${pct}%, var(--border-medium) ${pct}%, var(--border-medium) 100%)`;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
        <audio ref={audioRef} src={streamUrl} preload="none" />
        <button onClick={() => setVolume(volume - 0.1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>🔉</button>
        <input type="range" min={0} max={1} step={0.01} value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ flex: 1, background: sliderBg }} />
        <button onClick={() => setVolume(volume + 0.1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>🔊</button>
        <button onClick={togglePlay} style={{
          width: '48px', height: '48px', borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg, var(--pink) 0%, var(--pink-light) 100%)',
          boxShadow: '0 4px 16px rgba(255,45,120,0.4)',
          color: '#fff', fontSize: '18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    );
  }
);
```

- [ ] **Step 3: Typecheck and commit**

```bash
npx turbo typecheck
git add apps/web/src/components/station/AudioControls.tsx
git commit -m "feat: AudioControls with gradient slider and forwardRef handle"
```

---

## Task 7: DJ Feature Modals

**Files:**
- Create: `apps/web/src/components/station/PlaylistModal.tsx`
- Create: `apps/web/src/components/station/TopSongsModal.tsx`
- Create: `apps/web/src/components/station/FansModal.tsx`

- [ ] **Step 1: Create PlaylistModal**

```tsx
// apps/web/src/components/station/PlaylistModal.tsx
'use client';

interface PlaylistModalProps { onClose: () => void; }

const MOCK_TRACKS = [
  { title: 'Midnight Drive', artist: 'Synthwave Rider', duration: '3:42' },
  { title: 'Neon Lights',    artist: 'City Echo',       duration: '4:15' },
  { title: 'Rainy Seoul',    artist: 'Lo-Fi Dreams',    duration: '3:58' },
  { title: 'Tokyo Drift',    artist: 'Urban Pulse',     duration: '4:02' },
  { title: 'Slow Burn',      artist: 'Velvet Haze',     duration: '5:10' },
  { title: 'Late Night Run', artist: 'Chrome Hearts',   duration: '3:33' },
];

export function PlaylistModal({ onClose }: PlaylistModalProps) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Playlist</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>x</button>
        </div>
        {MOCK_TRACKS.map((track, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎵</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{track.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{track.artist}</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{track.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TopSongsModal**

```tsx
// apps/web/src/components/station/TopSongsModal.tsx
'use client';

interface TopSongsModalProps { onClose: () => void; }

const MOCK_TOP = [
  { title: 'Neon Lights',    artist: 'City Echo',       plays: 1240 },
  { title: 'Midnight Drive', artist: 'Synthwave Rider', plays: 987  },
  { title: 'Rainy Seoul',    artist: 'Lo-Fi Dreams',    plays: 854  },
  { title: 'Tokyo Drift',    artist: 'Urban Pulse',     plays: 731  },
  { title: 'Slow Burn',      artist: 'Velvet Haze',     plays: 698  },
  { title: 'Late Night Run', artist: 'Chrome Hearts',   plays: 621  },
  { title: 'Electric Feel',  artist: 'Prism Wave',      plays: 589  },
  { title: 'Golden Hour',    artist: 'Sun Drift',       plays: 502  },
  { title: 'Phantom Bass',   artist: 'Deep Echo',       plays: 477  },
  { title: 'Aurora',         artist: 'Night Owl',       plays: 441  },
];

export function TopSongsModal({ onClose }: TopSongsModalProps) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Top 10</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>x</button>
        </div>
        {MOCK_TOP.map((song, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '24px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: i < 3 ? 'var(--pink)' : 'var(--text-tertiary)' }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{song.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{song.artist}</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{song.plays.toLocaleString()} plays</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create FansModal**

```tsx
// apps/web/src/components/station/FansModal.tsx
'use client';

interface FansModalProps { listenerCount: number; onClose: () => void; }

const COLORS = ['#ff2d78','#6c63ff','#00bcd4','#ff9800','#4caf50','#e91e63','#9c27b0','#3f51b5'];
const MOCK_FANS = Array.from({ length: 20 }, (_, i) => ({
  name: `Listener ${i + 1}`,
  initial: String.fromCharCode(65 + (i % 26)),
  color: COLORS[i % COLORS.length],
}));

export function FansModal({ listenerCount, onClose }: FansModalProps) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Fans · {listenerCount.toLocaleString()} listening</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>x</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {MOCK_FANS.map((fan, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: fan.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                {fan.initial}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>{fan.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
npx turbo typecheck
git add apps/web/src/components/station/PlaylistModal.tsx apps/web/src/components/station/TopSongsModal.tsx apps/web/src/components/station/FansModal.tsx
git commit -m "feat: add PlaylistModal, TopSongsModal, FansModal"
```

---

## Task 8: ChatPanel Component

**Files:**
- Create: `apps/web/src/components/station/ChatPanel.tsx`

- [ ] **Step 1: Read current LiveChat**

Read `apps/web/src/components/station/LiveChat.tsx`. Note the props interface and message field names.

- [ ] **Step 2: Create ChatPanel**

```tsx
// apps/web/src/components/station/ChatPanel.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, User } from '@ownradio/shared';

interface ChatPanelProps {
  messages: ChatMessage[];
  user: User | null;
  onSend: (text: string) => void;
  onlineCount?: number;
  height?: string;
}

export function ChatPanel({ messages, user, onSend, onlineCount = 0, height = '100%' }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !user) return;
    onSend(text);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height, background: 'var(--bg-secondary)' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: '15px' }}>Live Chat</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          {onlineCount} online
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="scrollbar-hide">
        {messages.map((msg, i) => {
          const initials = (msg.username ?? 'U').slice(0, 2).toUpperCase();
          const isDj = (msg as Record<string, unknown>).role === 'dj';
          return (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: isDj ? '#22c55e' : 'var(--pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: isDj ? '#22c55e' : 'var(--pink)' }}>{msg.username}</span>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '2px' }}>{msg.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={user ? 'Send a message...' : 'Log in to chat'}
          disabled={!user}
          style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', padding: '10px 16px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
        />
        <button onClick={handleSend} disabled={!user || !input.trim()}
          style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', background: 'var(--pink)', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          &#9654;
        </button>
      </div>
    </div>
  );
}
```

Note: Adjust `ChatMessage` field names (`username`, `text`) to match what `@ownradio/shared` actually exports.

- [ ] **Step 3: Typecheck and commit**

```bash
npx turbo typecheck
git add apps/web/src/components/station/ChatPanel.tsx
git commit -m "feat: ChatPanel with auto-scroll and DJ color"
```

---

## Task 9: AppShell + Sidebar + BottomPlayerBar

**Files:**
- Create: `apps/web/src/components/layout/AppShell.tsx`
- Create: `apps/web/src/components/layout/Sidebar.tsx`
- Create: `apps/web/src/components/layout/BottomPlayerBar.tsx`

- [ ] **Step 1: Create Sidebar**

```tsx
// apps/web/src/components/layout/Sidebar.tsx
'use client';
import Link from 'next/link';
import { getStationPlaceholder } from '@/lib/placeholders';
import type { Station } from '@ownradio/shared';

interface SidebarProps {
  stations: Station[];
  activeStationId?: string;
  onStationClick: (index: number) => void;
}

const NAV_LINKS = [
  { href: '/',        label: 'Home',    icon: '🏠' },
  { href: '/browse',  label: 'Browse',  icon: '🔍' },
  { href: '/library', label: 'Library', icon: '📚' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export function Sidebar({ stations, activeStationId, onStationClick }: SidebarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-secondary)' }}>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '20px', fontWeight: 900, background: 'linear-gradient(135deg, var(--pink), var(--pink-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          OwnRadio
        </span>
      </div>
      <nav style={{ padding: '8px' }}>
        {NAV_LINKS.map(({ href, label, icon }) => (
          <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>
            <span>{icon}</span><span>{label}</span>
          </Link>
        ))}
      </nav>
      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 16px' }} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }} className="scrollbar-hide">
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', padding: '6px 12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Stations</div>
        {stations.map((station, index) => {
          const isActive = station.id === activeStationId;
          return (
            <button key={station.id} onClick={() => onStationClick(index)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: 'none', background: isActive ? 'rgba(255,45,120,0.12)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
              <img src={station.artworkUrl ?? getStationPlaceholder(station.genre)} alt=""
                style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? 'var(--pink)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{station.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{station.genre}</div>
              </div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: station.isLive ? '#22c55e' : 'var(--text-muted)', flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create BottomPlayerBar**

```tsx
// apps/web/src/components/layout/BottomPlayerBar.tsx
'use client';
import type { Station } from '@ownradio/shared';

interface Song { title: string; artist: string; }

interface BottomPlayerBarProps {
  currentSong: Song | null;
  station: Station | null;
  isPlaying: boolean;
  volume: number;
  listenerCount: number;
  onTogglePlay: () => void;
  onVolumeChange: (v: number) => void;
}

export function BottomPlayerBar({ currentSong, station, isPlaying, volume, listenerCount, onTogglePlay, onVolumeChange }: BottomPlayerBarProps) {
  const pct = Math.round(volume * 100);
  const sliderBg = `linear-gradient(to right, var(--pink) 0%, var(--pink) ${pct}%, var(--border-medium) ${pct}%, var(--border-medium) 100%)`;

  return (
    <div style={{ height: '72px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px' }}>
      <div style={{ width: '240px', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎵</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong?.title ?? 'Not playing'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentSong?.artist ?? ''}{station ? ` · ${station.name}` : ''}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button onClick={onTogglePlay} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#fff', color: '#000', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
      <div style={{ width: '240px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          {listenerCount.toLocaleString()}
        </span>
        <input type="range" min={0} max={1} step={0.01} value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          style={{ width: '100px', background: sliderBg }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create AppShell**

```tsx
// apps/web/src/components/layout/AppShell.tsx
'use client';
import { useState, useEffect, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomPlayerBar } from './BottomPlayerBar';
import type { Station } from '@ownradio/shared';

interface Song { title: string; artist: string; }

interface AppShellProps {
  stations: Station[];
  activeStationId?: string;
  onStationChange: (index: number) => void;
  stationCount: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
  currentSong: Song | null;
  currentStation: Station | null;
  isPlaying: boolean;
  volume: number;
  listenerCount: number;
  onTogglePlay: () => void;
  onVolumeChange: (v: number) => void;
  children: ReactNode;
  chatContent: ReactNode;
}

export function AppShell({
  stations, activeStationId, onStationChange,
  stationCount, currentIndex, onDotClick,
  currentSong, currentStation, isPlaying, volume, listenerCount, onTogglePlay, onVolumeChange,
  children, chatContent,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft')  onDotClick(Math.max(0, currentIndex - 1));
      if (e.key === 'ArrowRight') onDotClick(Math.min(stationCount - 1, currentIndex + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, stationCount, onDotClick]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>&#9776;</button>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {Array.from({ length: stationCount }, (_, i) => (
            <button key={i} onClick={() => onDotClick(i)}
              style={{ width: i === currentIndex ? '20px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: i === currentIndex ? 'var(--pink)' : 'var(--border-medium)', cursor: 'pointer', padding: 0, transition: 'all 300ms cubic-bezier(.4,0,.2,1)' }} />
          ))}
        </div>
        <button onClick={() => setChatOpen(o => !o)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>&#128172;</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebarOpen && (
          <div style={{ width: '240px', flexShrink: 0, borderRight: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
            <Sidebar stations={stations} activeStationId={activeStationId} onStationClick={onStationChange} />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-hide">{children}</div>
        {chatOpen && (
          <div style={{ width: '320px', flexShrink: 0, borderLeft: '1px solid var(--border-subtle)' }}>{chatContent}</div>
        )}
      </div>

      <BottomPlayerBar
        currentSong={currentSong} station={currentStation}
        isPlaying={isPlaying} volume={volume} listenerCount={listenerCount}
        onTogglePlay={onTogglePlay} onVolumeChange={onVolumeChange}
      />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
npx turbo typecheck
git add apps/web/src/components/layout/
git commit -m "feat: AppShell, Sidebar, BottomPlayerBar layout components"
```

---

## Task 10: Redesign StationCard + Wire StationCarousel into AppShell

**Files:**
- Modify: `apps/web/src/components/station/StationCard.tsx`
- Modify: `apps/web/src/components/station/StationCarousel.tsx`

- [ ] **Step 1: Read both files**

Read `apps/web/src/components/station/StationCard.tsx` and `apps/web/src/components/station/StationCarousel.tsx`. Copy the swipe/touch gesture handlers before overwriting.

- [ ] **Step 2: Rewrite StationCard (no useStation inside — receives all props)**

```tsx
// apps/web/src/components/station/StationCard.tsx
'use client';
import { useRef, useState } from 'react';
import { ReactionBar } from './ReactionBar';
import { AudioControls, AudioControlsHandle } from './AudioControls';
import { PlaylistModal } from './PlaylistModal';
import { TopSongsModal } from './TopSongsModal';
import { FansModal } from './FansModal';
import { getStationPlaceholder } from '@/lib/placeholders';
import type { Station, ReactionType } from '@ownradio/shared';

interface Song { title: string; artist: string; }
interface Dj { name: string; }
interface User { id: string; }

interface StationCardProps {
  station: Station;
  isActive: boolean;
  currentSong: Song | null;
  activeReaction: ReactionType | null;
  streamUrl: string | null;
  activeDj: Dj | null;
  listenerCount: number;
  user: User | null;
  onReact: (type: ReactionType) => void;
  onSendMessage: (text: string) => void;
  onPlayStateChange: (playing: boolean) => void;
  onVolumeChange: (volume: number) => void;
  audioRef?: React.RefObject<AudioControlsHandle | null>;
}

export function StationCard({
  station, currentSong, activeReaction, streamUrl, activeDj,
  listenerCount, onReact, onPlayStateChange, onVolumeChange, audioRef,
}: StationCardProps) {
  const [modal, setModal] = useState<'playlist' | 'top10' | 'fans' | null>(null);
  const internalRef = useRef<AudioControlsHandle | null>(null);
  const controlsRef = audioRef ?? internalRef;
  const heroImg = station.artworkUrl ?? getStationPlaceholder(station.genre);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.5) saturate(1.2)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 60%)' }} />

      <div style={{ position: 'relative', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {station.genre && (
            <span className="glass" style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600 }}>{station.genre}</span>
          )}
          {station.isLive && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#22c55e' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />LIVE
            </span>
          )}
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, lineHeight: 1.1 }}>{station.name}</h1>

        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🎵</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSong?.title ?? 'Loading...'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{currentSong?.artist ?? ''}</div>
          </div>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '18px' }}>
            <div className="playing-bar" />
            <div className="playing-bar" />
            <div className="playing-bar" />
          </div>
        </div>

        <ReactionBar activeReaction={activeReaction} onReact={onReact} orientation="horizontal" />

        {streamUrl && (
          <AudioControls ref={controlsRef} streamUrl={streamUrl} onPlayStateChange={onPlayStateChange} onVolumeChange={onVolumeChange} />
        )}

        {activeDj && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎧</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{activeDj.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{listenerCount.toLocaleString()} listeners</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['playlist','top10','fans'] as const).map((key) => (
                <button key={key} onClick={() => setModal(key)}
                  style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-medium)', background: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
                  {key === 'playlist' ? 'Playlist' : key === 'top10' ? 'Top 10' : 'Fans'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {modal === 'playlist' && <PlaylistModal onClose={() => setModal(null)} />}
      {modal === 'top10'    && <TopSongsModal onClose={() => setModal(null)} />}
      {modal === 'fans'     && <FansModal listenerCount={listenerCount} onClose={() => setModal(null)} />}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite StationCarousel — owns useStation, wraps in AppShell**

Preserve the existing swipe/touch/arrow-click handlers verbatim. New structure:

```tsx
// Key structure (read and preserve original swipe handlers before writing):
import { useRef, useState } from 'react';
import { useStation } from '@/hooks/useStation';
import { AppShell } from '@/components/layout/AppShell';
import { ChatPanel } from '@/components/station/ChatPanel';
import { StationCard } from './StationCard';
import { AudioControlsHandle } from './AudioControls';
import type { Station } from '@ownradio/shared';

export function StationCarousel({ stations }: { stations: Station[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStation = stations[currentIndex] ?? null;
  const audioRef = useRef<AudioControlsHandle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const { currentSong, activeReaction, listenerCount, messages, user, sendReaction, sendMessage, streamUrl, activeDj } = useStation(currentStation);

  // ... INSERT ORIGINAL SWIPE/TOUCH/ARROW HANDLERS HERE ...

  return (
    <AppShell
      stations={stations} activeStationId={currentStation?.id} onStationChange={setCurrentIndex}
      stationCount={stations.length} currentIndex={currentIndex} onDotClick={setCurrentIndex}
      currentSong={currentSong} currentStation={currentStation}
      isPlaying={isPlaying} volume={volume} listenerCount={listenerCount}
      onTogglePlay={() => audioRef.current?.togglePlay()}
      onVolumeChange={(v) => { setVolume(v); audioRef.current?.setVolume(v); }}
      chatContent={<ChatPanel messages={messages} user={user} onSend={sendMessage} onlineCount={listenerCount} height="100%" />}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {stations.map((station, i) => (
          <div key={station.id} style={{ position: 'absolute', inset: 0, transform: `translateX(${(i - currentIndex) * 100}%)`, transition: 'transform 300ms cubic-bezier(.4,0,.2,1)' }}>
            <StationCard
              station={station} isActive={i === currentIndex}
              currentSong={i === currentIndex ? currentSong : null}
              activeReaction={i === currentIndex ? activeReaction : null}
              streamUrl={i === currentIndex ? streamUrl : null}
              activeDj={i === currentIndex ? activeDj : null}
              listenerCount={i === currentIndex ? listenerCount : 0}
              messages={i === currentIndex ? messages : []}
              user={user}
              onReact={sendReaction} onSendMessage={sendMessage}
              onPlayStateChange={setIsPlaying} onVolumeChange={setVolume}
              audioRef={i === currentIndex ? audioRef : undefined}
            />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 4: Delete removed component files**

```bash
rm apps/web/src/components/station/DJSection.tsx
rm apps/web/src/components/station/DJBioModal.tsx
```

Check LiveChat references:
```bash
grep -r "LiveChat" apps/web/src --include="*.tsx" --include="*.ts"
```
If no results: `rm apps/web/src/components/station/LiveChat.tsx`

- [ ] **Step 5: Typecheck — fix all errors**

```bash
npx turbo typecheck
```

- [ ] **Step 6: Visual check**

Run `npx turbo dev --filter=web`. Verify: hero background, glassmorphic cards, 5-emoji reactions, pink play button, DJ card modals, sidebar, chat panel, bottom player bar, keyboard arrows, dot indicators.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/station/ apps/web/src/components/layout/
git commit -m "feat: redesign StationCard and wire StationCarousel into AppShell"
```

---

## Task 11: Landing Page Visual Updates

**Files:**
- Modify: `apps/web/src/components/landing/FeaturedStations.tsx`
- Modify: `apps/web/src/components/landing/TopDJs.tsx`
- Modify: `apps/web/src/components/landing/TrendingSongs.tsx`

- [ ] **Step 1: Read all three components**

Read each file before editing.

- [ ] **Step 2: Update FeaturedStations — image cards with LIVE badge**

Card template:
```tsx
<div onClick={() => onStationClick?.(index)} style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9', cursor: 'pointer' }}>
  <img src={station.artworkUrl ?? getStationPlaceholder(station.genre)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,15,26,0.9) 0%, rgba(0,0,0,0.1) 60%)' }} />
  <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
    {station.isLive
      ? <span style={{ background: 'var(--pink)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 700, color: '#fff' }}>LIVE</span>
      : <span style={{ background: 'rgba(0,0,0,0.5)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>COMING SOON</span>
    }
  </div>
  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
    <div style={{ fontSize: '15px', fontWeight: 700 }}>{station.name}</div>
    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{station.genre}</div>
  </div>
</div>
```

Grid: `gridTemplateColumns: 'repeat(4, 1fr)'`.

- [ ] **Step 3: Update TopDJs — circular avatars with online dot**

```tsx
<div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }} className="scrollbar-hide">
  {djs.map((dj) => (
    <div key={dj.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '2px solid var(--border-medium)' }}>
          🎧
        </div>
        {dj.isOnline && (
          <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', border: '2px solid var(--bg-primary)' }} />
        )}
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{dj.name}</span>
    </div>
  ))}
</div>
```

Adapt `dj.isOnline` to the actual field name in the data.

- [ ] **Step 4: Update TrendingSongs — ranked rows**

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
  <span style={{ width: '20px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)', textAlign: 'center' }}>{rank}</span>
  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🎵</div>
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</div>
    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{song.artist}</div>
  </div>
  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{song.stationName}</span>
</div>
```

Grid: `repeat(2, 1fr)`.

- [ ] **Step 5: Typecheck and commit**

```bash
npx turbo typecheck
git add apps/web/src/components/landing/
git commit -m "feat: image-based FeaturedStations, TopDJs avatars, TrendingSongs rows"
```

---

## Task 12: Mock Pages — Browse, Library, Profile

**Files:**
- Create: `apps/web/src/app/browse/page.tsx`
- Create: `apps/web/src/app/library/page.tsx`
- Create: `apps/web/src/app/profile/page.tsx`

- [ ] **Step 1: Create Browse page**

```tsx
// apps/web/src/app/browse/page.tsx
export default function BrowsePage() {
  const GENRES = [
    { name: 'Rock', emoji: '🎸' }, { name: 'Pop', emoji: '🎤' },
    { name: 'Hip-Hop', emoji: '🎧' }, { name: 'Lo-Fi', emoji: '☕' },
    { name: 'OPM', emoji: '🌴' }, { name: 'Jazz', emoji: '🎷' },
    { name: 'Electronic', emoji: '⚡' }, { name: 'Classical', emoji: '🎻' },
  ];
  const MOODS = ['Chill', 'Hype', 'Focus', 'Late Night', 'Morning', 'Workout'];
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Browse</h1>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>Genres</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {GENRES.map(({ name, emoji }) => (
          <div key={name} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{emoji}</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{name}</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>Explore by Mood</h2>
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }} className="scrollbar-hide">
        {MOODS.map((mood) => (
          <div key={mood} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', padding: '10px 24px', whiteSpace: 'nowrap', cursor: 'pointer', border: '1px solid var(--border-subtle)', fontSize: '14px', fontWeight: 500 }}>
            {mood}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Library page**

```tsx
// apps/web/src/app/library/page.tsx
export default function LibraryPage() {
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Your Library</h1>
      {['Your Stations', 'Recently Played', 'Liked Songs'].map((section) => (
        <div key={section} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>{section}</h2>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📻</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Browse stations to add to your library</div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create Profile page**

```tsx
// apps/web/src/app/profile/page.tsx
export default function ProfilePage() {
  const SETTINGS = [
    { label: 'Push Notifications',  desc: 'Get alerts for your favorite DJs'   },
    { label: 'High Audio Quality',  desc: 'Stream at 320kbps when available'    },
    { label: 'Dark Mode',           desc: 'Always on for OwnRadio'              },
    { label: 'Show Listener Count', desc: 'Display live listener numbers'        },
  ];
  return (
    <div style={{ padding: '24px', maxWidth: '540px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, color: '#fff' }}>U</div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>User</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>user@example.com</div>
        </div>
      </div>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>Settings</h2>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: '24px' }}>
        {SETTINGS.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: i < SETTINGS.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.desc}</div>
            </div>
            <div style={{ width: '44px', height: '24px', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', cursor: 'pointer' }} />
          </div>
        ))}
      </div>
      <button style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        Sign Out
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
npx turbo typecheck
git add apps/web/src/app/browse/ apps/web/src/app/library/ apps/web/src/app/profile/
git commit -m "feat: mock Browse, Library, and Profile pages"
```

---

## Task 13: Google OAuth Integration

**Files:**
- Modify: `apps/web/src/components/landing/LoginSection.tsx`

- [ ] **Step 1: Read LoginSection**

Read `apps/web/src/components/landing/LoginSection.tsx`. Find the Google OAuth button's current onClick.

- [ ] **Step 2: Replace placeholder with real redirect**

Find the onClick handler that calls `alert("coming soon")` or is empty. Replace with:

```tsx
onClick={() => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error('NEXT_PUBLIC_API_URL is not set');
    return;
  }
  window.location.href = `${apiUrl}/auth/google`;
}}
```

No hardcoded fallback URL.

- [ ] **Step 3: Typecheck and commit**

```bash
npx turbo typecheck
git add apps/web/src/components/landing/LoginSection.tsx
git commit -m "feat: wire Google OAuth button to real redirect"
```

---

## Task 14: Final Verification and Cleanup

- [ ] **Step 1: Full typecheck**

```bash
npx turbo typecheck
```

Expected: 0 errors.

- [ ] **Step 2: Lint**

```bash
npx turbo lint
```

Fix warnings only in files you touched.

- [ ] **Step 3: Visual walkthrough**

Run `npx turbo dev --filter=web`. Check:
1. Landing: hero, station cards with images and LIVE badge, Top DJs row, Trending Songs rows
2. Station view: hero background, glassmorphic now-playing card, equalizer bars, 5 reaction emojis, pink play button, DJ card with working modals
3. Reactions: glow on select, deselect on re-click, clear on song change
4. Sidebar toggle (hamburger), station click in sidebar switches station
5. Chat panel toggle, messages visible
6. Keyboard left/right changes station
7. Dot indicators update and are clickable
8. Browse, Library, Profile reachable from sidebar nav, render without error
9. Google OAuth button redirects to correct URL (check network tab)

- [ ] **Step 4: Check no dead imports**

```bash
grep -r "DJSection\|DJBioModal\|LiveChat" apps/web/src --include="*.tsx" --include="*.ts"
```

Expected: 0 results.

- [ ] **Step 5: Final commit**

```bash
git add -p
git commit -m "chore: final verification and cleanup for UI redesign"
```

- [ ] **Step 6: Push and monitor CI**

```bash
git push origin main
gh run list --limit 5
gh run view <id>
```
