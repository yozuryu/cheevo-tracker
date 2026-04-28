# Architecture

## Stack

| Layer | Technology | Constraints |
|---|---|---|
| UI framework | React 18.2 via CDN (esm.sh) | No build step. JSX transpiled in-browser by Babel standalone. |
| Styling | Tailwind CSS via CDN | Arbitrary values allowed: `text-[11px]`, `w-[140px]`. |
| Icons | Lucide React 0.263.1 via CDN | Fixed version — do not upgrade without checking breaking changes. |
| Hosting | GitHub Pages | Static files only. No server-side rendering, no backend. |
| JS module format | Native ES modules | `type="module"` in HTML. No bundler. |

## Directory Layout

```
cheevo-tracker/
├── index.html          # Login page
├── login.js            # Login React app
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── changelog.md        # Source of truth for changelog page
│
├── assets/
│   ├── mobile-nav.js   # Shared bottom nav IIFE (mobile only, < 768px)
│   └── ui.js           # Shared Topbar + Footer components (React.createElement, no JSX)
│
├── profile/            # Main profile page
│   ├── index.html
│   ├── app.js          # ~2150 LOC React app
│   └── utils/          # Shared utilities — used by ALL pages
│       ├── ra-api.js   # RA API client (two-layer: raw wrappers + app composites)
│       ├── constants.js
│       ├── helpers.js
│       └── transform.js
│
├── game/               # Game detail page (?id=<gameId>)
├── achievement/        # Achievement detail page (?id=<achievementId>)
├── console/            # Console game list page (?id=<consoleId>)
├── user/               # User profile visitor page (?u=<username>)
├── settings/           # Settings page
└── changelog/          # Changelog viewer page
```

Each page directory contains `index.html` + `app.js`. No shared component files — each `app.js` is self-contained.

## Shared Utilities

All pages import from `profile/utils/` using relative paths:

```js
import { MEDIA_URL, SITE_URL } from '../profile/utils/constants.js';
import { getMediaUrl, parseTitle, formatDate, formatTimeAgo } from '../profile/utils/helpers.js';
import { getCredentials, clearCredentials, fetchProfile, ... } from '../profile/utils/ra-api.js';
```

`assets/ui.js` exports `Topbar` and `Footer`. It uses `React.createElement` (not JSX) because it is not transpiled by Babel.

### `constants.js`

| Export | Value |
|---|---|
| `MEDIA_URL` | `https://media.retroachievements.org` |
| `SITE_URL` | `https://retroachievements.org` |
| `TILDE_TAG_COLORS` | Map of tag name → hex color (Hack, Homebrew, Demo, Prototype) |

### `helpers.js`

Pure utility functions — no API calls, no state.

| Function | Signature | Purpose |
|---|---|---|
| `getMediaUrl(path)` | `(string) → string` | Prepends `MEDIA_URL` to an RA image path |
| `formatTimeAgo(date, refTime)` | `(Date, Date?) → string` | Human-readable relative time ("3 days ago") |
| `formatDate(date)` | `(Date) → string` | Short formatted date string |
| `parseTitle(title)` | `(string) → { title, tag, subset }` | Strips `~Tag~` prefixes and `[Subset - Name]` suffixes |

### `ra-api.js` — App Composites

Full endpoint reference: [`profile/utils/ra-api.md`](../profile/utils/ra-api.md)

The only functions `app.js` calls directly (Layer 2). All cache in `sessionStorage` with a 5-min TTL.

| Function | Cache key | What it does |
|---|---|---|
| `fetchProfile(u, k)` | `ra_profile_{u}` | 5 parallel requests on mount; returns `{ profileData, firstChunkAchievements }` |
| `fetchAchievementsChunk(u, k, idx)` | `ra_chunk_{u}_{idx}` | 6-month achievement window by index (0 = latest) |
| `fetchWatchlist(u, k)` | `ra_watchlist_{u}` | Full want-to-play list, all pages |
| `fetchGameDetails(u, k, gameId)` | `ra_game_{u}_{gameId}` | Game metadata + per-achievement user progress incl. `userTotalPlaytime` |
| `fetchSocial(u, k)` | `ra_social_{u}` (localStorage, 1h) | Following + followers lists |
| `validateCredentials(u, k)` | — | Minimal profile call; throws `AUTH_ERROR` if invalid |

