# Icon System Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all emoji icons in the web app with Lucide React stroke SVGs for consistent, OS-independent rendering.

**Architecture:** Install `lucide-react` in `apps/web`. Import named icon components at each use site. No shared wrapper — import directly. Heart icon in ReactionBar fills pink when active; all others are stroke-only.

**Tech Stack:** lucide-react, React, Next.js App Router, TypeScript

---

## File Map

| File | Change |
|---|---|
| `apps/web/package.json` | add `lucide-react` dependency |
| `apps/web/src/components/station/AudioControls.tsx` | 🔉→VolumeX, 🔊→Volume2, 📡→WifiOff |
| `apps/web/src/components/station/ReactionBar.tsx` | 🤘→Zap, ❤️→Heart, 🎵→Music, 😴→Moon, 👎→ThumbsDown |
| `apps/web/src/components/station/PlaylistModal.tsx` | 🎵→Music |
| `apps/web/src/components/station/StationCard.tsx` | 🎙️→Mic2 |
| `apps/web/src/components/layout/BottomPlayerBar.tsx` | 🎵→Music, ⏸/▶→SVG |
| `apps/web/src/app/library/page.tsx` | 📻→Radio |
| `apps/web/src/app/browse/page.tsx` | 🎸→Guitar, 🎤→Mic, 🎧→Headphones, ☕→Coffee |

---

### Task 1: Install lucide-react

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install the package**

```bash
cd apps/web && npm install lucide-react
```

- [ ] **Step 2: Verify it appears in package.json**

```bash
grep lucide apps/web/package.json
```

Expected: `"lucide-react": "^0.x.x"`

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json
git commit -m "chore(web): install lucide-react for icon system"
```

---

### Task 2: Replace emoji in AudioControls

**Files:**
- Modify: `apps/web/src/components/station/AudioControls.tsx`

The file currently has three emoji: `🔉` (volume down button), `🔊` (volume up button), `📡` (stream error state).

- [ ] **Step 1: Add imports at the top of AudioControls.tsx**

Replace the existing import line:
```typescript
import Hls from 'hls.js';
```
With:
```typescript
import Hls from 'hls.js';
import { Volume2, VolumeX, WifiOff } from 'lucide-react';
```

- [ ] **Step 2: Replace the stream error icon**

Find (around line 261):
```tsx
<span style={{ fontSize: '18px' }}>📡</span>
```
Replace with:
```tsx
<WifiOff size={18} color="rgba(255,255,255,0.4)" />
```

- [ ] **Step 3: Replace volume down button content**

Find:
```tsx
>
              🔉
            </button>
```
Replace with:
```tsx
>
              <VolumeX size={16} color="rgba(255,255,255,0.65)" />
            </button>
```

- [ ] **Step 4: Replace volume up button content**

Find:
```tsx
>
              🔊
            </button>
```
Replace with:
```tsx
>
              <Volume2 size={16} color="rgba(255,255,255,0.65)" />
            </button>
```

- [ ] **Step 5: Run typecheck**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/station/AudioControls.tsx
git commit -m "feat(web): replace audio control emoji with Lucide icons"
```

---

### Task 3: Replace emoji in ReactionBar

**Files:**
- Modify: `apps/web/src/components/station/ReactionBar.tsx`

The REACTIONS array currently stores emoji strings. Replace with Lucide components rendered inline. Heart fills pink when active; others use stroke only.

- [ ] **Step 1: Rewrite ReactionBar.tsx**

Replace the entire file content with:

```tsx
'use client';
import { useState } from 'react';
import { Zap, Heart, Music, Moon, ThumbsDown, type LucideIcon } from 'lucide-react';
import { ReactionType } from '@ownradio/shared';

const REACTIONS: { type: ReactionType; Icon: LucideIcon; label: string }[] = [
  { type: 'rock',   Icon: Zap,        label: 'Rock'   },
  { type: 'love',   Icon: Heart,      label: 'Love'   },
  { type: 'vibe',   Icon: Music,      label: 'Vibe'   },
  { type: 'sleepy', Icon: Moon,       label: 'Sleepy' },
  { type: 'nah',    Icon: ThumbsDown, label: 'Nah'    },
];

interface ReactionBarProps {
  activeReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  orientation?: 'vertical' | 'horizontal';
}

export function ReactionBar({ activeReaction, onReact, orientation = 'vertical' }: ReactionBarProps) {
  const isVertical = orientation === 'vertical';
  const [hoveredType, setHoveredType] = useState<ReactionType | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: '8px', padding: '8px' }}>
      {REACTIONS.map(({ type, Icon, label }) => {
        const isActive = activeReaction === type;
        const isLove = type === 'love';
        return (
          <button
            key={type}
            onClick={() => onReact(type)}
            aria-label={label}
            aria-pressed={isActive}
            onMouseEnter={() => setHoveredType(type)}
            onMouseLeave={(e) => { setHoveredType(null); (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              border: isActive
                ? '1.5px solid rgba(255,45,120,0.5)'
                : hoveredType === type
                  ? '1.5px solid rgba(255,255,255,0.15)'
                  : '1.5px solid transparent',
              background: isActive
                ? 'rgba(255,45,120,0.12)'
                : hoveredType === type
                  ? 'rgba(255,255,255,0.05)'
                  : 'transparent',
              boxShadow: isActive ? '0 0 14px rgba(255,45,120,0.25)' : 'none',
              cursor: 'pointer',
              transition: 'all 150ms cubic-bezier(.4,0,.2,1)',
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.85)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            <Icon
              size={20}
              strokeWidth={1.75}
              color={isActive ? '#ff2d78' : 'rgba(255,255,255,0.65)'}
              fill={isActive && isLove ? 'rgba(255,45,120,0.9)' : 'none'}
            />
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/station/ReactionBar.tsx
git commit -m "feat(web): replace reaction emoji with Lucide icons, Heart fills on active"
```

