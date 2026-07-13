# Changelog

## v26.07.13 — Professor Oak Challenge Guide

### Structure

- Added `game/utils/poc.js` — `classifyPocAchievement()` and `buildPocCheckpoints()` group a POC subset's achievements into ordered checkpoints (gym leader / Elite Four / Champion / legendary finale) purely by parsing the live achievement `title`/`description` text — a checkpoint marker is identified by a target Pokédex count embedded anywhere in its description (`NUMERIC_TARGET_PATTERNS`, handling half a dozen different phrasings), and each catch requirement's species name(s) are pulled from the description (`SPECIES_PATTERNS`), the title when the description is too generic (`looksLikeSpeciesList`), or an exact-title lookup as a last resort (`KNOWN_CHOICE_GROUPS`, e.g. Red's "Choose your Eeveelution"). No hardcoded species-to-checkpoint mapping. Validated against all five independently-authored subsets (HeartGold, SoulSilver, Red, Blue, Yellow) with zero unclassified achievements. Checkpoints whose final requirement also names its own species (e.g. HeartGold's Kyogre, Yellow's Mewtwo) correctly list that species as a checklist entry, not just as the checkpoint-clear marker.
- Added `game/data/poc-pokemon.json` — a static, PokeAPI-generated reference table (422 entries) of evolution method/level, per-version wild encounter locations, breeding info, and legendary flags, keyed by species name (including known alternate spellings across all five subsets, e.g. `NidoranF`/`Nidoran Female`/`Nidoran♀`). Not hand-authored, to avoid seeding the guide with incorrect game data.
- Added `scripts/poc-data-gen.js` — reusable generator that fetches a POC subset's live achievement data from RA, parses it into species requirements, cross-references PokeAPI for evolution/location/breeding data, and merges the result into `game/data/poc-pokemon.json`. Mirrors the same achievement-text classification `game/utils/poc.js` uses at runtime.
- Updated `docs/pages/game.md` with a new "Professor Oak Challenge Tab" section documenting the subset lookup, checkpoint parsing, reference data shape, and accordion UI.
- Added `docs/poc-data-generation.md` — walkthrough for extending the POC guide to a new Pokémon game (finding the subset ID, running the generator, wiring up `POC_GAMES`), linked from `CLAUDE.md`'s documentation table.

### Game Page

- Added a **Professor Oak** tab, shown when browsing a POC subset's own game page directly (`findPocSubset(gameId)` in `game/utils/poc.js`). Covers HeartGold (`22862`) and SoulSilver (`22693`) under parent `7212`, Red (`16084`) and Blue (`29295`) under parent `724`, and Yellow (`22851`) under parent `723`. No separate fetch — reuses the achievement data already loaded for the page. If the subset has a sibling under the same parent, an "Also see" link jumps to its page.
- Fixed `?tab=poc` not restoring on page load/refresh — the tab allowlist used to seed initial state from the URL didn't include `'poc'`, so a direct link or refresh silently fell back to the Achievements tab.
- Tab renders an accordion — one collapsible section per checkpoint, with the player's current (first not-yet-cleared) checkpoint auto-expanded. Each checkpoint header shows a cleared checkmark and a `caught / total` species count.
- For each locked species, shows a pointer: evolution method/level if it's an evolution (e.g. "Evolves from Pidgey — Level 18"), wild encounter locations for the active version, breeding instructions for baby Pokémon, or a legendary-encounter flag — falling back to the achievement's own description text when no structured hint exists for that species.

## v26.06.17 — Babel JSX Runtime Fix

### Structure

- Fixed `Uncaught TypeError: Failed to resolve module specifier "react/jsx-runtime"` — unpinned `@babel/standalone` pulled a newer version that defaults to the automatic JSX runtime, which can't resolve `react/jsx-runtime` as a bare specifier without a bundler. Pinned all 7 pages to `@babel/standalone@7.21.8`, the last version before the default changed.

## v26.06.16 — Game Awards Display Order

### Profile

- Game awards now sort by `DisplayOrder` from the RA API within each type group (Mastery/Completion first, then Game Beaten), respecting the order the user configured in their RetroAchievements settings. Falls back to `awardedAt` descending when no award has a non-zero `DisplayOrder`.
- `DisplayOrder` is now passed through in the `pageAwards.visibleUserAwards` transform in `ra-api.js` (was previously stripped).

## v26.06.13 — PWA Install Prompt + Session Feed Avatar Fix

### Social

- Fixed cached avatar from IDB (`socialProfileMap`) not being used in **By Session** feed mode — `FeedSession` now accepts a `socialProfileMap` prop and resolves the user avatar from the cache first, falling back to the RA `UserPic` URL; matches the behaviour already in place for **By User** mode.
- Added achievement type icons per achievement row in `FeedAchRow` — Trophy (Progression), Crown (Win Condition), AlertTriangle (Missable) with pop-box tooltips; matches the existing "mine" tab design exactly.
- Added per-achievement **pts** badge and RetroPoints **×multiplier** in `FeedAchRow`; multiplier is color-coded by magnitude (grey ×1–9, blue ×10–19, gold ×20–29, red ×30+) — matches the mine tab's existing design.
- Added session-level achievement count, pts, and RP totals in `FeedSession` header (next to the time range) for **By Session** mode — mirrors the achievement count shown in **By User** user headers.
- Added day-level pts and RP totals in the day-group header for **By Session** mode.
- Added user-level pts and RP totals in the user-group header for **By User** mode — all totals follow the same display rule: RP badge hidden when `trueRatio === points` (no rarity multiplier).

### Polish

- Added a slide-up install banner (`assets/pwa-install.js`) that appears when the browser fires `beforeinstallprompt` — lets users add the app to their home screen without hunting through browser menus.
- Banner auto-dismisses after 10 seconds with an animated progress bar; clicking **Install** triggers the native prompt, clicking × sets a 7-day cooldown via `ra_pwa_dismissed_at` in localStorage.
- Shown at most once per session (guarded by `sessionStorage`); skipped entirely if already running in standalone/PWA mode.
- Injected into all 7 pages (`index.html`, `profile/`, `game/`, `achievement/`, `console/`, `changelog/`, `search/`) via a `<script>` tag after `mobile-nav.js`.
- On mobile the banner sits above the bottom nav bar using the same safe-area-inset offset pattern as `mobile-nav.js`.

## v26.06.12 — Feed Session Indent Fix

### Social

- Fixed "By Session" feed grouping missing the `ml-4 border-l` indent under the day header — now visually consistent with "By User" mode
- Sessions with more than 3 achievements now collapse into a badge strip in both grouping modes — previously only worked in "By User" mode (`hideUser=true`); collapse initial state and expand/collapse buttons no longer gated on `hideUser`
- **By Session / By User** grouping toggle moved to second row alongside timezone label (left: timezone, right: toggle buttons)

## v26.06.11 — Friends Feed Group Mode

### Social

- Friends activity feed now supports two grouping modes: **By Session** (default) shows sessions chronologically with user shown inline per session; **By User** (previous behaviour) groups sessions under a per-user header within each day — toggle buttons appear below the Mine/Friends selector when in Friends view
- Switching between grouping modes fades the feed in with a 0.2s opacity animation

## v26.05.31 — Social Bug Fixes + Softcore Points

### Social

- Fixed stale social refresh not updating "last synced" timestamp — was caused by a nested floating promise (`getSocialData().then()`) inside the fetch `.then()`, so `.finally(() => setSocialRefreshing(false))` ran before `setSocialTs` was called; now uses `Date.now()` directly, which is synchronous within the `.then()` callback and guaranteed to run before the spinner clears
- Softcore-only users (`totalPoints === 0`) now show their softcore points in gray (`#8f98a0`) instead of 0 pts in gold in both the social rows and the visitor-mode profile header; uses `totalSoftcorePoints` from IDB cache (social) or `transformData` (profile); `totalPoints === 0` is more reliable than `rank === null` since users can hide their rank
- Users inactive more than 1 week no longer show game info or rich presence; instead shows "Last active X ago" using `recentlyPlayed[0].lastPlayed` as the timestamp; users with no cached profile show nothing

### Profile

- Green dot on profile avatar when last game activity is under 1 hour ago, using `profileData.mostRecentGame.lastPlayed`; takes priority over the API status dots (Online/Playing/Offline); applies to both own profile and visitor mode

### Profile

- Fixed friends activity feed avatars not using IDB-cached `userPic` when Social tab was never opened — `socialProfileMap` now loaded from `social_profiles` IDB at the start of the friends activity fetch using the following list, so avatars resolve correctly regardless of tab visit order

## v26.05.30 — Social Sub-tabs

### RetroAchievements API

- Social last-played now uses `recentlyPlayed[0]` from `getUserSummary` (`g:1, a:0`) instead of achievement unlock dates; users with no synced profile show nothing

### Cache

- Background profile sync added: after social data loads, individual profiles fetched sequentially (1 s apart) via `getUserSummary` and stored in new `social_profiles` IDB store (DB v2 — bumped to add store); stores `userPic`, `totalPoints`, `totalTruePoints`, `totalSoftcorePoints`, `rank`, `totalRanked`, `richPresenceMsg`, `motto`, `lastPlayed`
- Profile sync has 1 h TTL tracked in `meta` IDB store (`social_profiles_sync_<username>`); skipped on tab open if within TTL, always forced on manual Refresh
- Social list (following/followers) has 24 h TTL with stale-while-revalidate: stale data shown immediately while fresh lists fetch in background; `socialRefreshing` indicator shown for both manual and background refreshes
- Both stale and manual refresh paths share `applySocialData` helper for consistent behaviour; errors suppressed when stale data is available

### Structure

- Removed `getFriendActivityMap` dependency from social tab

### Social

- Social tab now splits Following and Followers into separate sub-tabs; Following is the default; count shown inline on each tab button; sort controls moved to the right of the sub-tab row
- Replaced "Mutual" text badge in social rows with a compact `ArrowLeftRight` icon; hovering shows a "Mutual follow" tooltip
- Fixed last-played game title in social rows not parsing tilde tags or subset notation — now uses `parseTitle` to show `baseTitle` with inline subset badge or tilde tag pills
- Fixed tilde tags being suppressed on subset games in social rows — subset badge and tilde tags are now independent conditions so both render when present
- Social rows now show rich presence as the activity line when available: game title + timestamp on first line, rich presence status on second line; both hidden if user has no activity in the past week
- Green dot on avatar when last played within 1 hour
- Compare modal now uses cached `userPic` from `social_profiles` IDB when available

### Game Page

- Friend picker, selected friend banner, and compare-via-URL entry point now use cached `userPic` from `social_profiles` IDB when available; profile is pre-loaded from IDB on page load when `?compare=` is in the URL so the avatar resolves before the following list fetches

### Profile

- Friends activity feed user avatars now use cached `userPic` from `social_profiles` IDB when available

## v26.05.27 — Bug Fix: Stale Friend Activity Progress Counter

### RetroAchievements API

- Fixed stale friend activity refresh showing progress stuck at 26/26 from the start: Phase 2 of `fetchFriendsActivity` now only counts fresh entries as done; stale entries are counted in Phase 4 after their API update completes, so the counter accurately advances as each background fetch finishes

## v26.05.19 — Separated Cache Actions + Social Last Played + IDB Migration + Bug Fixes

### RetroAchievements API

- Fixed `fetchFriendsActivity` Phase 2: `friendUser` was referenced from the wrong (outer) scope inside the cached-batch `forEach`, causing callbacks to fire with `undefined` as the user argument — now correctly destructured from `followingList[i]` per iteration
- Added `getFriendActivityMap(usernames)` to `ra-api.js` — batch IDB reads from `friend_activity` store; scans all achievements per user to find the true most-recent entry (array order not guaranteed), applies 24h cutoff, returns `Map<username, { gameId, gameTitle, gameIcon, lastTs }>`

### Cache

- **"Refresh Data"** now selectively clears only ephemeral IDB stores (`progress`, `friend_activity`, `backlog`, `friend_list`, `meta`) + sessionStorage + `ra_*` localStorage — `consoles` and `games` stores are preserved, so the full game catalog doesn't need to be re-downloaded after each refresh
- **"Purge Cache"** now clears only the service worker asset cache (JS, HTML, icons) — IDB is completely untouched; use this after a deployment to get fresh app files without losing game data
- `fetchAchievementsChunk` replaced by `fetchAllAchievements` (exported) + internal `fetchChunk` — achievement unlock history now cached in the `progress` IDB store (keyPath `[username, gameId]`, `username` index) with a 5-min TTL stored in `meta` as `progress_ts_{username}`
- Added `clearProgress(username)` export — deletes all progress rows for a user via index cursor
- Added `idbMetaPut(key, value)` internal helper for the out-of-line-key `meta` store
- Added `CHUNK_TTL = 5 min` constant
- `ra_chunk_{username}_{n}` sessionStorage keys eliminated

### Structure

- `updateAllGamesForConsole` de-exported (internal helper, only called by `fetchConsoleGames`)
- `clearAllGamesStore` deleted — no callers; Purge Cache already calls `indexedDB.deleteDatabase('cheevo_tracker')` directly
- Verified: no `ra_fa_`, `ra_chunk_`, `ra_consolegames_`, `ra_backlog_`, or `ra_social_` keys remain in any read/write path; `ra_consoles` (console list, 24h localStorage TTL) is the only remaining `lcache` usage and is out of scope

### Social

- Social tab now shows "last played" info on each user row: game icon + title + time ago (e.g. `[icon] Sonic 3 · 2h ago`), resolved from cached `friend_activity` IDB data — zero API calls, gracefully absent if activity hasn't been fetched yet
- Tapping the last-played line navigates to the game page

### Profile

- Activity tab state collapsed from a 2-element chunk array + `loadingChunkIndices` Set to a single `achievements` array + `achievementsLoadingMore` boolean
- `loadAchievements()` replaces `loadChunk(idx)` — calls `fetchAllAchievements` with `onPartial` callback so chunk 0 still renders progressively while chunk 1 fetches in the background
- `allLoadedAchievements` is now a direct reference to `achievements` (no flat/merge step)
- Heatmap and ActivitySkeleton / `loadingMore` / `allLoaded` props updated to use the new state shape
- `fetchProfile` result handler no longer seeds `achievementChunks[0]` — activity tab manages its own load lifecycle

## v26.05.18 — IDB Migration (Backlog, Friends, Search) + Sync Timestamps

### Cache

- Migrated all persistent caches from `localStorage` / `cheevo_search` IndexedDB to a unified `cheevo_tracker` IndexedDB with dedicated object stores: `consoles`, `games`, `progress`, `friend_activity`, `friend_list`, `backlog`, `meta`
- Old `cheevo_search` database is deleted automatically on first open of the new DB
- `fetchBacklog` now reads from / writes to the `backlog` IDB store (24 h TTL); added `getBacklog`, `setBacklog`, `clearBacklog` exports
- `fetchSocial` now reads from / writes to the `friend_list` IDB store (24 h TTL); added `getSocialData`, `setSocialData` exports
- `fetchFriendsActivity` now reads/writes `friend_activity` IDB store instead of `localStorage`; `allFriendsCached` is now async
- Added `staleFriendActivity` and `clearAllFriendActivity` IDB helpers (used by soft/hard refresh)
- "Refresh Data" and "Purge Cache" in both the desktop menu and mobile sheet now clear `cheevo_tracker` instead of the old `cheevo_search` DB

### Structure

- Bumped `CACHE_NAME` in `sw.js` to force service worker to evict stale precached assets (fixes module export errors after IDB migration)

### Backlog

- Backlog tab shows IDB-cached data instantly on open; added Refresh button with spinner and "Synced Xm ago" timestamp

### Social

- Social tab shows IDB-cached data instantly on open; added Refresh button with spinner and "Synced Xm ago" timestamp

### Profile

- `refreshFriendsActivity` (soft refresh) now marks IDB entries stale instead of writing to `localStorage`
- `resetFriendsActivity` (hard reset) now clears the `friend_activity` IDB store
- Activity tab friends toolbar: Refresh and Reset buttons unified to icon+text style (matching Backlog/Social headers); Reset uses `RotateCcw` icon with muted red hover; added "Synced X ago" timestamp; timezone label moved below the toggle row

### Search

- `fetchConsoleGames` now reads from / writes to the `consoles` + `games` IDB stores (24 h TTL on `consoles.fetchedAt`); removed `ra_consolegames_*` localStorage cache
- `getAllGamesFromDB` rewritten as a single three-store transaction (`games`, `consoles`, `meta`); games are now enriched with `consoleName` from the `consoles` store, fixing the missing console name column in search results
- Added `idbGetAllByIndex` helper for index-filtered IDB reads
- Search page header now shows "Synced X ago" next to the Refresh All button, sourced from `lastFullFetch`; removed the duplicate timestamp from the stats line below

## v26.05.16 — Search: IndexedDB Index, Achievement Filter + Console Multi-Select

### Search

- Migrated search index from `localStorage` to IndexedDB (`cheevo_search`) — removes the 5 MB browser quota limit entirely; all games (with and without achievements) are now indexed without risk of storage errors
- Added achievement filter to search: All / With Achievements / Without Achievements
- Added console multi-select filter — drop-down panel with checkboxes derived from the indexed game list; shows count of selected consoles in the button label; closes on outside click
- Games with zero achievements are labelled "No achievements" in search results
- "Refresh Data" and "Purge Cache" in the mobile menu now also clear the IndexedDB search index so the next fetch starts fresh

## v26.05.15 — Activity Timezone, Friends Feed Redesign, Backlog Pagination + Global Search

### Profile

- Activity tab (Mine and Friends) now displays all times and day groupings in the local machine timezone — previously showed raw UTC strings; fixes both the session header time range and individual achievement timestamps in the friends feed
- Redesigned friends feed layout: within each day, activity is grouped by user (avatar + username + achievement count header, sessions nested below); users ordered by most recent session within the day
- Sessions with more than 3 achievements collapse to a badge strip preview (up to 8 icons on desktop, 5 on mobile); badge strip matches achievement card style; clicking expands to full list; a "↑ collapse" button at the bottom collapses back; sessions with 3 or fewer show expanded by default
- On mobile, session console name moves below the game title for more title space; desktop keeps them inline
- Updated loading shimmer to match the new day → user → session structure with badge strip placeholders
- Fixed friends feed sessions breaking when another user's unlock interleaved between two unlocks from the same user in the same game — sessions now group all same-user+game unlocks within a 1-hour gap regardless of other users' activity in between
- Added timezone label (IANA name, e.g. `Asia/Jakarta`) to the right of the Mine/Friends toggle, always visible
- Heatmap day buckets and timeline day headers now correctly reflect local dates, so achievements near midnight no longer appear under the wrong day

### Backlog

- Added pagination to the Backlog tab: page size selector (50 / 100 / 150 items), Prev / Page X of Y / Next navigation, and page reset on any filter or grouping change; grouped mode snaps to group boundaries so no group is split across pages
- Fixed backlog rows blinking on scroll — `GameRow` was defined inside the render path, causing React to unmount/remount every row on each render; fixed by calling it as a plain function instead of a JSX component
- Moved page size selector from the filter bar to the pagination footer; added bottom padding on mobile so the Next button no longer overlaps the back-to-top floating button

### Search

- Added global game search (`/search/`) — indexes all console game lists into a permanent local store (`ra_allgames`); search is live-filtered across all indexed games with 50-result pages (Prev / Page X of Y / Next); includes a progress bar fetch with 1 req/s rate limiting, cancel support, and a Refresh All button; data persists until manually refreshed or cleared via the menu
- Per-console pages automatically update the search index whenever their 24 h cache expires and a live re-fetch occurs

### Console Page

- Console page gains a Search button in the header linking to the search page

### Navigation

- Search link added to the mobile menu sheet

## v26.05.13 — Profile Subset Title Rendering Fixes

### Profile

- Fixed "Most Recently Unlocked" game title not rendering subset badge and name — now shows Subset badge + subset name for subset games, consistent with the friends feed
- Fixed Series Progress "latest achievement" game title not stripping subset brackets — now renders base title via `parseTitle`

## v26.05.10 — Mobile Menu Unification + Cache Fixes

### Cache

- Fixed "Delete Data" and "Purge PWA Cache" buttons not clearing `ra_social_*` and `ra_fa_*` localStorage entries — both now clear all `ra_` prefixed keys instead of only console-related ones

### Structure

- Replaced mobile nav Settings tab with a **Menu** tab (hamburger icon) that opens a slide-up sheet; sheet contains username display, Consoles, Changelog, Refresh Data, Purge Cache, Debug toggle, and Log Out — no page navigation required
- Replaced mobile nav Consoles tab with **Backlog** (star icon, links to `?tab=backlog`) — Consoles is now accessible via the Menu sheet
- Deleted `settings/index.html` and `settings/app.js` — all functionality is now covered by the slide-up sheet (mobile) and the topbar dropdown (desktop)
- Removed settings page from `sw.js` PRECACHE; bumped `CACHE_NAME` to force cache invalidation
- Desktop `MenuDropdown` now animates in with a short slide-down + fade (~150ms ease-out) on open

### Social

- Added sort controls to the Social tab (Following/Followers lists): A–Z (default) and Points; applies to both sections simultaneously
- Fixed social compare game list not parsing subset badges and tilde tags from game titles — now shows base title + Subset badge/name or tilde tag chips, consistent with other views

### Profile

- Fixed activity tab Mine view showing sessions oldest-first within a day — sessions now appear newest-first; ascending sort is kept internally for correct session grouping and time-range tracking, then reversed for display
- Game links in visitor mode now include `?compare=<username>` so the game page opens with that user's comparison pre-selected — applies to all game links across the profile: recent game, recent achievement, activity sessions, progress series, backlog, and social compare
- Fixed friends feed session header truncating on mobile with long game/console/username — on mobile the header splits into two rows (user row + game row with stacked title/console); desktop keeps the original single-row layout unchanged
- Fixed friends feed showing no loading spinner/counter when opening with stale cache — now correctly sets `updating` status so the spinner and X/Y progress counter appear during the incremental background fetch

## v26.05.03 — Friends Feed Polish + Cache Improvements + Tab Bar Fixes

### Cache

- Smarter cache strategy for friends activity: stale cache (>1h) is served immediately then updated with an incremental delta fetch — delta ≤10d=1 call, ≤20d=2 calls, ≤30d=3 calls, >30d=full refresh; past achievements are never re-fetched unnecessarily

### Backlog

- Backlog rows animate in with `feedIn` (0.3s) on async page load — no more blink when streaming pages arrive
- Backlog "loading…" text replaced with a spinning `Loader2` icon in the stats line

### Profile

- Fixed missing activity for very active friends: friends now fetched as 3 × 10-day chunks (30-day window); server's ~500 result cap was dropping most-recent achievements since results are ordered oldest-first
- Split friends feed toolbar into **Refresh** (soft: keeps feed visible, incremental delta update with progress counter, blue) and **Reset** (hard: clears cache, full re-fetch with shimmer, red); added `'updating'` status to drive the progress counter during soft refresh
- Shimmer skeleton (3 fake sessions) shown on initial load before any data arrives; replaced by inline "X / Y users loaded" counter once the first user streams in
- Game titles in feed now parsed for `~Tag~` prefixes and `[Subset - Name]` suffixes, rendered consistently with Mine tab
- Game links open with `?compare=username` so the game page loads with that friend's comparison pre-selected
- Failed users surfaced in UI: amber warning banner lists usernames that errored after all retries; `onError` callback added to `fetchFriendsActivity`
- "unlocked in" → "earned in" to match RA terminology
- `feedIn` animation slowed from 0.2s to 0.5s
- Mine / Friends sub-view persisted in `?view=` URL param — reload restores the active view
- Loading progress moved to toggle row right side: spinning `Loader2` icon + `X/Y` counter replaces the Refresh/Reset buttons while fetching
- Tab bar sticky offset corrected for desktop: `md:top-[37px]` (was 26px) so tabs sit flush below the Topbar instead of overlapping it
- Visitor mode tab bar inner container now matches own-profile styling: `gap-1 md:gap-6`, `px-2 md:px-8`, `overflow-x-auto` — was `gap-1` with `overflow-hidden` causing layout differences
- Floating tab pill added for visitor mode on mobile: appears after scrolling 150px, slides up from above the bottom nav with Recent/Progress/Series buttons; disappears when scrolling back to top; own-profile mobile nav already covers all tabs so no pill there
- Sticky tab bar hidden on mobile for both modes (`hidden md:block`) — visitor mode floating pill replaces it; own-profile uses the bottom nav
- "Completion Progress" section header added for mobile view (same style as "Recently Played"), appears above the filter bar; `md:hidden` so desktop is unaffected

---

## v26.05.02 — Social Timeline (Activity Tab — Friends View)

### Profile

- Activity tab gains a **Mine / Friends** toggle; Friends view shows a merged timeline of own + followed users' achievements
- `fetchFriendsActivity` composite in `ra-api.js`: sequential fetch per followed user, 1000ms gap between API calls, per-user localStorage cache (`ra_fa_{user}`), streams results via `onUser` / `onProgress` callbacks
- Feed structure mirrors Mine tab: day headers → sessions (same user + game within 1-hour window) with header `[avatar] username earned in [game icon] Game · Console [time range]`; `FeedAchRow`s beneath each session header
- Own username shown in cyan (`#57cbde`), friends in gold (`#e5b143`); HC rows: gold left-border; SC: gray
- New sessions animate in with `feedIn` keyframe as friends' data streams in
- Feed paginated at 100 sessions; "Load more · N remaining" button appends 100 more
- `allFriendsCached(followingList)` skips the loading indicator when all data is already cached; `friendsFetchingRef` prevents re-entry
- Empty states: "You're not following anyone" / "No activity in the last 30 days"; error state with Retry
- Docs updated: `docs/pages/profile.md` and `docs/architecture.md`

---

## v26.05.01 — Social Timeline Phase 1 + Backlog Streaming + Fixes

### Profile

- Activity tab now has a MINE / FRIENDS toggle at the top; "Mine" shows existing heatmap + unlock list (unchanged); "Friends" shows a "Coming soon" placeholder with no heatmap
- Added `socialView`, `friendsActivityStatus`, `friendsActivity`, `friendsFetchProgress` state for upcoming social feed phases
- Backlog now streams: first page of games renders immediately on tab open; remaining pages load in the background with a "loading…" indicator in the stats line

---

## v26.04.29 — Mobile Compare Layout Fix

### Social

- Compare modal game rows now stack title above progress bars on mobile so the game title gets full width; desktop layout unchanged
- Fixed "You / username" column headers to align with the stacked bar layout on mobile
- Compare modal sort buttons now use the same bordered pill style as the game page filters

### Game Page

- Friend comparison now shows a standalone full-width banner ("Comparing with username") below the filters instead of a cramped chip in the filter row; button changes to "Change ▾" when a friend is active
- Selecting a friend now sets `?compare=<user>` in the URL so the comparison persists on refresh
- Friend banner now shows a layered HC/SC progress bar with achievement count once data loads

---

## v26.04.28 — Compare Modal Polish + Docs

### Structure

- Created `docs/` folder with agent-oriented documentation: `architecture.md`, `rules.md`, and per-page docs in `docs/pages/`
- Rewrote `CLAUDE.md` as a lean index pointing to `docs/` with hard rules surfaced at the top
- Added `docs/` to `_config.yml` exclude list so Jekyll ignores the agent docs
- Added mobile view rules to all page docs and global rules (`docs/rules.md`)
- Migrated `profile/utils/CLAUDE.md` content into `docs/architecture.md` and deleted the file; updated `CLAUDE.md` and `_config.yml` accordingly
- Deprecated `user/` page — visitor mode consolidated into `/profile/?u=<username>`; deleted `user/index.html` and `user/app.js`, removed from `sw.js` precache, deleted `docs/pages/user.md`

### Social

- Game title and icon in the compare modal are now clickable links to the game page with `?compare=<user>` so the game page auto-enters compare mode for that user
- Leading player's column in the game compare modal now gets a subtle blue (you) or cyan (them) background highlight instead of just colored text

### Game Page

- Deselecting a friend now removes the `compare` URL param

### Profile

- Game Awards section header now shows separate mastered and beaten counts

---

## v26.04.26 — Friends Progress on Game Page

### Game Page

- Added **Compare** selector to the Achievements tab — pick a followed user to compare achievements 1-to-1 directly in the list
- Following list is fetched lazily on first click and cached via `fetchSocial` (1-hour localStorage); selected friend's game data is fetched once and cached in sessionStorage for 5 minutes
- Each achievement row gains a friend status column: the achievement badge (full color if unlocked, grayscale if not) with a colored stripe — gold for HC, gray for SC, dark for locked
- Deselect the friend with the × button to return to normal view

---

## v26.04.25 — Compare Progress

### Social

- Added **Compare** button to every user row in the Following and Followers lists
- Clicking Compare opens a modal that fetches the other user's full completion progress and finds games both users have played
- Modal shows a summary (shared game count, ahead / tied / behind) and a sortable game list with side-by-side progress bars and M/B award badges for each player
- Sort options: **Diff** (biggest gap first, default), **Mine**, **Theirs**, **A–Z**
- Progress bars color-code to gold when a game is mastered, blue for you, cyan for the other user
- Following and Followers lists cached for 1 hour in localStorage
- Compare modal now shows HC/SC mode indicators: flame icon (red) for hardcore, feather icon (gray) for softcore — shown in column headers and per-game rows based on each player's actual unlock mode for that game

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

### RetroAchievements API

- Added `userPic` field to `getAchievementUnlocks` unlocks, `getComments` results, `getLeaderboardEntries` results, and `getGameRankAndScore` results mappers

### Structure

- User avatars now use the API-provided `UserPic` path instead of constructing from the current username — fixes broken images for users who changed their RA username; applied to all rendering sites (social tab, achievement unlocks/comments, game leaderboard entries/top scorers/recent masters/comments)

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

### Backlog

- Renamed **Watchlist** tab to **Backlog** across tab bar, mobile nav, stats line, and all internal identifiers (`backlogData`, `fetchBacklog`, cache key `ra_backlog_`)
- Backlog filter bar restructured for mobile — search takes full width, Status and Group filters each on their own horizontally-scrollable labeled row; desktop layout unchanged

### Social

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

### RetroAchievements API

- Added `withRetry` helper — 1 initial attempt + 2 retries, 1s between attempts, 3s on HTTP 429; applied to `API_GetAchievementsEarnedBetween` (both on mount and lazy chunk loads), `getUsersIFollow`, and `getUsersFollowingMe`

### Social

- Social tab: "Mutual" badge replaced with an `ArrowLeftRight` icon inline next to the username
- Social tab: points displayed in gold (`#e5b143`) instead of muted gray
- Social tab: Following and Followers fetched sequentially (500ms gap) instead of in parallel — reduces request bursts and 429 rate-limit errors
- Social tab: on fetch error, `socialData` stays `null` so switching away and back retries; shows error message with "Try again" button instead of silently showing empty lists

### Navigation

- Settings page + topbar menu: added **Purge Cache** — clears all PWA asset caches via Cache API and reloads
- Removed Log Out button from topbar — already in the hamburger menu

---

## v26.04.16 — Achievement Page, Leaderboards Tab, Social Tab

### Social

- New **Social tab** — shows Following and Followers lists, lazy-loaded on first open; each row shows avatar, username (RA link), points, and a "Mutual" badge when the follow is reciprocal

### Navigation

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

### RetroAchievements API

- `getAchievementUnlocks` now properly maps the `achievement` object to camelCase (was passed as raw PascalCase); `console` and `game` objects also mapped

### Structure

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

### RetroAchievements API

- `getGameExtended` now maps `claims` through `mapClaim` for consistent camelCase fields

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
