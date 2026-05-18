# Todo

## IndexedDB Migration

Replace the scattered `localStorage` API cache with a single, normalized IndexedDB named **`cheevo_tracker`**. The existing `cheevo_search` IDB is renamed as part of this migration — all code that opens it switches to `cheevo_tracker`. `deleteDatabase('cheevo_search')` is called once on first open of `cheevo_tracker` to clean up the old DB.

---

### Schema — `cheevo_tracker` v1

```
┌─────────────────────────────────────────────────────────────────────┐
│  consoles          keyPath: id                                       │
│  ─────────────                                                       │
│  id          number   PK                                            │
│  name        string                                                  │
│  fetchedAt   number   ms timestamp — replaces meta.consolesFetched  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  games             keyPath: id                                       │
│  ──────                                                              │
│  id              number   PK                                        │
│  title           string                                              │
│  imageIcon       string                                              │
│  numAchievements number                                              │
│  points          number                                              │
│  consoleId       number   FK → consoles.id                          │
│                                                                      │
│  indexes:  consoleId (non-unique)                                   │
│                                                                      │
│  Note: consoleName removed — always join from consoles.name         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  progress          keyPath: [username, gameId]  (compound)          │
│  ────────                                                            │
│  username    string   PK part 1                                     │
│  gameId      number   PK part 2   FK → games.id                    │
│  ts          number   ms timestamp                                   │
│  numAchieved number                                                  │
│  pctWon      number                                                  │
│  hardcoreMode boolean                                                │
│  mostRecentAchievementDate  string | null                           │
│                                                                      │
│  indexes:  username (non-unique) — fetch all games for a user       │
│                                                                      │
│  Replaces: ra_chunk_{username}_{chunkIndex} — no more chunking,     │
│  one row per game. Title/icon always resolved from games store.     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  friend_activity   keyPath: username                                 │
│  ───────────────                                                     │
│  username    string   PK                                            │
│  ts          number   ms timestamp                                   │
│  achievements  array                                                 │
│    └ { achievementId, gameId, date, type, points, badgeName,        │
│        title (achievement name, NOT game title) }                   │
│                                                                      │
│  Note: gameId stored, NOT gameTitle/gameIcon — resolve from games.  │
│  Replaces: ra_fa_{username}                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  backlog           keyPath: username                                 │
│  ───────                                                             │
│  username    string   PK                                            │
│  ts          number   ms timestamp                                   │
│  items       array                                                   │
│    └ { gameId, addedAt }                                            │
│                                                                      │
│  Note: no title/icon stored — resolve from games store on render.   │
│  Replaces: ra_backlog_{username}                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  meta              (inline key-value, no keyPath)                   │
│  ────                                                                │
│  'lastFullFetch'  → number (ms timestamp of last full index run)   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### What this eliminates

| Removed from localStorage | Replaced by |
|---|---|
| `ra_consolegames_{id}` | `games` + `consoles` stores (consoleId index + `fetchedAt`) |
| `ra_chunk_{user}_{n}` | `progress` store (one row per game, compound key) |
| `ra_fa_{user}` | `friend_activity` store |
| `ra_backlog_{user}` | `backlog` store |

`consoleName` is no longer stored redundantly in `games` — every render that needs the name does a `get()` on `consoles` by `consoleId`. The `consolesFetched` meta object is replaced by the `fetchedAt` field directly on each `consoles` row.

---

### Implementation checklist

Priority: backlog and friends list first — users explicitly manage these on RA, so they know when something changed and expect a manual refresh option. Both get a 24 h stale time and an explicit **Refresh** button (same pattern as the search page's "Refresh All"). Everything else follows.

---

#### Phase 0 — Foundation

- [x] Create `openDB()` in `ra-api.js` replacing `openSearchDB()`
  - Opens `cheevo_tracker` v1 with all stores created in `onupgradeneeded`
  - On first open, calls `indexedDB.deleteDatabase('cheevo_search')` to clean up old DB
  - Stores to create: `consoles` (keyPath: `id`), `games` (keyPath: `id`, index: `consoleId`), `progress` (keyPath: `['username','gameId']`, index: `username`), `friend_activity` (keyPath: `username`), `backlog` (keyPath: `username`), `meta` (no keyPath)
- [x] Export a single `db()` helper that returns the open connection (lazy singleton, same pattern as current `_searchDB`)
- [x] Update "Purge Cache" and "Refresh Data" in `mobile-nav.js` and `assets/ui.js` to call `indexedDB.deleteDatabase('cheevo_tracker')` instead of `'cheevo_search'`

---

#### Phase 1 — Backlog ← start here

**Stale time: 24 h. Explicit refresh button in the Backlog tab header.**

Refresh button UX (matches search page style):
- Small `RotateCcw` icon + "Refresh" label, top-right of the Backlog tab header
- Shows "Synced X ago" secondary text next to the button using the `ts` from IDB
- While refreshing: button spins, list stays visible (no blank state)
- After refresh: `ts` updates, list re-renders with fresh data

- [x] Add `getBacklog(username)` to `ra-api.js` — reads `backlog` store; returns `{ ts, items }` or null
- [x] Add `setBacklog(username, items)` to `ra-api.js` — writes `{ username, ts: Date.now(), items }` to `backlog` store
- [x] Add `clearBacklog(username)` to `ra-api.js` — deletes record from `backlog` store
- [x] Update `fetchBacklog` in `ra-api.js` — on cache hit (< 24 h), return IDB data; on miss/stale, fetch from API, write to IDB, return fresh data
- [x] Update `profile/app.js` — on backlog tab mount, load from IDB first (instant render), then check staleness
- [x] Add Refresh button to Backlog tab header in `profile/app.js` — calls `fetchBacklog(force=true)`, shows spinner on button while loading
- [x] Add "Synced X ago" label next to Refresh button, derived from `ts`
- [x] Remove `ra_backlog_*` localStorage reads/writes from `ra-api.js` and `profile/app.js`

---

#### Phase 2 — Friends list ← start here (parallel with Phase 1)

**Stale time: 24 h for the following/follower list. Explicit refresh button in the Social tab header.**

Friends list (`ra_social_*`) is separate from friend activity (`ra_fa_*`). Migrate the list first; activity fetch depends on the list.

Refresh button UX (same as backlog):
- `RotateCcw` + "Refresh" in Social tab header, "Synced X ago" secondary label
- Refreshes both the following list and triggers a re-fetch of all friend activity

- [x] Add `getSocialData(username)` to `ra-api.js` — reads `friend_list` store (or reuse `backlog`-style pattern); returns `{ ts, following, followers }` or null
  - Store name: add `friend_list` store to `cheevo_tracker` schema in Phase 0 (`keyPath: 'username'`, fields: `{ username, ts, following, followers }`)
- [x] Add `setSocialData(username, data)` to `ra-api.js` — writes to `friend_list` store
- [x] Update `fetchSocialData` in `ra-api.js` — 24 h stale time, IDB-backed
- [x] Migrate `ra_fa_*` to `friend_activity` IDB store
  - [x] Update `lcacheGet`/`lcacheSet` calls for `ra_fa_*` to IDB `get`/`put` on `friend_activity`
  - [x] Update `allFriendsCached` — replace `localStorage.getItem(ra_fa_*)` per-user loop with a single IDB `getAll()` → build Set → check every username
  - [x] Update stale-mark loop in `profile/app.js` (currently iterates `localStorage.keys().filter(ra_fa_*)` to set `ts: 0`) — replace with IDB `openCursor` on `friend_activity`, update `ts` field
  - [x] Update force-clear loop in `profile/app.js` (currently removes all `ra_fa_*` keys) — replace with IDB `clear()` on `friend_activity` store
- [x] Add Refresh button to Social tab header in `profile/app.js`
- [x] Add "Synced X ago" label from `friend_list` store `ts`
- [x] Remove `ra_social_*` and `ra_fa_*` localStorage reads/writes

---

#### Phase 3 — Console games + search page polish (eliminates duplication)

No new store needed — redirect reads to the existing `consoles` + `games` stores from Phase 0.

- [x] Update `fetchConsoleGames` in `ra-api.js`
  - Cache hit: check `consoles.get(consoleId).fetchedAt` < 24 h → read `games` store filtered by `consoleId` index → return
  - Cache miss/stale: fetch from API → write to `consoles` (upsert with `fetchedAt: Date.now()`) + `games` (same as current `updateAllGamesForConsole`) → return fresh data
- [x] Drop `consoleName` field from `games` store writes; all callers that need the name do `consoles.get(consoleId).name` — resolved by enriching in `getAllGamesFromDB` join instead
- [x] Update `search/app.js` to resolve console name via `consoles` store when rendering results — done via `getAllGamesFromDB` join
- [x] Remove `ra_consolegames_*` localStorage reads/writes from `ra-api.js`
- [x] Update "Refresh Data" handlers — full DB wipe on Purge Cache already handles this; `forceRefresh=true` path bypasses TTL check
- [x] Add "Synced X ago" label to search page header

---

#### Phase 4 — Progress chunks (largest quota risk)

- [x] Update `fetchUserProgress` (or equivalent chunk loader) in `ra-api.js` — replaced by `fetchAllAchievements`; groups achievements by `[username, gameId]` rows in `progress` store; TTL in `meta` as `progress_ts_{username}`
- [x] Remove chunk-index loop — no more `ra_chunk_{username}_{n}` sessionStorage keys
- [x] Update all callers that currently reassemble chunks into a flat array — `allLoadedAchievements = achievements || []` (no merge step)
- [x] Add delete-by-username helper: `clearProgress(username)` using `username` index + `openKeyCursor` delete loop
- [x] Update force-refresh path — `fetchAllAchievements(..., forceRefresh=true)` calls `clearProgress` internally; Purge Cache wipes IDB entirely
- [x] Remove `ra_chunk_*` sessionStorage reads/writes from `ra-api.js`

---

#### Phase 5 — Cleanup

- [x] Remove `updateAllGamesForConsole` export (now internal, only called by `fetchConsoleGames`) and delete unused `clearAllGamesStore` — `openSearchDB` was already gone from Phase 0; `getAllGamesFromDB` and `markAllGamesFullFetch` kept as exports (still used by `search/app.js` under the same names)
- [x] Verified: no `ra_fa_`, `ra_chunk_`, `ra_consolegames_`, `ra_backlog_`, `ra_social_` keys remain in any read/write path; only `ra_consoles` (console list, 24h localStorage TTL) is still active — out of scope for this migration
- [x] `search/app.js` imports unchanged — export names were preserved during migration
- [x] Purge Cache (`assets/ui.js` + `assets/mobile-nav.js`) already calls `indexedDB.deleteDatabase('cheevo_tracker')` + `sessionStorage.clear()` + clears all `ra_*` localStorage keys
- [x] Changelog updated

---

## Console Completion %

Show library completion stats per console on the console page — what % of that console's total game count the user has played at least one achievement in, and what % they've mastered.

### Data sources

- **Console game list:** `fetchConsoleGames(consoleId)` — already cached 24h in `ra_consolegames_*`; gives total game count and per-game data
- **User's played games:** available from the profile's `allAchievements` / progress data — games with `numAchieved > 0` are "played", games with `pctWon >= 1.0` (or `hardcoreMode` completion) are "mastered"
- Cross-reference the two lists by `gameId` to compute played and mastered counts

### Display

On the console list page (`console/app.js`), add a compact stat strip under each console name:
- `X / Y played` (how many games touched out of total)
- `Z mastered` (how many at 100%)
- A thin progress bar showing played % (filled) with mastered % overlay (brighter fill)
- Only shown when user credentials exist and data is loaded; skeleton shimmer while loading

Data is fetched per-console lazily as the user scrolls (IntersectionObserver), so the page doesn't hammer the API on load.

---

## "Playing Now" Detection

Surface a subtle live indicator in the friends feed when a friend earned achievements within the last 30 minutes — making the feed feel closer to real-time.

### Detection logic

In `fetchFriendsActivity`, the most recent achievement timestamp per user is already available in the cached data. After loading (status `done`), compute:

```js
const PLAYING_NOW_MS = 30 * 60 * 1000;
const isPlayingNow = (achievements) =>
  achievements.length > 0 &&
  Date.now() - new Date(achievements[0].date).getTime() < PLAYING_NOW_MS;