---

### Task 4: Replace emoji in PlaylistModal, StationCard, and BottomPlayerBar

**Files:**
- Modify: `apps/web/src/components/station/PlaylistModal.tsx`
- Modify: `apps/web/src/components/station/StationCard.tsx`
- Modify: `apps/web/src/components/layout/BottomPlayerBar.tsx`

- [ ] **Step 1: Update PlaylistModal.tsx**

Add import after `'use client';`:
```tsx
import { Music } from 'lucide-react';
```

Replace the track icon div (line 24):
```tsx
<div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎵</div>
```
With:
```tsx
<div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  <Music size={16} strokeWidth={1.75} color="rgba(255,255,255,0.4)" />
</div>
```

- [ ] **Step 2: Update StationCard.tsx — replace 🎙️**

Add `Mic2` to imports (the file already imports from various places; add lucide import):
```tsx
import { Mic2 } from 'lucide-react';
```

Find (line 289):
```tsx
<span style={{ fontSize: '18px' }}>🎙️</span>
```
Replace with:
```tsx
<Mic2 size={18} strokeWidth={1.75} color="rgba(255,255,255,0.35)" />
```

- [ ] **Step 3: Update BottomPlayerBar.tsx**

Add imports after `'use client';`:
```tsx
import { Music } from 'lucide-react';
```

Replace the album art placeholder (line 21):
```tsx
<div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎵</div>
```
With:
```tsx
<div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
  <Music size={20} strokeWidth={1.75} color="rgba(255,255,255,0.4)" />
</div>
```

Replace the play button content (line 32) — the `'⏸'` and `'▶'` Unicode chars with SVGs:
```tsx
{isPlaying ? (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#000">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
) : (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: 1 }}>
    <polygon points="5,3 19,12 5,21" />
  </svg>
)}
```

- [ ] **Step 4: Run typecheck**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/station/PlaylistModal.tsx \
        apps/web/src/components/station/StationCard.tsx \
        apps/web/src/components/layout/BottomPlayerBar.tsx
git commit -m "feat(web): replace playlist, station card, and player bar emoji with Lucide icons"
```

---

### Task 5: Replace emoji in page files

**Files:**
- Modify: `apps/web/src/app/library/page.tsx`
- Modify: `apps/web/src/app/browse/page.tsx`

- [ ] **Step 1: Update library/page.tsx**

Add at top (after any existing imports or as first line if none):
```tsx
import { Radio } from 'lucide-react';
```

Replace (line 9):
```tsx
<div style={{ fontSize: '32px', marginBottom: '12px' }}>📻</div>
```
With:
```tsx
<div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
  <Radio size={32} strokeWidth={1.5} color="rgba(255,255,255,0.25)" />
</div>
```

- [ ] **Step 2: Update browse/page.tsx**

Replace the entire file with (only changing the GENRES map and rendering — no structural changes):

```tsx
import { Guitar, Mic, Headphones, Coffee, LucideIcon } from 'lucide-react';

export default function BrowsePage() {
  const GENRES: { name: string; Icon: LucideIcon }[] = [
    { name: 'Rock',        Icon: Guitar      },
    { name: 'Pop',         Icon: Mic         },
    { name: 'Hip-Hop',     Icon: Headphones  },
    { name: 'Lo-Fi',       Icon: Coffee      },
    { name: 'OPM',         Icon: Mic         },
    { name: 'Jazz',        Icon: Music       },
    { name: 'Electronic',  Icon: Zap         },
    { name: 'Classical',   Icon: Music       },
  ];
  const MOODS = ['Chill', 'Hype', 'Focus', 'Late Night', 'Morning', 'Workout'];
  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Browse</h1>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>Genres</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {GENRES.map(({ name, Icon }) => (
          <div key={name} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px 16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
              <Icon size={32} strokeWidth={1.5} color="rgba(255,255,255,0.7)" />
            </div>
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

Note: `Music` and `Zap` need to be added to the import. Full import line:
```tsx
import { Guitar, Mic, Headphones, Coffee, Music, Zap, type LucideIcon } from 'lucide-react';
```

- [ ] **Step 3: Run typecheck and lint**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/library/page.tsx apps/web/src/app/browse/page.tsx
git commit -m "feat(web): replace page emoji with Lucide icons in library and browse"
```

---

### Task 6: Final gate

- [ ] **Step 1: Run full typecheck + lint from repo root**

```bash
npx turbo typecheck lint --filter=web --filter=@ownradio/shared
```

Expected: `Tasks: 3 successful, 3 total` (or similar), 0 errors

- [ ] **Step 2: Verify no emoji remain in source**

```bash
grep -r "🔉\|🔊\|📡\|🤘\|❤️\|🎵\|😴\|👎\|📻\|🎸\|🎤\|🎧\|☕\|🎙️" apps/web/src --include="*.tsx"
```

Expected: no output

- [ ] **Step 3: Push**

```bash
git push origin main
```