### `profileData` shape

Returned by `fetchProfile`, consumed by `transformData`.

```
{
  metadata:              { extractionTimestamp }
  coreProfile:           { user, userPic, memberSince, richPresenceMsg, totalPoints,
                           totalSoftcorePoints, totalTruePoints, motto }
  userSummary:           { rank, totalRanked, softcoreRank, status, lastActivity }
  gameAwardsAndProgress: { total, results: [{ gameId, title, consoleName, imageIcon,
                           numAwarded, numAwardedHardcore, maxPossible,
                           highestAwardKind, highestAwardDate, mostRecentAwardedDate }] }
  pageAwards:            { visibleUserAwards: [{ awardType, imageIcon, awardData,
                           title, consoleName, awardedAt }] }
  recentlyPlayedGames:   [{ gameId, title, consoleName, lastPlayed, imageIcon,
                           imageIngame, imageTitle, numAchieved, numPossibleAchievements }]
  mostRecentGame:        { gameId, title, consoleName, lastPlayed, imageIcon } | null
  mostRecentAchievement: { achievementId, title, description, points, trueRatio,
                           badgeName, hardcoreMode, gameId, gameTitle, gameIcon,
                           consoleName, date } | null
  points7Days:           number
  points30Days:          number
}
```

### `rawData` memo shape

Assembled in `profile/app.js`, passed to `transformData()` → `{ profile, games, backlog }`.

```
rawData = {
  ...profileData,          // from fetchProfile()
  wantToPlayList,          // from fetchWatchlist(), null until watchlist tab opens
  recentAchievements: [],  // not used directly — achievements handled via achievementChunks
  detailedGameProgress,    // lazy-populated per game via fetchGameDetails()
}
```

Do not bypass `transformData`. All derived fields (progress %, mastery status, subset parsing) live in `transform.js`.

## Data Flow

```
RA API (live)
    ↓  ra-api.js (raw wrappers → camelCase)
    ↓  ra-api.js (app composites → sessionStorage cache, 5-min TTL)
    ↓  app.js useState / useMemo (rawData)
    ↓  transform.js (transformData → { profile, games, backlog })
    ↓  React components
```

- Raw RA API responses are PascalCase (`GameID`, `NumAwarded`). `ra-api.js` maps everything to camelCase before returning.
- Do not read raw API fields in `app.js`. Call exported composites only.
- `transform.js` is the single merge point. Do not build derived UI state from raw API data directly.

## Caching Strategy

| Store | TTL | What is cached |
|---|---|---|
| `sessionStorage` | 5 min | Profile data, achievement chunks, game details, watchlist (`ra_*` keys) |
| `localStorage` | 1 hour | Social data (following/followers, `ra_social_*`) |
| `sessionStorage` | 5 min | Per-friend game data on game page (`ra_fg_*`) |

Bust cache: `sessionStorage.clear()` for session data, `localStorage.removeItem(key)` for social.

## Auth

- Credentials stored in `localStorage` as `raCredentials = { username, apiKey }`.
- Every page calls `getCredentials()` on mount. Null → `handleAuthError()` → clear localStorage → redirect to `/`.
- Any API call returning `AUTH_ERROR` also triggers `handleAuthError()`.
- `validateCredentials(u, k)` is the only function used before credentials are stored (login flow).

## PWA / Service Worker

- Cache-first for same-origin static assets.
- Network-first for `changelog.md` (always fresh).
- Cross-origin RA API requests pass through untouched.

## Mobile Nav

`assets/mobile-nav.js` is an IIFE injected via `<script>`. On screens < 768px it:
- Hides `.page-topbar` and `footer`
- Adds `padding-bottom` to body
- Repositions `.scroll-top-btn` above the nav bar

Two nav tabs: Profile (`/profile/`) and Log (`/changelog/`).
