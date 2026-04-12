# Changelog

## v26.04.12 — Watchlist, Mobile Polish, Settings & Game Details

### RetroAchievements

- Watchlist: removed obsolete "Series" grouping option (no `series.json`, always produced empty results)
- Watchlist: console column now visible on mobile in "None" grouping; "Status" grouping shows console as subtitle under the title instead
- Watchlist: mastered progress cell now shows `X/Y` achievement count instead of a "Mastered" badge — status label below the title already conveys mastery
- Watchlist: skeleton persists until `BACKLOG.games` is populated, preventing empty-table flash when `watchlistData` arrives but `transformData` hasn't re-run yet

### Mobile Nav

- Replaced "Log" nav tab with "Settings" — navigates to a dedicated `/settings/` page with: Changelog link, Refresh Data (clears sessionStorage + reloads), and Log Out; signed-in username shown in Account section
- Profile breadcrumb simplified to `Cheevo Tracker › Profile`; page title updated to match
- Changelog: version label moved to its own line below the version number, fixing overflow on mobile

### Structure

- Added `/settings/` page with General (Changelog, Refresh Data) and Account (username display, Log Out) sections
- Extracted shared `Topbar` and `Footer` into `assets/ui.js` — all pages now use the same components; `ui.js` uses `React.createElement` to stay compatible with the native ES module loader (not transpiled by Babel standalone)
- Unified topbar breadcrumb pattern across all pages: `Cheevo Tracker › [Page]`; "Cheevo Tracker" is a link on non-profile pages

### Game Details Page

- Achievement list filter/sort controls redesigned to match profile modal and Watchlist tab: two labeled rows of pill buttons (Status: All / Unlocked / Locked in blue; Sort: Default / Points / Unlocked in neutral), with a count readout (`n / total`) on the right
- Hero info row: icons added for each metadata field (Monitor → console, Tag → genre, Code → developer, Calendar → year), each item wraps as a self-contained unit instead of `·`-separated text
- Stats strip: uses `grid-flow-col auto-cols-fr` on mobile so all stat cells share equal width without horizontal scroll; smaller text on mobile (`text-[11px]` values, `text-[8px]` labels)
- Game page now has three tabs — Achievements (existing list), Details (media gallery + metadata + links), Hashes (supported ROMs via `API_GetGameHashes`); hashes lazy-load on first tab open
- Achievement list breadcrumb updated: `Cheevo Tracker › Game › [Game Name]`
- Achievement rows redesigned to match profile Activity and gaming-hub gamecard modal: card-style rows with colored left-border accent (gold HC, gray SC, dark locked), linked badge with lock overlay, linked gold title, `pts` pill badge, trueRatio multiplier, type icons with hover tooltips (`.pop-wrap`), dual HC/casual global unlock % bars with Flame/Feather icons, unlock date in blue
- Type icon colors aligned with profile: Progression → Trophy gold, Win Condition → Crown red, Missable → AlertTriangle orange
- New `/game/?id=` page replaces RA site links for all game references across the app
- Shows game hero (background, icon, title, console, genre, developer, year, award badge), completion bar, and stats strip (achievements, points, hardcore count, playtime, player count)
- Full achievement list with badge images, descriptions, type badges (Progression / Win Condition / Missable), per-achievement global unlock % bar, and per-user unlock date + hardcore indicator
- Filter by All / Unlocked / Locked; sort by Display Order / Points / Unlock Date
- Dimmed + grayscale treatment for locked achievements; HC/SC unlock badge on earned achievements

## v26.04.11 — Initial Release

Initial release — forked from gaming-hub and rebuilt as a standalone RA-only personal profile tracker with browser-side auth and live RetroAchievements API fetching.

### Auth

- New login screen (`/index.html` + `/login.js`): username + API key form with show/hide toggle; validates credentials against the RA API before storing
- Credentials stored in `localStorage` as `raCredentials = { username, apiKey }` — sent directly to RetroAchievements, never to any intermediary
- Profile page guards on mount: missing or invalid credentials redirect immediately to the login screen
- Auth errors (RA API 401 / `AUTH_ERROR`) call `clearCredentials()` and redirect to `/` from anywhere in the app
- Logout button in the topbar calls `clearCredentials()` and redirects to `/`
- How-to instructions for obtaining an API key shown inline on the login form (Settings → Keys → Web API Key)

### RetroAchievements

- All profile data fetched live from `https://retroachievements.org/API/` — no static JSON pipeline required
- Initial page load fires 5 parallel requests: `GetUserProfile`, `GetUserSummary`, `GetUserCompletionProgress` (paginated), `GetUserAwards`, and first `GetAchievementsEarnedBetween` chunk
- Achievement history fetches 2 chunks of 6 months eagerly on Activity tab open; heatmap updates as each chunk arrives
- Watchlist skeleton now persists until `transformData` has populated `BACKLOG.games`, preventing an empty-table flash between data arrival and render
- Heatmap computed client-side from loaded chunks via `useMemo` — no pre-built file needed
- Watchlist lazy-loads when the Watchlist tab is first opened
- Per-game achievement details (`GetGameInfoAndUserProgress`) fetched on first modal open, cached in `detailedGameProgress`; modal opens immediately with shimmer skeleton and updates live when data arrives
- `points7Days` and `points30Days` pre-computed from chunk 0 on initial load so stats show correct values immediately

### Structure

- Removed Steam profile, Activity, Completions, Hub landing, and Admin pages — RA profile is now the entire app
- RA profile moved from `/profile/ra/` to `/profile/`; root `/` serves the login page
- `profile/utils/ra-api.js` added as the RA API client: PascalCase → camelCase mapping so `transform.js` is preserved unchanged
- Mobile nav simplified to 2 tabs: Profile (`/profile/`) and Log (`/changelog/`)
- Service worker updated: cache name `cheevo-tracker-v1`, cross-origin RA API requests pass through without caching
- `manifest.json` updated: name "Cheevo Tracker", scope `"./"`
- `package.json` stripped to single `"start": "npx serve ."` script with no dependencies
