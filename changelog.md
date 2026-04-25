# Changelog

## v26.04.25 — Compare Progress

### Social

- Added **Compare** button to every user row in the Following and Followers lists
- Clicking Compare opens a modal that fetches the other user's full completion progress and finds games both users have played
- Modal shows a summary (shared game count, ahead / tied / behind) and a sortable game list with side-by-side progress bars and M/B award badges for each player
- Sort options: **Diff** (biggest gap first, default), **Mine**, **Theirs**, **A–Z**
- Progress bars color-code to gold when a game is mastered, blue for you, cyan for the other user
- Following and Followers lists cached for 1 hour in localStorage

### Game Page

- Renamed Time to Beat labels: **Beat (Casual)** → **Beat**, **Beat (HC)** → **Beat (Hardcore)**
- Each tier now has its own color: Beat = blue, Beat (Hardcore) = gold, Complete = blue, Master = gold

### Console Page

- Moved Bandai, Coleco, Mattel, and SNK consoles into the **Other** group when browsing by publisher

---

## v26.04.22 — Achievement Type Filter

### Game Page

- Added **Type** filter row to the Achievements tab — filter by All / Progression / Win Condition / Missable; button highlights in the type's accent color when active

---

## v26.04.19 — User Page Unified with Profile, Debug Mode

### Profile

- Removed "Last active" line from profile header — redundant with the Most Recently Played card already shown on the page

### Settings

- New **Developer** section with a **Debug Mode** toggle (default off); persisted in `localStorage.raDebugMode`

### Structure

- When debug mode is on, all `raFetch` calls append an entry to `window.__raDebugLog` with endpoint, sanitised params (API key redacted), HTTP status, response payload, timing (ms), and timestamp
- A **bug icon button** appears in every page's topbar when debug mode is enabled; clicking it opens a panel listing all API calls made on the current page; each row is expandable to show request params and full JSON response; supports Refresh and Clear actions

### User Page

- **User page unified with profile page** — `/user/?u=username` now redirects to `/profile/?u=username`; the profile page renders in visitor mode when `?u=` is set
- Fixed mobile visitor mode: horizontal scroll, stretched bottom nav, and bottom nav not sticking — caused by overflow escaping the page container; fixed with `overflow-x: clip` on the root div (clips without creating a scroll container, so sticky and fixed positioning remain unaffected)
- Visitor mode: Activity, Backlog, and Social tabs hidden; only Recent Games, Completion Progress, and Series Progress (if applicable) are shown
- Visitor mode: tab bar is always visible on mobile (no `hidden md:block`) so all tabs are reachable without scrolling; floating pill logic skipped
- Visitor mode: breadcrumb shows `Cheevo Tracker › <username>` with link back to own profile
- `fetchProfile` in `ra-api.js` now accepts optional `targetUser` parameter — passes `u: targetUser` to all 5 parallel API calls; cache key scoped to target user
- All `../user/?u=` links in `profile/app.js`, `achievement/app.js`, and `game/app.js` updated to `../profile/?u=`
- `user/app.js` retired; `user/index.html` converted to a lightweight JS redirect

### Structure

- User avatars now use the API-provided `UserPic` path instead of constructing from the current username — fixes broken images for users who changed their RA username; applied to all rendering sites (social tab, achievement unlocks/comments, game leaderboard entries/top scorers/recent masters/comments)
- `ra-api.js`: added `userPic` field to `getAchievementUnlocks` unlocks, `getComments` results, `getLeaderboardEntries` results, and `getGameRankAndScore` results mappers

---

## v26.04.18 — Console Browser, User Pages, Achievement Comments, Nav Reorganisation

### Console Page

