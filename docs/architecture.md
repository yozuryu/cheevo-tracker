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
├── profile/            # Main profile page (also visitor mode via ?u=<username>)
│   ├── index.html
│   ├── app.js          # ~4090 LOC React app
│   └── utils/          # Shared utilities — used by ALL pages
│       ├── ra-api.js   # RA API client (two-layer: raw wrappers + app composites)
│       ├── constants.js
│       ├── helpers.js
│       └── transform.js
│
├── game/               # Game detail page (?id=<gameId>)
├── achievement/        # Achievement detail page (?id=<achievementId>)
├── console/            # Console list + per-console game list (?id=<consoleId>)
├── search/             # Cross-console game search, backed by the IDB catalog
└── changelog/          # Changelog viewer page
```

There is no `user/` directory — visitor mode is the profile page with `?u=<username>`.
The `settings/` page was removed when its actions moved into the mobile menu sheet
(`assets/mobile-nav.js`); the empty directory is a leftover.

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
| `TILDE_TAG_COLORS` | Map of tag name → `{ bg, border, color }` (Homebrew, Demo, Prototype, Hack) |

### `helpers.js`

Pure utility functions — no API calls, no state.

| Function | Signature | Purpose |
|---|---|---|
| `getMediaUrl(path)` | `(string) → string` | Prepends `MEDIA_URL` to an RA image path |
| `formatTimeAgo(date, refTime)` | `(Date, Date?) → string` | Human-readable relative time ("3 days ago") |
| `formatDate(date)` | `(Date) → string` | Short formatted date string |
| `parseTitle(title)` | `(string) → { baseTitle, subsetName, isSubset, tags }` | Strips `~Tag~` prefixes into `tags[]` and splits `[Subset - Name]` suffixes |

### `ra-api.js` — App Composites

Full endpoint reference: [`profile/utils/ra-api.md`](../profile/utils/ra-api.md)

The only functions `app.js` calls directly (Layer 2). `CACHE_TTL` is **1 minute** — the
`sessionStorage`-backed composites use it; IDB- and localStorage-backed ones carry their own TTL.

| Function | Cache key | What it does |
|---|---|---|
| `fetchProfile(u, k)` | `ra_profile_{u}` | 5 parallel requests on mount; returns `{ profileData, firstChunkAchievements }` |
| `fetchAchievementsChunk(u, k, idx)` | `ra_chunk_{u}_{idx}` | 6-month achievement window by index (0 = latest) |
| `fetchWatchlist(u, k)` | `ra_watchlist_{u}` | Full want-to-play list, all pages |
| `fetchGameDetails(u, k, gameId)` | `ra_game_{u}_{gameId}` | Game metadata + per-achievement user progress incl. `userTotalPlaytime` |
| `fetchSocial(u, k)` | `ra_social_{u}` (localStorage, 1h) | Following + followers lists |
| `fetchCompletionMap(u, k)` | `ra_completion_{u}` (localStorage, 1h) | `{ [gameId]: { numAwarded, maxPossible, award } }` for every game the user has touched |
| `fetchFriendsActivity(u, k, followingList, { onProgress, onUser, onError })` | `ra_fa_{friendUser}` per user (localStorage, append) | 30-day window via 10-day chunks. No cache → full 3-chunk fetch. Fresh (<1h) → instant serve. Stale (≥1h) → serve stale immediately then incremental delta (≤10d=1 call, ≤20d=2, ≤30d=3, >30d=full refresh). 300ms between chunks, 1000ms between users (only when API called). |
| `allFriendsCached(followingList)` | — | Returns true if every user has any `ra_fa_*` entry (fresh or stale); stale entries are still served immediately then updated incrementally |
| `fetchAllAchievements(u, k, { onPartial })` | IDB `progress` store + `progress_ts_{u}` | Last ~12 months of unlocks as two 182-day chunks; `onPartial` fires after chunk 0 |
| `fetchBacklog(u, k, onPartial)` | IDB `backlog` store, 24h | Full want-to-play list, all pages |
| `fetchConsoles(u, k)` | `ra_consoles` (localStorage, 24h) | Active game systems, alphabetical |
| `fetchConsoleGames(u, k, consoleId)` | IDB `games`/`consoles` stores, 24h | Full game list for one console |
| `getAllGamesFromDB()` | IDB, no fetch | Whole cached catalog — powers the search page |
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
  wantToPlayList,          // backlogData — null until the Backlog tab opens
  recentAchievements: [],  // not used directly — achievements handled via achievementChunks
  detailedGameProgress,    // lazy-populated per game via fetchGameDetails()
}
```

Do not bypass `transformData`. All derived fields (progress %, mastery status, subset parsing) live in `transform.js`.

## Data Flow

```
RA API (live)
    ↓  ra-api.js (raw wrappers → camelCase)
    ↓  ra-api.js (app composites → sessionStorage cache, CACHE_TTL = 1 min)
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
| `sessionStorage` | 1 min (`CACHE_TTL`) | Profile data, game details, watchlist (`ra_*` keys) |
| `localStorage` | 1 hour | Social data (following/followers, `ra_social_*`) |
| `localStorage` | 1 hour | Completion map for the console coverage strip (`ra_completion_{username}`) |
| `localStorage` | append (1h freshness) | Per-friend activity (`ra_fa_{username}`): served instantly if any cache exists; incremental delta fetched when stale; full refresh only when missing or delta >30d |
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

Six nav slots: Profile, Progress, Activity, Backlog, Social, Menu. The bar is full — a seventh
slot makes the 8px labels unreadable at 360px, so new destinations go in the Menu sheet instead.

The Menu sheet (slide-up, opened from the Menu slot) holds: Stats (`/profile/?tab=stats`),
Consoles, Search, Changelog, Refresh Data, Purge Cache, Debug Mode, Log Out.
