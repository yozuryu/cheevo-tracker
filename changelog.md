# Changelog

## v26.04.18 — Console Browser, Backlog Polish, Achievement Comments, Nav Reorganisation

### RetroAchievements

- New **/console/** page — browse all game systems, select a console to see its full game list
- Console list: grid of active game systems with icons, fetched from `API_GetConsoleIDs`, filtered to `isGameSystem && active`, sorted alphabetically; grouping toggle — **Default** (flat), **Publisher** (Nintendo / Sony / Sega / Atari / SNK / NEC / etc., ID-based map), **Era** (Pre-8-Bit through 8th Gen+, ID-based map); unknown IDs fall back to "Other" in both modes
- Game list: searchable, sorted alphabetically; each row shows icon, title, tag badge (Hack/Homebrew/etc.), achievement count and points; links to internal `/game/` page
- Console → game list navigation via `history.pushState` — browser back button returns to console list without reload
- Topbar menu: added **Consoles** entry (Gamepad2 icon) above Changelog
- Profile: renamed **Watchlist** tab to **Backlog** across tab bar, mobile nav, stats line, and all internal identifiers
- Profile: Backlog filter bar restructured for mobile — search takes full width, Status and Group filters each on their own horizontally-scrollable labeled row; desktop layout unchanged
- Achievement page: replaced two-column layout with a **Recent Unlocks / Comments** tab bar below Your Status
- Achievement page: Comments tab lazy-loads on first open — fetches `getComments` with `t=2` (achievement type), 25 at a time; shimmer skeleton while loading; "Load more" button shows remaining count
- Achievement page: Comments tab filters out `Server`-authored entries — only real user comments shown; new **Changelog** tab displays those system entries (upload/update history) as a timeline list
- Achievement page: loading skeleton updated to include the tab bar shimmer
- Mobile nav: replaced **Backlog** tab with **Consoles** tab (Gamepad2-style icon, links to `/console/`); Backlog moved to Settings page as a row under General

---

## v26.04.17 — Social Tab Polish, Reliability Fixes

### RetroAchievements

- Social tab: "Mutual" badge replaced with an `ArrowLeftRight` icon inline next to the username
- Social tab: points displayed in gold (`#e5b143`) instead of muted gray
- Social tab: Following and Followers fetched sequentially (500ms gap) instead of in parallel — reduces request bursts and 429 rate-limit errors
- Social tab: on fetch error, `socialData` stays `null` so switching away and back retries; shows error message with "Try again" button instead of silently showing empty lists
- `ra-api.js`: added `withRetry` helper — 1 initial attempt + 2 retries, 1s between attempts, 3s on HTTP 429; applied to `API_GetAchievementsEarnedBetween` (both on mount and lazy chunk loads), `getUsersIFollow`, and `getUsersFollowingMe`
- Profile page: removed Log Out button from topbar — already in the hamburger menu
- Settings page + topbar menu: added **Purge Cache** — clears all PWA asset caches via Cache API and reloads

---

## v26.04.16 — Achievement Page, Leaderboards Tab, Social Tab

### RetroAchievements

- Profile page: new **Social tab** — shows Following and Followers lists, lazy-loaded on first open; each row shows avatar, username (RA link), points, and a "Mutual" badge when the follow is reciprocal
- Profile page: removed redundant Log Out button from topbar — already accessible via the menu
- Topbar menu + Settings page: added **Purge Cache** — deletes all PWA asset caches (`caches.keys()` + `caches.delete`) and reloads, forcing a full re-fetch of static assets
- Mobile nav: added **Social** tab button (`/profile/?tab=social`) — shows Following and Followers lists, lazy-loaded on first open; each row shows avatar, username (RA link), points, and a "Mutual" badge when the follow is reciprocal
- Breadcrumbs: three distinct styles — root ("Cheevo Tracker") is muted bold uppercase, intermediate crumbs with links are blue (`#66c0f4`), active/current page is light (`#c6d4df`); all intermediate crumbs now carry hrefs for back navigation
- Breadcrumbs: dynamic crumbs (game title, achievement title) render as shimmer blocks while data is loading instead of placeholder text
- Game page: removed orphan "Game" category label from breadcrumb — now `Cheevo Tracker › [Game Title]`
- Achievement page: removed orphan "Game" category label — now `Cheevo Tracker › [Game Name] › [Achievement Title]`
- Achievement page: hero redesigned to match game page — full-bleed `bg-[#1b2838]` section with optional game background art at `opacity-20`, stats strip as a dark bar below the hero, `max-w-4xl` throughout
- Achievement page: metadata row now has icons (Star for pts, TrendingUp for ratio, User for author, Calendar for date added, ExternalLink for RA) with `|` separators between each item
- Achievement page: game info row above the hero uses the same layout as the game page's metadata row — game icon + cyan link + Gamepad2 console chip
- Game page: hero background art opacity reduced from 25% to 20% to match achievement page
- Achievement page: desktop layout uses two-column grid (stats + your status left, recent unlocks right) with hero wrapped in a card; max-width widened to `max-w-3xl`
- Achievement page: hero shows game info row (icon + name link + console) above the badge; badge larger on desktop (`md:w-28 md:h-28`)
- Achievement page: added link to RetroAchievements achievement page in the metadata row
- Achievement page: recent unlock rows now have left border stripes — gold (`#e5b143`) for hardcore, gray (`#8f98a0`) for softcore
- Achievement page: "HC" label renamed to "Hardcore" with red color (`#ff6b6b`) everywhere it appears
- Achievement page: Your Status card simplified — removed redundant "Unlocked — Hardcore/Softcore" label; shows unlock date prominently with a mode label below
- New **Achievement page** (`/achievement/?id=`) — dedicated page per achievement showing badge, title, description, type badge, points/trueRatio, author, global unlock stats (HC / Softcore / Total Players), your personal unlock status (HC or SC with date), and a paginated recent-unlocks list
- Achievement page: breadcrumb follows `Cheevo Tracker › Game › [Game Name] › [Achievement]` pattern; game name links back to the game page
- Achievement page: badge image sourced from `getGameInfoAndUserProgress` data (same source as game page) with fallback to `getAchievementUnlocks` achievement object; fixes broken image when `BadgeName` is absent from the achievement sub-object
- Achievement page: game link uses top-level `game.id` from the API response instead of `achievement.gameId` (sub-object field not always populated); fixes game name not appearing in breadcrumb
- Achievement page: recent unlocks show relative timestamps (e.g. "2 hrs ago") instead of raw dates
- Game page: achievement badge and title links now navigate to the internal `/achievement/` page in the same tab instead of opening RA site in a new tab
- Profile page: all achievement links (game modal, activity feed, recent achievement card) updated to internal `/achievement/` page; removed `target="_blank"`
- `ra-api.js`: `getAchievementUnlocks` now properly maps the `achievement` object to camelCase (was passed as raw PascalCase); `console` and `game` objects also mapped
- Game page: "Subset of" breadcrumb now has a `bg-black/40 backdrop-blur-sm` pill background and brighter text (`#8f98a0` / `#c6d4df`) so it stays legible on dark hero images
- Game page: new **Leaderboards** tab (between Info and Community) — final tab order: Achievements · Info · Leaderboards · Community · Hashes
- Game page: Leaderboards tab lazy-loads on first open — fetches `getGameLeaderboards` + `getUserGameLeaderboards` + `getGameRankAndScore(t=0)` in parallel
- Game page: **Top Scorers** card at top with rank, avatar, username, and score; top 3 ranks gold/silver/bronze coloured
- Game page: board list with accordion expand — clicking a board lazy-loads top 25 entries (cached per board ID)
- Game page: collapsed board shows format badge (TIME/SCORE/VALUE), description, top entry preview, and "Your Entry" pill if the user has a score
- Game page: expanded board highlights the logged-in user's row with cyan left border and username

---

## v26.04.14 — Game Page: Community Tab, Info Tab Enhancements

### RetroAchievements

- Game page: new **Community** tab (between Info and Hashes) with Recent Masters and Comments sections
- Game page: Community tab lazy-loads on first open — fetches `getGameRankAndScore(t=1)` + first 25 comments in parallel
- Game page: Comments support "Load more" (25 at a time) showing remaining count
- Game page: Recent Masters and Comments displayed side by side on desktop, stacked on mobile; Recent Masters scrollable at fixed height (~5 rows) on all screen sizes
- Game page: Info tab now lazy-loads `getGameProgression` on first open; `getGameExtended` fetched eagerly on mount alongside main data
- Game page: new **Time to Beat** section showing median Beat (Casual) / Beat (HC) / Complete / Master times; hidden if all values are null; shimmer skeleton while loading
- Game page: Info table gains **Last Updated** row (from `getGameExtended`) and **Parent Game** link for subset games
- Game page: active dev claim banner now sourced from `API_GetActiveClaims` (filtered to current game) — reliably shows only truly active claims, not stale historical ones from `getGameExtended`
- Game page: active claim banner moved above the tab bar so it's visible on all tabs, not buried in Info
- Game page: **In Dev** badge in hero title row tied to same active claims check as the banner
- Game page: achievement rows now show author and creation date (`by {author} · added {date}`) once `getGameExtended` data loads
- Game page: empty achievement list shows "This game has no achievements yet." instead of the filter-mismatch message
- Game page: tab state persists in URL (`?tab=`) via `history.replaceState`; restored on reload
- `ra-api.js`: `getGameExtended` now maps `claims` through `mapClaim` for consistent camelCase fields

---

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

- Stats strip moved inside the hero section — hero background now extends to cover both the game info and the stats row, giving a taller unified header; stats strip uses semi-transparent `bg-[#131a22]/50` so the blurred game screenshot bleeds through
- Tab bar redesigned as compact pill buttons (matching existing filter controls on the same page) instead of profile's underline style — three compact tabs fit better than five wide ones
- Tab bar sticky fixed: root div changed from `overflow-x: hidden` to `overflow-x: clip` — `hidden` was creating a scroll container that broke `position: sticky`; `clip` cuts off overflow visually without becoming a scroll container
- "Details" tab renamed to "Info"
- Genre and released date removed from hero info row — both fields already appear in the Info tab metadata table
- Console icon changed from Monitor to Gamepad2 (controller)
- Separator lines added under each section title in Info and Hashes tabs (`border-b border-[#2a475e]`)
- Info tab metadata table: `divide-y divide-[#2a475e]` for visible row dividers (was using card background color, making dividers invisible)
- Info tab values use `break-words min-w-0`; Hashes MD5 uses `break-all` — fixes horizontal scroll on mobile
- Locked achievement rows changed from `bg-[#171a21]` (same as page background, invisible) to `bg-[#1b2838] opacity-60` — locked rows now visually distinct but clearly dimmer than unlocked ones
- Achievement list filter/sort controls redesigned to match profile modal and Watchlist tab: two labeled rows of pill buttons (Status: All / Unlocked / Locked in blue; Sort: Default / Points / Unlocked in neutral), with a count readout (`n / total`) on the right
- Hero info row: icons added for each metadata field (Gamepad2 → console, Code → developer), each item wraps as a self-contained unit
- Stats strip: uses `grid-flow-col auto-cols-fr` so all stat cells share equal width without horizontal scroll
- Achievement list breadcrumb updated: `Cheevo Tracker › Game › [Game Name]`
- Achievement rows redesigned to match profile Activity and gaming-hub gamecard modal: card-style rows with colored left-border accent (gold HC, gray SC, dark locked), linked badge with lock overlay, linked gold title, `pts` pill badge, trueRatio multiplier, type icons with hover tooltips (`.pop-wrap`), dual HC/casual global unlock % bars with Flame/Feather icons, unlock date in blue
- Type icon colors aligned with profile: Progression → Trophy gold, Win Condition → Crown red, Missable → AlertTriangle orange
- New `/game/?id=` page replaces RA site links for all game references across the app
- Shows game hero (background, icon, title, console, developer, award badge), completion bar, and stats strip (achievements, points, hardcore count, playtime, player count)
- Full achievement list with badge images, descriptions, type badges (Progression / Win Condition / Missable), per-achievement global unlock % bar, and per-user unlock date + hardcore indicator
- Filter by All / Unlocked / Locked; sort by Display Order / Points / Unlock Date
- Dimmed + grayscale treatment for locked achievements; HC/SC unlock badge on earned achievements

### Profile

- Recently Played section header hidden on desktop (`md:hidden`), shown on mobile only with a separator line below — desktop layout makes the header redundant since the tab context is visible

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