- New **/console/** page — browse all game systems, select a console to see its full game list
- Console list: grid of active game systems (`isGameSystem && active`), fetched from `API_GetConsoleIDs`; grouping defaults to **Publisher** (ID-based map: Nintendo / Sony / Sega / Atari / SNK / NEC / etc.); **Gen** grouping (Pre-8-Bit through 8th Gen+, ID-based map); unknown IDs fall back to "Other"; grouping persists in URL param (`?group=`)
- Console list: counts coloured blue; group header text lightened to `#c6d4df`; cached for **24 hours** in `localStorage`
- Game list: shows all games (`f=0`), paginated in 500-game pages; obsolete sets (`~z~`) filtered out; normal games sorted before tilde-tagged games, both alphabetically
- Game list: achievement filter (All / With / Without, default With) persisted in URL param (`?ach=`)
- Game list: tilde tags and Subset badge styled consistently with profile and game pages; achievement count (blue) and points (gold) coloured per design system
- Game list: cached for **24 hours** in `localStorage`; breadcrumb simplified to `Cheevo Tracker › <Console Name>`; console name derived from cached list (removed `name` URL param)
- Console → game list navigation via `history.pushState`; page scrolls to top on all transitions

### Profile

- Renamed **Watchlist** tab to **Backlog** across tab bar, mobile nav, stats line, and all internal identifiers (`backlogData`, `fetchBacklog`, cache key `ra_backlog_`)
- Backlog filter bar restructured for mobile — search takes full width, Status and Group filters each on their own horizontally-scrollable labeled row; desktop layout unchanged
- Social tab: "Mutual" indicator changed from inline icon to a small badge label below the username

### Achievement Page

- Replaced two-column layout with a **Recent Unlocks / Comments / Changelog** tab bar below Your Status; tab persists in URL param (`?tab=`)
- Comments tab lazy-loads on first open — fetches `getComments` with `t=2`, 25 at a time; filters out `Server`-authored entries
- Changelog tab shows `Server` system entries as a timeline — gold username, blue date, connecting vertical line with hollow circle markers
- Game info row: game title blue (`#66c0f4`) hover gray, console name gray (`#8f98a0`) hover gray; console is a clickable link to `/console/` game list
- Breadcrumb includes console name crumb linking to the console game list
- Loading skeleton updated to include the tab bar shimmer

### Game Page

- Tilde tags (Hack/Homebrew/Demo/Prototype) now rendered in hero title row using `TILDE_TAG_COLORS`
- Breadcrumb includes console name crumb linking to the console game list

### Navigation

- Mobile nav: replaced **Backlog** tab with **Consoles** tab (links to `/console/`); Backlog link moved to Settings page under General
- Topbar menu: added **Consoles** entry (Gamepad2 icon) above Changelog
- Refresh Data and Purge Cache both clear `localStorage` console/game caches (`ra_consoles`, `ra_consolegames_*`) in addition to `sessionStorage` and PWA asset caches

### User Page

- New **/user/?u=** page — view any RA user's profile: avatar, username, points (HC/true), global rank, mastery count, beaten count, member since, motto, rich presence
- Recently Played section: last 10 games with icon, title, console, achievement progress bar (gold at 100%), and relative time
- Recent Achievements section: last unlocked achievements with badge, title, game name, HC badge, and relative time; left border stripe (gold HC / gray SC)
- All username links across the app now navigate to this internal user page instead of opening RA site: social tab, achievement unlocks/comments, game leaderboard entries/top scorers/recent masters/comments, active claim banners

### Polish

- All `hover:underline` link styles replaced with color-shift hover transitions throughout profile, game, achievement, and login pages

---

## v26.04.17 — Social Tab Polish, Reliability Fixes

### Profile

- Social tab: "Mutual" badge replaced with an `ArrowLeftRight` icon inline next to the username
- Social tab: points displayed in gold (`#e5b143`) instead of muted gray
- Social tab: Following and Followers fetched sequentially (500ms gap) instead of in parallel — reduces request bursts and 429 rate-limit errors
- Social tab: on fetch error, `socialData` stays `null` so switching away and back retries; shows error message with "Try again" button instead of silently showing empty lists
- Removed Log Out button from topbar — already in the hamburger menu

### Navigation

- Settings page + topbar menu: added **Purge Cache** — clears all PWA asset caches via Cache API and reloads

### Structure

- `ra-api.js`: added `withRetry` helper — 1 initial attempt + 2 retries, 1s between attempts, 3s on HTTP 429; applied to `API_GetAchievementsEarnedBetween` (both on mount and lazy chunk loads), `getUsersIFollow`, and `getUsersFollowingMe`

---

## v26.04.16 — Achievement Page, Leaderboards Tab, Social Tab

### Profile

- New **Social tab** — shows Following and Followers lists, lazy-loaded on first open; each row shows avatar, username (RA link), points, and a "Mutual" badge when the follow is reciprocal
- Mobile nav: added **Social** tab button (`/profile/?tab=social`)

### Achievement Page

- Hero redesigned to match game page — full-bleed `bg-[#1b2838]` section with optional game background art at `opacity-20`, stats strip as a dark bar below the hero, `max-w-4xl` throughout
- Metadata row now has icons (Star for pts, TrendingUp for ratio, User for author, Calendar for date added, ExternalLink for RA) with `|` separators between each item
- Game info row above the hero uses the same layout as the game page's metadata row — game icon + cyan link + Gamepad2 console chip
- Desktop layout uses two-column grid (stats + your status left, recent unlocks right) with hero wrapped in a card; max-width widened to `max-w-3xl`
- Hero shows game info row (icon + name link + console) above the badge; badge larger on desktop (`md:w-28 md:h-28`)
- Added link to RetroAchievements achievement page in the metadata row
- Recent unlock rows now have left border stripes — gold (`#e5b143`) for hardcore, gray (`#8f98a0`) for softcore
- "HC" label renamed to "Hardcore" with red color (`#ff6b6b`) everywhere it appears
- Your Status card simplified — removed redundant "Unlocked — Hardcore/Softcore" label; shows unlock date prominently with a mode label below
- Recent unlocks show relative timestamps (e.g. "2 hrs ago") instead of raw dates
- Badge image sourced from `getGameInfoAndUserProgress` data with fallback to `getAchievementUnlocks`; fixes broken image when `BadgeName` is absent
- Game link uses top-level `game.id` from API response instead of `achievement.gameId`; fixes game name not appearing in breadcrumb