```

### Display

- In the friends feed day groups, sessions where the user is "playing now" get a small green pulsing dot next to their avatar
- The dot uses a CSS `ping` animation (Tailwind `animate-ping`) with a solid inner dot
- Colour: `#57de8f` (green, distinct from the existing blue/gold palette)
- No separate "online" section — just the dot on existing sessions; keeps it subtle

### Caveats

- Timestamps come from the RA API and reflect when the achievement was earned server-side; clock skew under a minute is expected
- The 30-minute window matches a typical gaming session gap — short enough to feel live, long enough to survive brief pauses

---

## Game Page — Desktop Single-Page Layout

On desktop (`md:` and above), hide the tab bar and display all sections simultaneously in a structured layout. Mobile keeps the existing tab behaviour unchanged.

### Layout structure

```
┌─────────────────────────────────────────────────────┐
│                  Hero + Stats strip                  │  full width (existing)
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│   Achievements               │   Info               │
│   (filter/sort + list)       │   Time to Beat       │
│                              │   Links              │
│   flex-1, min-w-0            │   ──────────────     │
│                              │   Hashes             │
│                              │   w-[320px] shrink-0 │
│                              │                      │
├──────────────────────────────┴──────────────────────┤
│   Leaderboards                                       │
│   ┌─────────────────┬──────────────────────────┐    │
│   │  Top Scorers    │  Board list (accordion)  │    │
│   │  1fr            │  2fr                     │    │
│   └─────────────────┴──────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│   Community                                          │
│   ┌─────────────────┬──────────────────────────┐    │
│   │  Recent Masters │  Comments + load more    │    │
│   │  1fr            │  2fr                     │    │
│   └─────────────────┴──────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Rationale:**
- Achievements is the primary content → full height left column, no vertical cap
- Info + Hashes are compact metadata → right sidebar, stacked; Hashes fits here as utility content (ROM lookup)
- Leaderboards and Community each benefit from full width but have a natural internal 2-col split (summary left, detail right)
- This mirrors how gaming sites like RA itself or HowLongToBeat lay out game pages

### Implementation

**Tab bar:** `md:hidden` — hidden on desktop, visible on mobile as before

**Section visibility logic** — each section div uses:
```jsx
className={`${tab === 'sectionId' ? 'block' : 'hidden'} md:block`}
```
Mobile: only active tab section visible. Desktop: all sections always visible.

**Top area wrapper** (inside `max-w-4xl mx-auto px-4 md:px-8`):
```jsx
<div className="md:flex md:items-start md:gap-6 py-4">
  {/* Achievements — left column */}
  <div className="md:flex-1 md:min-w-0 ...">...</div>

  {/* Right sidebar */}
  <div className="md:w-[320px] md:shrink-0 md:flex md:flex-col md:gap-5">
    {/* Info section */}
    {/* Hashes section */}
  </div>
