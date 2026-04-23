# OwnRadio UI Redesign — Design Spec

**Date:** 2026-04-23
**Status:** Approved
**Mockup:** `demo/full-app-mockup.html` (6 views: desktop/mobile/responsive x landing/station)

---

## 1. Design System

### Colors (CSS custom properties)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0f0f1a` | Page background |
| `--bg-secondary` | `#1a1a2e` | Sidebar, chat panel |
| `--bg-card` | `#1e1e32` | Card backgrounds |
| `--bg-elevated` | `#252540` | Hover states, inputs |
| `--border-subtle` | `rgba(255,255,255,.06)` | Dividers, card borders |
| `--border-medium` | `rgba(255,255,255,.1)` | Hover borders, reaction active |
| `--pink` | `#ff2d78` | Primary accent |
| `--pink-light` | `#ff6b9d` | Gradients, secondary accent |
| `--text-primary` | `#ffffff` | Headings, body |
| `--text-secondary` | `rgba(255,255,255,.65)` | Descriptions |
| `--text-tertiary` | `rgba(255,255,255,.4)` | Metadata |
| `--text-muted` | `rgba(255,255,255,.25)` | Placeholders, hints |

### Typography

- **Font family:** Inter (loaded from Google Fonts), fallback to system sans-serif
- **Weights:** 400 (body), 500 (nav), 600 (labels), 700 (headings), 800-900 (hero titles)
- **Scale:** Station name 32px, section titles 20px, body 14px, metadata 11-12px, badges 9-10px

### Radius & Shadows

