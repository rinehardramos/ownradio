# Icon System Replacement Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all emoji icons in the web app with consistent Lucide React stroke SVGs to eliminate OS-dependent rendering and colour clashes with the dark aesthetic.

**Architecture:** Install `lucide-react` as the single icon dependency. Import individual named icons at each use site — tree-shaking ensures only used icons are bundled. Play/pause buttons remain as existing custom inline SVGs.

**Tech Stack:** `lucide-react`, React, Next.js App Router

---

## Scope

13 emoji instances across 7 files are replaced. No other files are touched.

| File | Emoji | Lucide icon |
|---|---|---|
| `apps/web/src/components/station/AudioControls.tsx` | 🔉 | `VolumeX` |
| `apps/web/src/components/station/AudioControls.tsx` | 🔊 | `Volume2` |
| `apps/web/src/components/station/AudioControls.tsx` | 📡 | `WifiOff` |
| `apps/web/src/components/station/ReactionBar.tsx` | 🤘 | `Zap` |
| `apps/web/src/components/station/ReactionBar.tsx` | ❤️ | `Heart` |
| `apps/web/src/components/station/ReactionBar.tsx` | 🎵 | `Music` |
| `apps/web/src/components/station/ReactionBar.tsx` | 😴 | `Moon` |
| `apps/web/src/components/station/ReactionBar.tsx` | 👎 | `ThumbsDown` |
| `apps/web/src/components/station/PlaylistModal.tsx` | 🎵 | `Music` |
| `apps/web/src/components/layout/BottomPlayerBar.tsx` | 🎵 | `Music` |
| `apps/web/src/app/library/page.tsx` | 📻 | `Radio` |
| `apps/web/src/app/browse/page.tsx` | 🎸 | `Guitar` |
| `apps/web/src/app/browse/page.tsx` | 🎤 | `Mic` |
| `apps/web/src/app/browse/page.tsx` | 🎧 | `Headphones` |
| `apps/web/src/app/browse/page.tsx` | ☕ | `Coffee` |

## Styling Rules

- **Size:** match the emoji size in each context — typically `size={18}` or `size={20}`
- **Colour:** inherit via `color="currentColor"` (default in Lucide)
- **Stroke width:** `strokeWidth={1.75}` site-wide for a consistent weight
- **Active reaction (Heart):** when active, fill with `rgba(255,45,120,0.9)` and stroke with `#ff2d78`; all other reactions remain stroke-only at full opacity when active
- **Volume buttons:** `color="rgba(255,255,255,0.65)"` matching existing `--text-secondary`
- **Error state icon (WifiOff):** `color="rgba(255,255,255,0.4)"` matching surrounding muted text

## What Does Not Change

- Play / pause SVG icons in `AudioControls.tsx` (already custom, on-brand)
- All layout, spacing, border, animation styles
- The `btn-press` and `play-btn-glow` CSS classes
- ReactionBar hover/active border and background logic