</div>
```

**Leaderboards section** (full width, `max-w-4xl mx-auto px-4 md:px-8 py-4`):
```jsx
<div className="md:grid md:grid-cols-[1fr_2fr] md:gap-6">
  {/* Top Scorers */}
  {/* Board list */}
</div>
```

**Community section** (full width, same wrapper):
```jsx
<div className="md:grid md:grid-cols-[1fr_2fr] md:gap-6">
  {/* Recent Masters */}
  {/* Comments */}
</div>
```

A `border-t border-[#2a475e]` divider separates the top two-column area from Leaderboards, and Leaderboards from Community.

### Data fetching on desktop

On mobile, each section lazy-loads when its tab is first opened. On desktop, all sections are visible on page load so lazy-loading by tab is useless.

**Strategy:** at mount, detect viewport with `window.matchMedia('(min-width: 768px)').matches`. If desktop, fire all section fetches eagerly in parallel alongside the main fetch:
- `getGameProgression` + `getGameExtended` (Info/Achievements enrichment)
- `getGameLeaderboards` + `getUserGameLeaderboards` + `getGameRankAndScore(t=0)` (Leaderboards)
- `getGameRankAndScore(t=1)` + `getComments` (Community)
- `getGameHashes` (Hashes)

On mobile, keep existing lazy-load per tab as-is. The state variables and fetch functions are the same — only the trigger changes.

### Section headers on desktop sidebar

In the right sidebar on desktop, Info and Hashes need their own section headers (they have them in tab view already — just ensure they're visible in sidebar context too). No change needed — headers are always rendered inside each section.

### Scroll behaviour

No scroll containers within sections — everything flows naturally in the page scroll. The sticky tab bar on mobile remains sticky; on desktop it is hidden so no sticky element is needed below the hero.