| Token | Value |
|-------|-------|
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `16px` |
| `--radius-xl` | `20px` |
| `--radius-full` | `9999px` |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,.3)` |
| `--shadow-elevated` | `0 8px 32px rgba(0,0,0,.5)` |

### Transitions

- Fast (hover, active): `150ms cubic-bezier(.4,0,.2,1)`
- Medium (panel toggle, slide): `300ms cubic-bezier(.4,0,.2,1)`

### Glassmorphism

Used on: genre badges, now-playing song card, live indicator.
Pattern: `background: rgba(0,0,0,.35); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.08);`

---

## 2. Layout & Navigation

### Desktop (≥1024px)

```
┌──────────┬──────────────────────────┬──────────┐
│ Sidebar  │      Top Bar             │          │
│ (240px)  │ [☰] [·· dots ··] [💬]   │          │
│ collapse │──────────────────────────│  Chat    │
│          │                          │  Panel   │
│ Logo     │   Station Detail         │  (320px) │
│ Nav      │   (scrollable)           │  collapse│
│ Stations │                          │          │
│          │                          │          │
├──────────┴──────────────────────────┴──────────┤
│              Bottom Player Bar (72px)          │
└────────────────────────────────────────────────┘
```

- **Sidebar:** Collapsible via hamburger button in top bar. Contains: logo, nav (Home, Stations, Browse, Library), divider, station list with thumbnails and live/offline dots.
- **Chat Panel:** Collapsible via chat icon in top bar. Contains: header with online count badge, message list with user avatars, input with send button.
- **Top Bar:** Hamburger toggle (left), dot indicators for station carousel (center), chat toggle (right).
- **Station navigation:** Left/right click zones on edges of main content area (arrow buttons appear on hover). Keyboard left/right arrows. Touch swipe on trackpad/touch screens. Dot indicators clickable.

### Mobile Responsive (desktop site on mobile browser, <768px)

- Sidebar: Hidden entirely, hamburger opens as overlay/drawer
- Chat panel: Becomes inline collapsible card within the station detail scroll
- Station grid: 4-col → 2-col
- Trending songs: 2-col → 1-col
- Reaction strip: Vertical → horizontal row
- Top bar persists with hamburger + dots + chat toggle
- Swipe left/right on main body to change stations

### Mobile App View (<430px frame)

- Bottom tab bar: Home, Stations, Browse, Profile (70px, with safe area padding)
- Mini-player: Floating bar above tab bar (56px) with song art, title, play button, progress bar
- Station page: Full hero image background, back button, inline sections
- Chat: Bottom-sheet style collapsible card with chevron toggle
- Reactions: Horizontal row below hero

---

## 3. Pages

### 3.1 Landing Page (Home)

**Sections (top to bottom):**

1. **Hero:** Logo icon (animated pulse), "OwnRadio" gradient title, tagline, 3 stats (Stations / Listeners / DJs)
2. **Featured Stations:** Grid of station cards. Each card: full-bleed image background, gradient overlay, LIVE or COMING SOON badge, station name, genre tag, DJ name, current song, listener count. Desktop 4-col grid, responsive 2-col, mobile horizontal scroll.
3. **Top DJs:** Horizontal scroll of circular avatar photos with name labels and online dots.
4. **Trending Songs:** Song rows with rank number, album art thumbnail, title, artist, station name. Desktop 2-col grid, responsive 1-col.
5. **CTA Section:** "Join the crowd" heading, description, "Start Listening" gradient button.

**Clicking a station card → transitions to Station view.**

### 3.2 Station Page

**Hero Section:**
- Full-bleed station artwork as background image (`filter: brightness(.5) saturate(1.2)`)
- Gradient overlay from bottom (bg-primary at 0% to transparent)
- Genre badge (glassmorphic pill, top-left)
- LIVE indicator (green dot + text, top-right)
- Station name (32px, 900 weight)
- Now-playing card (glassmorphic): album art image (48x48), song title, artist, animated playing bars

**Reaction Strip (beside hero on desktop, below hero on mobile):**
- 5 buttons: 🤘 ❤️ 🎵 😴 👎
- No counts shown to users
- Active state: pink border + glow shadow
- One reaction per song, resets on song change
- Tap animation: scale(.85) → scale(1)

**Audio Controls Card:**
- Volume down button, volume slider (gradient fill, thumb appears on hover), volume up button, play/pause button (48px circle, pink gradient, shadow)

**DJ Card:**
- DJ photo (44px circle, pink border, green online dot)
- DJ name, listener count
- Action buttons: Playlist, Top 10, Fans (open mock content modals)

**Live Chat (right panel / inline card):**
- Header: "Live Chat" + online count badge
- Messages: user avatar photo (30px), username (pink), timestamp, message text
- DJ messages: green username color
- Input: rounded pill with send button

### 3.3 Browse Page (mock content)

- Genre category grid with cover images (Rock, Pop, Hip-Hop, Lo-Fi, OPM, etc.)
- Each genre card links to a filtered station list
- "Explore by mood" horizontal scroll (Chill, Hype, Focus, Late Night)
- All data is static/mock — no API wiring

### 3.4 Library Page (mock content)

- "Your Stations" list with saved/favorited stations (mock)
- "Recently Played" section
- "Liked Songs" list
- Empty states with "Browse stations to add to your library"

### 3.5 Profile Page (mock content)

- User avatar, display name, email
- Settings sections: Notifications, Audio Quality, Theme
- "Sign Out" button
- All toggles/options are non-functional UI

### 3.6 DJ Feature Modals (mock content)

- **Playlist:** Bottom sheet showing list of upcoming/recent songs with album art
- **Top 10:** Ranked list of most-played songs on this station
- **Fans:** Grid of listener avatars with listener count
- All use mock data, same bottom-sheet modal pattern as DJBioModal

### 3.7 Login Page

- Email/password form (existing)
- Google OAuth button (real integration)
- "Continue as guest" link → goes to station
- Sign up link (placeholder)

---

## 4. Reactions System

### Emoji Set

| Emoji | Label | Sentiment Score | Analytics Use |
|-------|-------|----------------|---------------|
| 🤘 | Rock | +2 | Strong positive — trending signal |
| ❤️ | Love | +1 | General approval — baseline positive |
| 🎵 | Vibe | 0 | Neutral engagement — "I'm here" |
| 😴 | Sleepy | -1 | Mild negative — skip signal for DJ |
| 👎 | Nah | -2 | Clear dislike — DJ adjustment signal |

### Behavior

- **Hidden counts:** Counts are never displayed to users (prevents bandwagon). Tracked server-side for analytics dashboards.
- **One per song:** Tapping a new reaction deselects the previous. Tapping the active one deselects it (no reaction).
- **Reset on song change:** When `now_playing` event fires with a new song, active reaction clears.
- **Socket event:** `reaction` emitted with `{ songId, stationId, type }` — same as current.
- **Active state UI:** Pink glow ring (`border-color: rgba(255,45,120,.4); box-shadow: 0 0 14px rgba(255,45,120,.25)`) + pink background tint.

---

## 5. Placeholder Images

### Strategy

Bundle royalty-free images from Unsplash in `/public/placeholders/` for use when no uploaded artwork exists.

### Files

```
public/placeholders/
├── stations/
│   ├── pop.jpg          # Concert/stage photo
│   ├── rock.jpg         # Guitar/rock concert
│   ├── hiphop.jpg       # Urban/studio
│   ├── lofi.jpg         # Cozy/ambient scene
│   ├── opm.jpg          # Tropical/cultural
│   └── default.jpg      # Generic music scene
├── djs/
│   └── default.jpg      # Silhouette/headphones
├── songs/
│   └── default.jpg      # Vinyl/turntable
└── profile/
    └── default.jpg      # Avatar silhouette
