# Search Page

**File:** `search/app.js` (~440 LOC)  
**URL:** `/search/`  
**Auth required:** Yes

Cross-console game search. Unlike every other page, search runs **entirely against the local
IndexedDB catalog** — it makes no RA API call to answer a query. The catalog has to be built
first, which is the page's other job.

## Data Fetched on Mount

- `getAllGamesFromDB()` — the whole cached catalog: `{ games, consolesFetched, lastFullFetch }`.
  No network. If the store is empty the page shows a build prompt instead of a search box.

## Building the Catalog

`startFetch(forceRefresh)` walks every active console and caches its full game list:

1. `fetchConsoles()` → active game systems
2. For each console, `fetchConsoleGames(consoleId, forceRefresh)`, **1 s apart** to stay within
   RA's rate limit. Progress streams to the UI as `{ done, total, current }`.
3. `markAllGamesFullFetch()` stamps `lastFullFetch` in the IDB `meta` store
4. Re-reads the store and focuses the search input

`cancelRef` is checked each iteration so the walk can be aborted mid-run. `AUTH_ERROR` routes to
`handleAuthError()`; any other failure sets `fetchStatus = 'error'` and leaves existing data
intact. A partial catalog is still searchable — the page works off whatever consoles are cached.

## State

| State | Type | Purpose |
|---|---|---|
| `store` | `{ games, consolesFetched, lastFullFetch } \| null` | The IDB catalog; `null` when empty |
| `query` | `string` | Title substring, case-insensitive. Empty query returns no results (not everything) |
| `achFilter` | `'all' \| 'with' \| 'without'` | Filter by `numAchievements` |
| `consoleFilter` | `Set<number>` | Console IDs; **empty means all**, not none |
| `fetchStatus` | `'idle' \| 'fetching' \| 'error'` | Catalog build lifecycle |
| `progress` | `{ done, total, current } \| null` | Per-console build progress |
| `page` | `number` | 1-based; resets to 1 whenever query or a filter changes |
| `cancelRef` | `useRef(boolean)` | Aborts the console walk between iterations |

## Filtering

All filtering is a single `useMemo` over `store.games` — substring match, then achievement
filter, then console filter, then slice to `PAGE_SIZE = 50`. There is no index or fuzzy match;
a plain `includes()` over a few tens of thousands of rows is fast enough.

The console dropdown filters its own list (`consoleSearch`) and closes on outside `mousedown`
via a listener bound while the panel is open.

## Links Out

Each result links to `../game/?id=<gameId>`. Titles render through `parseTitle` so `~Tag~`
prefixes become `TILDE_TAG_COLORS` chips and `[Subset - Name]` suffixes are split out.

## Mobile

Reached from the mobile menu sheet (`assets/mobile-nav.js`) rather than a bottom-nav slot.
Standard `Topbar` / `Footer`, both hidden under 768px by the shared mobile-nav CSS.