### Game Page

- New **Leaderboards** tab (between Info and Community) — final tab order: Achievements · Info · Leaderboards · Community · Hashes
- Leaderboards tab lazy-loads on first open — fetches `getGameLeaderboards` + `getUserGameLeaderboards` + `getGameRankAndScore(t=0)` in parallel
- **Top Scorers** card at top with rank, avatar, username, and score; top 3 ranks gold/silver/bronze coloured
- Board list with accordion expand — clicking a board lazy-loads top 25 entries (cached per board ID)
- Collapsed board shows format badge (TIME/SCORE/VALUE), description, top entry preview, and "Your Entry" pill if the user has a score
- Expanded board highlights the logged-in user's row with cyan left border and username
- Hero background art opacity reduced from 25% to 20% to match achievement page
- "Subset of" breadcrumb now has a `bg-black/40 backdrop-blur-sm` pill background and brighter text so it stays legible on dark hero images
- Achievement badge and title links now navigate to the internal `/achievement/` page instead of opening RA site in a new tab

### Navigation

- Breadcrumbs: three distinct styles — root ("Cheevo Tracker") is muted bold uppercase, intermediate crumbs with links are blue (`#66c0f4`), active/current page is light (`#c6d4df`); all intermediate crumbs now carry hrefs for back navigation
- Breadcrumbs: dynamic crumbs render as shimmer blocks while data is loading instead of placeholder text
- Game page: removed orphan "Game" category label from breadcrumb — now `Cheevo Tracker › [Game Title]`
- Achievement page: removed orphan "Game" category label — now `Cheevo Tracker › [Game Name] › [Achievement Title]`

### Structure

- `ra-api.js`: `getAchievementUnlocks` now properly maps the `achievement` object to camelCase (was passed as raw PascalCase); `console` and `game` objects also mapped
- Profile page: all achievement links (game modal, activity feed, recent achievement card) updated to internal `/achievement/` page; removed `target="_blank"`

---

## v26.04.14 — Game Page: Community Tab, Info Tab Enhancements

### Game Page

- New **Community** tab (between Info and Hashes) with Recent Masters and Comments sections
- Community tab lazy-loads on first open — fetches `getGameRankAndScore(t=1)` + first 25 comments in parallel
- Comments support "Load more" (25 at a time) showing remaining count
- Recent Masters and Comments displayed side by side on desktop, stacked on mobile; Recent Masters scrollable at fixed height (~5 rows) on all screen sizes
- Info tab now lazy-loads `getGameProgression` on first open; `getGameExtended` fetched eagerly on mount alongside main data
- New **Time to Beat** section showing median Beat (Casual) / Beat (HC) / Complete / Master times; hidden if all values are null; shimmer skeleton while loading
- Info table gains **Last Updated** row (from `getGameExtended`) and **Parent Game** link for subset games
- Active dev claim banner now sourced from `API_GetActiveClaims` (filtered to current game) — reliably shows only truly active claims, not stale historical ones
- Active claim banner moved above the tab bar so it's visible on all tabs, not buried in Info
- **In Dev** badge in hero title row tied to same active claims check as the banner
- Achievement rows now show author and creation date (`by {author} · added {date}`) once `getGameExtended` data loads
- Empty achievement list shows "This game has no achievements yet." instead of the filter-mismatch message
- Tab state persists in URL (`?tab=`) via `history.replaceState`; restored on reload

### Structure

- `ra-api.js`: `getGameExtended` now maps `claims` through `mapClaim` for consistent camelCase fields

---

## v26.04.12 — Backlog, Mobile Polish, Settings & Game Details

### Backlog

- Removed obsolete "Series" grouping option (no `series.json`, always produced empty results)
- Console column now visible on mobile in "None" grouping; "Status" grouping shows console as subtitle under the title instead
- Mastered progress cell now shows `X/Y` achievement count instead of a "Mastered" badge — status label below the title already conveys mastery
- Skeleton persists until `BACKLOG.games` is populated, preventing empty-table flash when `watchlistData` arrives but `transformData` hasn't re-run yet

### Game Page