```

### Usage

Components check `artworkUrl` / `avatarUrl` / `albumCoverUrl` — if empty or null, fall back to the genre-matched placeholder from `/public/placeholders/`.

---

## 6. Bottom Player Bar

### Desktop (72px height)

| Left (240px) | Center (flex) | Right (240px) |
|--------------|---------------|---------------|
| Album art (44px) + song title + artist · station | Progress bar + play/pause button (36px white circle) | Listener count (green dot + count) + volume slider |

### Mobile Mini-Player (56px, floating above tab bar)

| Left | Center | Right |
|------|--------|-------|
| Album art (36px) | Song title + artist | Play button (32px pink circle) |
| Progress bar spans full width at bottom (2px) |

---

## 7. Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| ≥1024px | Full desktop: sidebar + main + chat panel |
| 768–1023px | Sidebar collapsed by default, chat as inline card, 2-col grids |
| <768px | Mobile responsive: no sidebar (hamburger overlay), 2-col stations, 1-col songs, horizontal reactions, inline chat card |
| <430px (mobile frame) | Bottom tab bar, mini-player, full-height hero, bottom-sheet chat |

---

## 8. Components to Create/Modify

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AppShell` | `components/layout/AppShell.tsx` | Sidebar + main + chat panel + bottom bar wrapper |
| `Sidebar` | `components/layout/Sidebar.tsx` | Collapsible nav sidebar with station list |
| `TopBar` | `components/layout/TopBar.tsx` | Hamburger + dots + chat toggle |
| `BottomPlayerBar` | `components/layout/BottomPlayerBar.tsx` | Persistent mini-player |
| `MobileTabBar` | `components/layout/MobileTabBar.tsx` | Bottom tabs (mobile responsive) |
| `ChatPanel` | `components/station/ChatPanel.tsx` | Refactored from LiveChat, collapsible |
| `BrowsePage` | `app/browse/page.tsx` | Mock genre grid |
| `LibraryPage` | `app/library/page.tsx` | Mock saved stations |
| `ProfilePage` | `app/profile/page.tsx` | Mock user settings |
| `PlaylistModal` | `components/station/PlaylistModal.tsx` | Mock song list sheet |
| `TopSongsModal` | `components/station/TopSongsModal.tsx` | Mock ranked songs |
| `FansModal` | `components/station/FansModal.tsx` | Mock listener grid |

### Modified Components

| Component | Changes |
|-----------|---------|
| `StationCard` | Hero image background, glassmorphic song card, album art |
| `StationCarousel` | Integrate into AppShell main area, keep swipe/click nav |
| `ReactionBar` | 5 emojis, hidden counts, vertical (desktop) / horizontal (mobile) |
| `AudioControls` | Polished slider with thumb, gradient play button |
| `DJSection` | DJ photo, functional-looking action buttons with mock modals |
| `FeaturedStations` | Image-based cards with overlay, LIVE/COMING SOON badges |
| `TopDJs` | Real avatar photos, online indicators |
| `TrendingSongs` | Album art thumbnails in rows |
| `LoginSection` | Google OAuth integration, polished CTA |
| `Hero` | Keep existing but with updated typography |
| `globals.css` | New design tokens, Inter font import |

### Removed Components

| Component | Reason |
|-----------|--------|
| `DJBioModal` | Replaced by richer DJ section with multiple modals |

---

## 9. Existing Features Preserved

All current functionality remains intact:

- HLS.js audio streaming
- Socket.io real-time updates (now_playing, reactions, chat, listener count)
- Authentication (email login, session restore, logout)
- Station carousel with touch/keyboard navigation
- Live chat messaging
- DJ bio display
- API integration (/stations, /me, /auth/login)

---

## 10. Auth Changes

- **Google OAuth:** Replace `alert("coming soon")` with real Google OAuth flow
- **Email/password:** Keep existing flow
- **Guest access:** Continue allowing browsing and listening without login. Chat requires login.

---

## 11. Out of Scope

- Backend API changes (all mock pages use client-side static data)
- Station creation/management dashboard
- DJ broadcasting interface
- Real search functionality (Browse page is mock)
- Push notifications
- Native mobile app (this is responsive web only)