- Stats strip moved inside the hero section — hero background now extends to cover both the game info and the stats row; stats strip uses semi-transparent `bg-[#131a22]/50`
- Tab bar redesigned as compact pill buttons instead of profile's underline style
- Tab bar sticky fixed: root div changed from `overflow-x: hidden` to `overflow-x: clip` — `hidden` was creating a scroll container that broke `position: sticky`
- "Details" tab renamed to "Info"
- Genre and released date removed from hero info row — both fields already appear in the Info tab metadata table
- Console icon changed from Monitor to Gamepad2 (controller)
- Separator lines added under each section title in Info and Hashes tabs (`border-b border-[#2a475e]`)
- Info tab metadata table: `divide-y divide-[#2a475e]` for visible row dividers
- Info tab values use `break-words min-w-0`; Hashes MD5 uses `break-all` — fixes horizontal scroll on mobile
- Locked achievement rows changed from `bg-[#171a21]` to `bg-[#1b2838] opacity-60` — visually distinct but clearly dimmer
- Achievement list filter/sort controls redesigned to match profile modal and Backlog tab: two labeled rows of pill buttons with a count readout
- Hero info row: icons added for each metadata field; each item wraps as a self-contained unit
- Stats strip: uses `grid-flow-col auto-cols-fr` so all stat cells share equal width without horizontal scroll
- Achievement rows redesigned: card-style rows with colored left-border accent (gold HC, gray SC, dark locked), linked badge with lock overlay, `pts` pill badge, trueRatio multiplier, type icons with hover tooltips, dual HC/casual global unlock % bars, unlock date in blue
- Type icon colors: Progression → Trophy gold, Win Condition → Crown red, Missable → AlertTriangle orange

### Profile

- Recently Played section header hidden on desktop (`md:hidden`), shown on mobile only — desktop layout makes the header redundant

### Navigation

- Replaced "Log" nav tab with "Settings" — navigates to a dedicated `/settings/` page with Changelog link, Refresh Data, and Log Out; signed-in username shown in Account section
- Profile breadcrumb simplified to `Cheevo Tracker › Profile`

### Structure

- Added `/settings/` page with General (Changelog, Refresh Data) and Account (username display, Log Out) sections
- Extracted shared `Topbar` and `Footer` into `assets/ui.js` — all pages now use the same components
- Unified topbar breadcrumb pattern across all pages: `Cheevo Tracker › [Page]`; "Cheevo Tracker" is a link on non-profile pages
- New `/game/?id=` page replaces RA site links for all game references across the app

---

## v26.04.11 — Initial Release

Initial release — forked from gaming-hub and rebuilt as a standalone RA-only personal profile tracker with browser-side auth and live RetroAchievements API fetching.

### Auth

- New login screen (`/index.html` + `/login.js`): username + API key form with show/hide toggle; validates credentials against the RA API before storing
- Credentials stored in `localStorage` as `raCredentials = { username, apiKey }` — sent directly to RetroAchievements, never to any intermediary
- Profile page guards on mount: missing or invalid credentials redirect immediately to the login screen
- Auth errors (RA API 401 / `AUTH_ERROR`) call `clearCredentials()` and redirect to `/` from anywhere in the app
- Logout button in the topbar calls `clearCredentials()` and redirects to `/`
- How-to instructions for obtaining an API key shown inline on the login form (Settings → Keys → Web API Key)

### Profile

- All profile data fetched live from `https://retroachievements.org/API/` — no static JSON pipeline required
- Initial page load fires 5 parallel requests: `GetUserProfile`, `GetUserSummary`, `GetUserCompletionProgress` (paginated), `GetUserAwards`, and first `GetAchievementsEarnedBetween` chunk
- Achievement history fetches 2 chunks of 6 months eagerly on Activity tab open; heatmap updates as each chunk arrives
- Watchlist lazy-loads when the Watchlist tab is first opened
- Per-game achievement details (`GetGameInfoAndUserProgress`) fetched on first modal open, cached in `detailedGameProgress`; modal opens immediately with shimmer skeleton and updates live when data arrives
- `points7Days` and `points30Days` pre-computed from chunk 0 on initial load so stats show correct values immediately
- Heatmap computed client-side from loaded chunks via `useMemo` — no pre-built file needed

### Structure

- Removed Steam profile, Activity, Completions, Hub landing, and Admin pages — RA profile is now the entire app
- RA profile moved from `/profile/ra/` to `/profile/`; root `/` serves the login page
- `profile/utils/ra-api.js` added as the RA API client: PascalCase → camelCase mapping so `transform.js` is preserved unchanged
- Mobile nav simplified to 2 tabs: Profile (`/profile/`) and Log (`/changelog/`)
- Service worker updated: cache name `cheevo-tracker-v1`, cross-origin RA API requests pass through without caching
- `manifest.json` updated: name "Cheevo Tracker", scope `"./"`
- `package.json` stripped to single `"start": "npx serve ."` script with no dependencies
