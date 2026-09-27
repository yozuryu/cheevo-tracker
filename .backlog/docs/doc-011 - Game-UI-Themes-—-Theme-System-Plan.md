---
id: doc-011
title: Game UI Themes — Theme System Plan
type: specification
created_date: '2026-09-27 02:34'
updated_date: '2026-09-27 02:58'
---
> **Status:** plan, not started. Tasks CHV-016 … CHV-022 (milestone *Game UI Themes*). Architecture decision: decision-007 (proposed).
> Line numbers below refer to the code as of 2026-09-27 and will drift; re-check them before each phase.

## Contents

1. Goal, themes and non-goals
2. How the app is built today (inventory)
3. Target architecture
4. The theme contract
5. Loading, picking and storing a theme
6. Shared chrome, fonts, service worker
7. Semantic colors every theme must map
8. Theme specs: Default, Retro, FFXVI, SO2R, Arise
9. Phases in detail (with steps, files, checks)
10. QA checklist (run for every theme and every split)
11. Rules and docs that change
12. Risks and mitigations
13. Open questions
14. Rough effort

---

## 1. Goal, themes and non-goals

### Goal

A theme switcher where each theme is a **full game-style UI**: its own layout, sizes, placement, fonts, ornaments and interaction feel, not just a recolor. Data, API calls, caching, URLs and behaviour stay shared; only the views change.

### Themes

| id | Theme | Look (one line) | Fit for dense lists | Build order |
|---|---|---|---|---|
| `default` | **Default** | Today's Steam-style dashboard | ✅ Reference | exists |
| `retro` | **Retro** | Generic 16-bit JRPG window boxes, pixel font, hand cursor | ✅ Best | 1st |
| `ffxvi` | **Final Fantasy XVI** | Dark, minimal, thin rules, serif titles, lots of empty space | ✅ List + detail | 2nd |
| `so2r` | **Star Ocean: The Second Story R** | JRPG menus of the HD-2D remake; Battle Trophies list | ✅ | 3rd |
| `arise` | **Tales of Arise** | Elegant, painterly, refined type; Titles/Artes list + detail | ✅ polish-heavy | 4th |

### Non-goals

- **No game assets.** Never use a game's art, characters, logos, UI screenshots, icons, sounds or commercial fonts. Look-alike free fonts (Google Fonts) and our own CSS/SVG ornaments only. The site must never look like an official product.
- **No behaviour differences.** A theme can't add or remove features that need new data or API calls. It can choose *not to show* a section (see *Fallback and omissions*).
- **Not every page.** Phase 1 themes only Profile and Game (see *Scope*).
- **No sound, no controller input** in this plan (possible later; out of scope).
- **No per-theme settings** (e.g. "Retro with scanlines on/off"). One theme = one fixed look.

### Scope

| Page | Themed in this plan? | Why |
|---|---|---|
| Profile (`/profile/`, incl. visitor mode `?u=`) | ✅ | Main page; all 7 tabs + both modals |
| Game (`/game/?id=`) | ✅ | Second most-viewed page |
| Achievement, Console, Search, Changelog | ❌ falls back to Default | Low traffic; can be added per theme later |
| Login (`/`) | ❌ never | Runs before any preference matters; keep simple |

---

## 2. How the app is built today (inventory)

### 2.1 Page loading

Every page's `index.html` loads Tailwind CDN, an import map (react, react-dom/client, lucide-react on esm.sh), Babel standalone 7.21.8, then `<script type="text/babel" data-type="module" src="./app.js">`, then `sw.js` registration, `assets/mobile-nav.js`, `assets/pwa-install.js`. Base colors (`#171a21` background, the `.shimmer` gradient) are inline in each `index.html`.

**Key constraint:** Babel standalone only transpiles `<script type="text/babel">` tags present at `DOMContentLoaded`. Files reached through `import` are loaded natively by the browser and **can't contain JSX**. That's why `profile/utils/*.js` and `game/utils/poc.js` are plain JS. Relative `import` paths inside a Babel-run script resolve against the **page URL**, not the script file's own location (today that's invisible because `app.js` sits next to `index.html`).

### 2.2 Profile page — `profile/app.js` (4,093 lines)

Module-level components (all mix logic and markup):

| Lines | Component | Contains logic that must move to the core |
|---|---|---|
| 67–202 | `GameCard` | — (pure view) |
| 203–439 | `RAchievementModal` (game achievements modal) | `filteredAchs` (lock + type filter), `lockFilter`/`typeFilter` state |
| 440–490 | `FeedAchRow` | — |
| 491–618 | `FeedSession` | — |
| 619–1292 | `ActivityTab` | Heatmap: `dayMap`, `days`, `weeks`, `monthLabels`, `maxPoints`, `totalPts`, `totalRetro`; timeline: `timelineGroups`; friends feed: `mergedFeed`, `feedGroups`, `feedBySession`, `feedByDay`; view state `selectedDay`, `collapsedDays`, `visibleSessionCount`, `collapsedFeedDays`, `groupMode` |
| 1293–1423 | `Sk`, `ProfileLoadingSkeleton`, `GameCardSkeleton`, `ActivitySkeleton` | — |
| 1424–1644 | `SeriesProgressTab` | `cards` |
| 1645–1861 | `StatTile`, `StatCard`, `BarRow`, `PointAcquisitionChart`, `StackedBarRow` | chart geometry (view) |
| 1862–2239 | `StatsTab` | `streaks`, `pace`, `acquisition`, `timeline`, `consoles`, `rarity` |
| 2240–2468 | `CompareModal` | `sharedGames`, `sorted`, `sortBy` |
| 2469–2560 | `SocialUserRow` | — |
| 2561–2657 | `SocialTab` | `sortBy`, `subTab` (sorting logic) |
| 2658–4093 | `App` | everything below |

`App` state (lines ~2660–2727), grouped:

| Group | State |
|---|---|
| Profile load | `profileData`, `loadingProfile`, `error` |
| Games / modal | `gamesData.detailedGameProgress`, `loadingGameDetailId`, `selectedGame` |
| Activity | `achievements`, `achievementsLoadingMore`, `socialView`, `friendsActivityStatus`, `friendsActivity`, `friendsFetchProgress`, `failedFriends`, `friendsActivityTs`, `friendsFetchingRef` |
| Backlog | `backlogData`, `backlogLoadingMore`, `backlogTs`, `backlogRefreshing`, `backlogSearch`, `backlogStatusFilter`, `backlogGrouping`, `collapsedGroups`, `backlogPage`, `backlogPageSize` |
| Social | `socialData`, `socialError`, `socialTs`, `socialRefreshing`, `socialProfileMap`, `socialProfilesProgress`, `socialProfilesFetchingRef` |
| Compare | `compareUser`, `compareData`, `compareLoading`, `compareError` |
| Progress tab | `progressSearch`, `progressFilter`, `showMastered` |
| Series | `seriesData` |
| Tabs | `activeTab` (from `?tab=`), `setTab`, `setSocialViewUrl` |
| Pure UI | `showAllRecent`, `showScrollTop`, `showFloatingTabs`, `pillLeaving`, `pillLeaveTimer`, `statsExpanded`, `awardsExpanded`, `tabBarRef` |

Actions: `handleAuthError`, `refreshFriendsActivity`, `resetFriendsActivity`, `refreshBacklog`, `startSocialProfilesFetch`, `applySocialData`, `refreshSocial`, `openCompare`, `closeCompare`, `openGameDetails`, `loadAchievements`, `setTab`, `setSocialViewUrl`, `toggleGroup`.

Effects (~2902–3094): mount fetch, lazy loads per tab (backlog, social, friends activity, achievements), `heatmapData`, `rawData` → `transformData` → `{ PROFILE_DATA, ALL_GAMES, BACKLOG }`, scroll listener (floating pill, scroll-to-top). Progress buckets (`byRecency` etc.) are computed in the render section (~3095+). The render part of `App` is ~1,000 lines (~3095–4093), including an inline `GameRow` component (~3657).

### 2.3 Game page — `game/app.js` (1,463 lines)

| Lines | Component |
|---|---|
| 51–172 | `AchievementRow` (pure view) |
| 173–222 | `PocHintLine`, `PocEntryRow` |
| 223–1463 | `GameApp` |

`GameApp` state: `game`, `loading`, `error`, `tab` (`achievements | details | leaderboards | community | hashes | poc`, from `?tab=`), `filter`, `typeFilter`, `sort`, `hashes`, `loadingHashes`, `gameProgression`, `gameExtended`, `activeClaims`, `loadingInfoExtra`, `communityMasters`, `communityComments`, `commentsTotal`, `commentsOffset`, `loadingCommunity`, `loadingMoreComments`, `leaderboards`, `topScorers`, `userLbMap`, `boardEntries`, `expandedBoardId`, `loadingLeaderboards`, `loadingBoardId`, `parentGame`, `followingList`, `loadingFollowing`, `socialProfileMap`, `selectedFriend`, `friendGameData`, `loadingFriendData`, `showFriendPicker`, `pocReference`, `expandedCheckpoint`.

Derived: `parsed`, `achList`, `pocCheckpoints`, `currentCheckpointKey`, `friendAchMap`, `filteredSorted`, `difficulty` (bands), `unlockedCount`, `totalPoints`, `earnedPoints`, `heroBg`. 8 effects: mount fetch + lazy loads per tab (hashes, community, leaderboards, poc reference, following …).

> Note: `docs/pages/game.md` says all 9 requests fire on mount; the code lazy-loads hashes, community, leaderboards and POC per tab. Fix the doc during Phase 3. The Info tab's id is `details`.

### 2.4 Shared chrome

| File | Hardcoded hex | CSS vars | Role |
|---|---|---|---|
| `assets/mobile-nav.js` | 40 | 3 (`--mnav-color`) | Bottom nav (6 slots) + Menu sheet (Stats, Consoles, Search, Changelog, Refresh Data, Purge Cache, Debug Mode, Log Out) |
| `assets/ui.js` | 58 | 0 | `Topbar`, `Footer`, `MenuDropdown` (desktop menu), debug modal/FAB |
| `assets/pwa-install.js` | 13 | 0 | Install prompt |
| each `index.html` | 5 | 0 | Page background, shimmer |

Across the whole repo there are ~1,900 hardcoded hex values, mostly Tailwind arbitrary classes like `bg-[#1b2838]`, and ~20 distinct colors.

### 2.5 Service worker

`sw.js` is **cache-first** for same-origin static assets with a manual `CACHE_NAME` bump and a `PRECACHE` list of every page's `index.html` + `app.js`. `changelog.md` is network-first; RA API calls pass through. Consequence for themes: new theme files are only served fresh after a `CACHE_NAME` bump (see §6.3).

### 2.6 Other planned work that touches the same code

- **CHV-014 Game Page — Desktop Single-Page Layout** changes the Game page layout. Do it **before Phase 3** (or explicitly drop it). After the split it would only be a Default-view change, but doing it mid-split means merging layout changes into moving code.

---

## 3. Target architecture

### 3.1 Folder layout

```
cheevo-tracker/
├── profile/
│   ├── index.html            # + theme loader snippet (§5.2)
│   ├── core.js               # NEW  hooks: useProfilePage() — no JSX
│   ├── selectors.js          # NEW  pure functions moved out of components (feed, heatmap, stats, buckets…)
│   └── utils/                # unchanged (ra-api.js, transform.js, helpers.js, constants.js)
├── game/
│   ├── index.html            # + theme loader snippet
│   ├── core.js               # NEW  useGamePage()
│   ├── selectors.js          # NEW  filteredSorted, difficulty bands, poc grouping glue…
│   └── utils/poc.js          # unchanged
├── themes/
│   ├── registry.js           # NEW  plain JS: ids, names, pages implemented, preview swatches, fonts
│   ├── loader.js             # NEW  plain JS, loaded as a normal <script> (§5.2)
│   ├── base.css              # NEW  CSS variables used by shared chrome, default values
│   ├── default/  profile.js  game.js  theme.css (only chrome vars, may be empty)
│   ├── retro/    profile.js  game.js  theme.css  (+ ornaments as inline SVG in CSS)
│   ├── ffxvi/    profile.js  game.js  theme.css
│   ├── so2r/     profile.js  game.js  theme.css
│   └── arise/    profile.js  game.js  theme.css
└── (achievement, console, search, changelog keep their app.js — always Default)
```

`profile/app.js` and `game/app.js` are **deleted** at the end of Phases 2 and 3; their markup lives in `themes/default/profile.js` / `game.js`.

### 3.2 Layers

```
RA API
  ↓ profile/utils/ra-api.js          (unchanged — raw wrappers + composites, caching)
  ↓ profile/utils/transform.js       (unchanged — single merge point)
  ↓ <page>/selectors.js              (NEW — pure derived data, no React)
  ↓ <page>/core.js                   (NEW — React hooks: state, effects, actions, URL sync)
  ↓ themes/<id>/<page>.js            (NEW — markup only, per theme)
```

Rules:

- **Core owns** anything that fetches, changes what data is shown, lives in the URL, or must survive a theme switch: tabs, filters, sorts, search strings, selected game/friend/compare user, lazy-load triggers, refresh actions, pagination *of fetches*.
- **Views own** purely presentational state that depends on the layout: floating pill, scroll-to-top visibility, expanded/collapsed panels, hover/tooltip state, which list row the cursor is on, client-side page number of a list (Retro may page a list that Default scrolls).
- **Selectors** are pure functions `(inputs) → derived data`, unit-testable in Node without React. Views may call selectors directly for view-specific derivations (e.g. heatmap week geometry) but must not call `ra-api.js`.
- **Hard rules unchanged:** views never call `raFetch` or read PascalCase fields; nothing bypasses `transformData`.

### 3.3 Why hooks + selectors instead of shared components

Themes differ in structure, so shared JSX components would either force Default's structure on every theme or grow endless props. Hooks + selectors share everything that *isn't* structure. Small shared helpers that are genuinely theme-neutral (formatters in `helpers.js`) stay shared.

---

## 4. The theme contract

### 4.1 What a theme page file must export

Each `themes/<id>/<page>.js` is a Babel-run module that **renders the page itself** (same as today's `app.js`):

```jsx
// themes/retro/profile.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { useProfilePage } from '@ct/profile/core.js';
// … theme components …
function RetroProfile() {
  const page = useProfilePage();
  // render from page.* only
}
createRoot(document.getElementById('root')).render(<RetroProfile />);
```

### 4.2 `useProfilePage()` return shape (contract)

Grouped so a theme can ignore whole sections. Every field listed is required from the core; views may ignore any.

```js
{
  status:   { loading, error, isVisitorMode, targetUser, username },
  profile:  PROFILE_DATA,               // from transformData, unchanged shape
  games:    ALL_GAMES,                  // idem
  tabs:     { active, setTab, available: ['recent','progress','series','activity','backlog','social','stats'] },
                                        // `available` already filtered (visitor mode, series presence, stats own-only)
  recent:   { recentlyPlayed, mostRecentAchievement, awards, stats },
  progress: { search, setSearch, filter, setFilter, showMastered, setShowMastered,
              buckets: { all, nearly, inprogress, abandoned }, counts },
  series:   { cards, visible },
  activity: { mine: { achievements, loadMore, loadingMore, hasMore, heatmap, totals },
              view, setView,                              // 'mine' | 'friends'
              friends: { feed, status, progress, failed, ts, refresh, reset } },
  backlog:  { items, loading, loadingMore, ts, refreshing, refresh,
              search, setSearch, statusFilter, setStatusFilter, grouping, setGrouping,
              page, setPage, pageSize, setPageSize, grouped },
  social:   { data, error, ts, refreshing, refresh, profileMap, profilesProgress,
              sortBy, setSortBy, subTab, setSubTab, sorted },
  stats:    { loading, streaks, pace, acquisition, timeline, consoles, rarity },
  gameModal:{ selected, open(game), close(), loadingId,
              lockFilter, setLockFilter, typeFilter, setTypeFilter, achievements },
  compare:  { user, data, loading, error, open(username), close(), sortBy, setSortBy, sharedGames },
  actions:  { logout },
}
```

Notes:
- State that is inside sub-components today but affects data (`RAchievementModal` filters, `CompareModal`/`SocialTab` sort, `groupMode` in the feed) moves to the core so it survives a theme switch and behaves the same everywhere.
- The feed's `visibleSessionCount` (100-per-page "Load more") stays in the view; the core exposes the full grouped feed.

### 4.3 `useGamePage()` return shape (contract)

```js
{
  status:     { loading, error, gameId },
  game, parsed, parentGame, heroImage,
  tabs:       { active, setTab, available },         // poc only when findPocSubset(gameId)
  totals:     { unlockedCount, total, earnedPoints, totalPoints, award },
  achievements: { list: filteredSorted, all: achList, filter, setFilter, typeFilter, setTypeFilter,
                  sort, setSort, difficulty },
  details:    { extended, progression, claims, loading },
  leaderboards: { list, topScorers, userMap, entries, expandedId, setExpandedId, loading, loadingBoardId },
  community:  { masters, comments, total, loadMore, loading, loadingMore },
  hashes:     { list, loading },
  friends:    { following, loading, open(), selected, select(friend), clear(), data, loadingData, achMap },
  poc:        { subset, checkpoints, currentKey, expanded, setExpanded, reference, hint(name) },
}
```

### 4.4 Fallback and omissions

- A theme that doesn't ship a file for a page → the loader uses `themes/default/<page>.js` (registry lists which pages each theme implements).
- A theme **may omit a section** (e.g. Retro shows no difficulty chart) — it simply doesn't render that part of the hook result. It **may not omit a tab**: every id in `tabs.available` must render something, because the mobile nav and links deep-link to `?tab=…`. If a theme really can't do a tab, it renders a themed "not available in this theme" panel with a link that switches to Default.
- Modals (game achievements, compare) are part of the page and must be themed.

### 4.5 The "default first" rule

- New features and fixes **land in Default first**. Other themes catch up later and may lag.
- Every new core field gets a line in the theme parity table (§9, end) so lag is visible.
- Data/behaviour bugs are fixed once in core/selectors and fix every theme.
- A new theme only starts when the previous one fully covers Profile + Game (loading, empty, error, modals, visitor mode, mobile).

---

## 5. Loading, picking and storing a theme

### 5.1 Storage

- Key: `localStorage.raTheme` — camelCase like the existing `raCredentials` / `raDebugMode`. It is **not** an `ra_*` key, so **Refresh Data doesn't reset it**. Log Out keeps it too (it's a device preference, not account data). Purge Cache keeps it (localStorage untouched).
- Value: a registry id. Missing, unknown or throwing storage (private mode) → `default`.
- Optional URL override for testing and sharing screenshots: `?theme=retro` wins over storage for that page load only (not saved).

### 5.2 Loader

`themes/loader.js` is plain JS, loaded **synchronously in `<head>` before Babel**, with the page name as an attribute:

```html
<script src="../themes/registry.js"></script>
<script src="../themes/loader.js" data-page="profile"></script>
<!-- Babel standalone after this -->
```

What it does:

```js
(function () {
  var page = document.currentScript.dataset.page;
  var base = new URL('../themes/', document.currentScript.src).href; // works on any host
  var reg = window.CT_THEMES;
  var id = 'default';
  try { id = new URLSearchParams(location.search).get('theme') || localStorage.getItem('raTheme') || 'default'; } catch (e) {}
  if (!reg[id]) id = 'default';
  var viewTheme = reg[id].pages.indexOf(page) >= 0 ? id : 'default';
  document.documentElement.dataset.theme = id;          // chrome styling keys off this
  document.documentElement.dataset.viewTheme = viewTheme;
  var css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = base + id + '/theme.css';
  document.head.appendChild(css);
  (reg[id].fonts || []).forEach(function (href) { /* append <link> for Google Fonts */ });
  var s = document.createElement('script');
  s.type = 'text/babel'; s.setAttribute('data-type', 'module');
  s.src = base + viewTheme + '/' + page + '.js';
  // Runs in <head> before DOMContentLoaded, so Babel sees this tag when it scans the page.
  document.write(s.outerHTML); // or document.head.appendChild(s) — see notes below
})();
```

Implementation notes to verify in Phase 1:
- Babel standalone scans `script[type="text/babel"]` on `DOMContentLoaded`. The view script must exist in the DOM **before** that event. Since the loader runs in `<head>` (no body yet), either `document.write` the tag (simplest, synchronous, fine for same-origin) or append it to `<head>`. Pick whichever Babel picks up reliably; test both.
- The chrome CSS link is added synchronously in `<head>`, so there's no flash of the wrong theme for chrome.
- The theme's `theme.css` also carries the page background so the first paint matches the theme (today it's inline `#171a21`).
- A `<noscript>`-free failure path: if the theme's view file 404s (e.g. offline and not cached), Babel logs an error and the page stays blank. The loader sets a 4-second timer; if `#root` is still empty and a Babel/network error was seen, it reloads with `?theme=default` once (guard with sessionStorage to avoid loops).

### 5.3 Import-map alias

Add to every themed page's import map:

```json
"@ct/": "../"
```

So every theme file imports `@ct/profile/core.js`, `@ct/profile/utils/helpers.js`, `@ct/assets/ui.js` regardless of where the theme file lives. Existing relative imports keep working.

### 5.4 Registry

```js
// themes/registry.js — plain JS, no modules (read by loader.js, mobile-nav.js and ui.js)
window.CT_THEMES = {
  default: { name: 'Default',            pages: ['profile','game'], swatch: ['#1b2838','#66c0f4','#e5b143'], fonts: [] },
  retro:   { name: 'Retro',              pages: ['profile','game'], swatch: ['#1c2b8f','#ffffff','#f8d030'], fonts: ['https://fonts.googleapis.com/css2?family=DotGothic16&display=swap'] },
  ffxvi:   { name: 'Final Fantasy XVI',  pages: [],                 swatch: […], fonts: […] },
  so2r:    { name: 'Star Ocean 2R',      pages: [],                 swatch: […], fonts: […] },
  arise:   { name: 'Tales of Arise',     pages: [],                 swatch: […], fonts: […] },
};
window.CT_THEME_ORDER = ['default','retro','ffxvi','so2r','arise'];
```

A theme with `pages: []` is hidden from the picker (lets unfinished themes be merged safely). `name` uses the game's name only as a description of the style; no logos.

### 5.5 Picker

- **Mobile:** new row in the Menu sheet (`assets/mobile-nav.js`), under Refresh Data / Purge Cache: "Theme · Retro" → opens a sub-sheet listing themes, each with a 3-color swatch, the name and a check on the active one.
- **Desktop:** new entry in `MenuDropdown` (`assets/ui.js`) with the same list.
- Selecting: save `raTheme`, reload the page (simplest; guarantees a clean Babel run). Keep scroll position? No — reload to top is acceptable.
- The picker is **hidden while only Default is visible** (all other themes `pages: []`).
- Later (optional): a small preview image per theme (`themes/<id>/preview.png`, our own screenshot of our own site).

---

## 6. Shared chrome, fonts, service worker

### 6.1 Chrome CSS variables

Shared chrome keeps one implementation but reads variables. `themes/base.css` defines Default values; each `theme.css` overrides them under `:root[data-theme="<id>"]`.

| Variable | Default | Used by |
|---|---|---|
| `--ct-page-bg` | `#171a21` | `body`, `index.html` |
| `--ct-surface` | `#1b2838` | nav bar, sheet, dropdown, topbar |
| `--ct-surface-2` | `#202d39` | sheet rows, hover |
| `--ct-surface-3` | `#131a22` | topbar, FABs |
| `--ct-border` | `#2a475e` | nav top border, sheet, dropdown |
| `--ct-border-inset` | `#101214` | inset borders |
| `--ct-text` | `#c6d4df` | chrome labels |
| `--ct-text-2` | `#8f98a0` | secondary labels |
| `--ct-text-mute` | `#546270` | inactive nav items |
| `--ct-accent` | `#66c0f4` | links, focus |
| `--ct-active` | `#e5b143` | active nav item (replaces `--mnav-color` default) |
| `--ct-danger` | `#ff6b6b` | Log Out, errors |
| `--ct-radius` | `3px` | chrome corners |
| `--ct-font` | `'Segoe UI', Arial, sans-serif` | chrome font |
| `--ct-shimmer-a` / `--ct-shimmer-b` | `#1b2838` / `#2a3f52` | `.shimmer` |
| `--ct-frame` | `none` | optional `border-image`/ornament for sheet and dropdown |

Chrome keeps its layout (bottom nav, sheet, topbar) in every theme; themes restyle it, they don't move it. That keeps navigation muscle memory and avoids five nav implementations.

### 6.2 Fonts

- Loaded by the loader from `registry.fonts` (Google Fonts only; `display=swap`).
- Each theme sets `--ct-font` and its own heading font in `theme.css`.
- Pixel fonts: set `-webkit-font-smoothing: none` only on pixel text; keep sizes on the font's native grid (e.g. 16px multiples for DotGothic16) to avoid blur.

### 6.3 Service worker

Options (decide in Phase 1):
1. **Keep cache-first**, add `themes/registry.js`, `themes/loader.js`, `themes/base.css` and `themes/default/*` to `PRECACHE`; other themes get cached on first use via a runtime cache rule for `/themes/`. Bump `CACHE_NAME` on every theme file change (already the rule today).
2. **Switch static assets to stale-while-revalidate** (what gaming-hub did): deploys show up on the next load without bumps. Recommended — with 5 themes the manual bump gets easy to forget.

Either way: switching theme while **offline** to a theme never loaded before fails; the loader fallback (§5.2) returns to Default.

---

## 7. Semantic colors every theme must map

Themes change colors freely, **but meanings must stay distinguishable and consistent inside a theme**. Each theme's `theme.css` / view defines these tokens:

| Meaning | Default | Rule |
|---|---|---|
| Mastered / Completed | gold `#e5b143` | the theme's "best" color |
| Beaten (hardcore) | `#8f98a0` → see note | second tier, clearly below mastered |
| Beaten (softcore) | `#8f98a0` | may equal beaten |
| In progress | blue `#66c0f4` | |
| Not started / locked | `#323f4c` | |
| HC unlock stripe | gold | same as mastered is fine |
| SC unlock stripe | gray | |
| Progression / Win condition / Missable | gold / `#ff6b6b` / `#ff9800` | icons carry the meaning too |
| Rarity bands (5) | `#8f98a0`, `#66c0f4`, `#e8813c`, `#f5e08f`, `#c94040` | separated by **lightness**, not only hue |
| Tilde tags (Hack/Homebrew/Demo/Prototype) | `#ff6b6b` / `#66c0f4` / `#57cbde` / `#8f98a0` | |
| Own user / friend in the feed | cyan `#57cbde` / gold | |

Note: cheevo-tracker's docs say Beaten is gray `#8f98a0`; gaming-hub standardized Beaten as silver `#b8c4ce`. Keep cheevo-tracker's own convention unless decided otherwise.

**Validation:** every theme's rarity and status palette is checked with the `dataviz` skill's `scripts/validate_palette.js` against that theme's card surface (as `docs/pages/profile.md` requires for Default), including CVD separation. Pixel/retro themes with few colors still need distinct lightness steps.

---

## 8. Theme specs

Every theme spec lists: mood, tokens, fonts, component mapping, Profile layout (desktop + phone), Game layout (desktop + phone), motion, and what's hard. FFXVI, SO2R and Arise tokens are **provisional** until reference screenshots are reviewed (§8.6).

### 8.1 Default

Today's UI, moved into `themes/default/`. It stays the reference implementation and the fallback. The only visual change allowed during the split is none.

### 8.2 Retro — generic 16-bit JRPG (fully specified, no references needed)

**Mood:** a SNES-era RPG menu. Blue gradient windows with a white bevelled border, white pixel text, a pointing-hand cursor, everything in windows on a black field.

**Tokens (provisional values, tune on build):**

| Token | Value | Use |
|---|---|---|
| `--rt-field` | `#000000` | page background |
| `--rt-win-top` / `--rt-win-bottom` | `#2c3cc4` / `#0c1260` | window vertical gradient |
| `--rt-border-hi` / `--rt-border-lo` | `#f8f8f8` / `#8888a8` | 2-tone bevel (outer light, inner shade) |
| `--rt-text` | `#ffffff` | text |
| `--rt-text-dim` | `#9ca0c8` | disabled/secondary |
| `--rt-gold` | `#f8d030` | mastered, HC, points |
| `--rt-silver` | `#c8d0d8` | beaten |
| `--rt-cyan` | `#58d8f8` | in progress, own user |
| `--rt-red` | `#f85858` | errors, hack tag, win condition |
| `--rt-locked` | `#50548c` | locked/not started |

- **Fonts:** DotGothic16 (Google Fonts) for everything; readable at 16px, includes Japanese. Headings the same font, larger (24/32px), no bold (pixel fonts don't bold well). Numbers right-aligned in fixed columns like RPG stat screens.
- **Window component:** `border-radius: 6px`, 3px light border + 1px inner dark line (two box-shadows), gradient fill, 12–16px padding. Title (when any) is plain text inside the window's first line, not a header bar.
- **Cursor:** a pixel pointing hand drawn as inline SVG (our own), placed left of the selected row, gently bobbing 2px (CSS keyframes, `prefers-reduced-motion` → static).
- **Images:** RA badges/icons are pixel art — render with `image-rendering: pixelated` at integer multiples (64 → 64 or 128).
- **Bars:** progress bars as segmented pixel bars (HP/MP style): dark track, gold/cyan fill, 1px light top edge.
- **Motion:** windows open with a quick vertical scale (80ms), no fades. No other animation.

**Concept mapping:**

| App concept | Retro element |
|---|---|
| User header (avatar, name, rank, points) | Party status window: portrait left; name; **Rank**, **Points**, **HC points** as labelled stat lines ("PTS 12,345", "RANK #4,120") — no invented "level" |
| Tabs | Command window: vertical list (Games, Progress, Series, Activity, Backlog, Social, Stats) with the hand cursor on the active one |
| Game list | Item list window: icon, name, `12/40`, small segmented bar |
| Game achievements modal | Full-screen window stack: game window on top, achievement list left, detail window right |
| Achievement row | List line: badge, title, points right-aligned; locked = dimmed text and grayscale badge, real description kept (hiding it would remove information) |
| Heatmap | Grid of 1-tile squares inside a window, 4 intensity steps of gold |
| Stats cards | Separate small windows ("Streak", "Active days") in a grid |
| Loading | "Now loading…" text with blinking cursor instead of shimmer |
| Empty | "Nothing here." in a window |
| Error | Red-bordered window with the message and "Retry" as a command |

**Profile — desktop (≥ 1024px):**

```
┌───────────────────────────────┐ ┌────────────────────────────────────────────┐
│ [avatar] YOZURYU               │ │ ☞ Games                                    │
│          RANK  #4,120          │ │   Progress                                 │
│          PTS   12,345          │ │   Series                                   │
│          HC    9,876           │ │   Activity                                 │
│ Mastered 12  Beaten 30         │ │   Backlog / Social / Stats                 │
└───────────────────────────────┘ └────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────────┐
│ Active tab content in one big window (lists paged or scrolled — see below)     │
└────────────────────────────────────────────────────────────────────────────────┘
```

- Lists **scroll** inside the page (not paged) on desktop and phone — paging long lists feels authentic but is slower to use; keep scroll, keep the cursor on hover.
- Tablet (768–1023): status and command windows side by side, narrower.

**Profile — phone (390px):** status window full width (portrait + 3 stat lines), command window becomes a **horizontal scrolling row of commands** inside a window (active one with the cursor), content window below. Bottom nav stays (restyled).

**Game — desktop:**

```
┌────────────────────────────────────────────────────────────────────────┐
│ [box art] Title · Console          24/40 ACH   210/400 PTS   ★ MASTERED │
└────────────────────────────────────────────────────────────────────────┘
┌───────────────┐ ┌─────────────────────────────────┐ ┌───────────────────┐
│ ☞ Achievements│ │ ☞ [b] Achievement name     10   │ │ [badge 128px]      │
│   Info        │ │   [b] Achievement name     25   │ │ Name               │
│   Leaderboards│ │   [b] Achievement name      5   │ │ Description …      │
│   Community   │ │   …                             │ │ PTS 10  RARE 7.2%  │
│   Hashes      │ │                                 │ │ Unlocked 2026-…    │
└───────────────┘ └─────────────────────────────────┘ └───────────────────┘
```

- Filters (all/unlocked/locked, type, sort) as a small command window above the list.
- Friend compare: extra column in the list with the friend's badge; picker is a window list of followed users.

**Game — phone:** header window, command row (horizontal), list window; tapping a row opens the detail window as a bottom sheet (window style).

**What's hard:** getting DotGothic16 crisp at every size; the heatmap and Stats charts in a pixel style (use blocky bars, no smooth line — the 4-week mean line becomes stepped).

### 8.3 Final Fantasy XVI (provisional — confirm with screenshots)

**Mood:** cinematic, dark, calm. Near-black with translucent panels, thin light rules, big serif titles, generous empty space. Information-dense screens (Active Time Lore) that still feel airy.

| Token | Provisional | Use |
|---|---|---|
| `--fx-bg` | `#0c0c0e` + subtle radial vignette | page |
| `--fx-panel` | `rgba(20,20,24,.72)` | panels |
| `--fx-rule` | `rgba(255,255,255,.14)` | 1px dividers (thin lines are *the* style here) |
| `--fx-text` / `--fx-text-2` | `#ece6da` / `#9d978c` | text |
| `--fx-accent` | `#c8a25a` | selected row, mastered |
| `--fx-cool` | `#7fa7c9` | in progress |

- **Fonts:** display serif **Cinzel** or **Cormorant Garamond** (titles, section names, big numbers), body **Noto Sans** / **Inter** at 14–15px. Uppercase letter-spaced small labels.
- **Selection:** a soft horizontal light band behind the selected row plus a small diamond marker; no boxes.
- **Game page ≈ Active Time Lore:** narrow list column left (achievements grouped by type/progression), large detail area right with a big serif title, description, stats in a thin-ruled table, badge image framed small.
- **Profile ≈ character screen:** large avatar left third, name in big serif, stats as a thin-ruled two-column table; tabs as a top row of spaced uppercase words with the active one underlined by a short rule.
- **Phone:** single column; list first, detail as a full-screen slide-over with a back chevron.
- **Hard:** restraint — resist adding boxes; the look is mostly typography and spacing.

### 8.4 Star Ocean: The Second Story R (provisional — needs screenshots)

**Mood:** classic sci-fi JRPG menus remade in HD-2D style; framed windows over a softly blurred background.

- **Concept mapping:** achievements = **Battle Trophies** style list (number, name, condition, reward-like points), profile = character status screen (portrait, level-like rank, stat lines), game list = item/skill list with category tabs.
- **Tokens, fonts, window style:** define from screenshots (menu colors, frame shape, cursor style, category tabs).
- **Hard:** distinguishing it enough from Retro (both are JRPG windows). The difference must come from the remake's modern frames, gradients and typography, not from pixel styling.

### 8.5 Tales of Arise (provisional — needs screenshots)

**Mood:** elegant and painterly; soft textures, refined serif/sans pairing, delicate ornaments and thin frames.

- **Concept mapping:** achievements = **Titles** list with detail pane (title name, description, "skills" → points/rarity), game list = collectibles/artes list, profile = character page with a large portrait and stat block.
- **Tokens, fonts, textures:** define from screenshots. Textures must be our own (CSS gradients/noise, or self-made SVG), never extracted from the game.
- **Hard:** the painterly feel. CSS alone can look cheap; budget time for a small hand-made SVG ornament set and a subtle paper/watercolor background made from gradients + noise.

### 8.6 Reference screenshots needed (from the user)

For FFXVI, SO2R and Arise each:

1. Main/pause menu (top level)
2. Character status screen
3. A **long list** with a detail pane — FFXVI *Active Time Lore*, SO2R *Battle Trophies* (and skills/items), Arise *Titles* (and collectibles)
4. A confirm/dialog box
5. A tab/category bar and how the selected tab looks
6. Any screen with a progress/percentage display
7. Both a light and a busy background behind a menu, if the game has both

Screenshots are **references only**; they're never committed to the repo (keep them outside the repo or in an excluded folder).

---

## 9. Phases in detail

Each phase is one task, merges on its own, and leaves the site working.

### Phase 1 — Theme infrastructure (CHV-016)

**Goal:** everything needed to load a theme, with only Default available. No visual change.

Steps:
1. Decide the service-worker option (§6.3); implement it.
2. Add `themes/registry.js`, `themes/loader.js`, `themes/base.css`, `themes/default/theme.css`.
3. Profile and Game `index.html`: add registry + loader in `<head>` before Babel; add `"@ct/": "../"` to the import map; remove the direct `<script src="./app.js">` (the loader writes the view script). For Phase 1 the "default view" is still `profile/app.js` / `game/app.js` — the registry points Default at them until Phases 2–3 move the files.
4. Move `index.html` inline colors (`#171a21`, shimmer) to `--ct-*` variables.
5. Convert shared chrome (`mobile-nav.js`, `ui.js`, `pwa-install.js`) hex values to `var(--ct-*, <fallback>)`. Keep the fallback so pages without `base.css` (Achievement, Console, Search, Changelog) look unchanged — or include `base.css` on every page (preferred: one source of truth).
6. Picker UI in the Menu sheet and `MenuDropdown`, hidden while only Default is visible. Also support `?theme=` override.
7. Loader failure fallback (§5.2).
8. Docs: `CLAUDE.md` hard rules, `docs/rules.md`, `docs/architecture.md` (new "Themes" section), mark decision-007 accepted.

Checks: every page loads identically (screenshot compare desktop + 390px); `?theme=nonsense` → Default; storage blocked (private window) → Default; Refresh Data / Purge Cache / Log Out keep `raTheme`; offline reload still works.

### Phase 2 — Core/view split: Profile (CHV-017)

**Goal:** `profile/selectors.js` + `profile/core.js` + `themes/default/profile.js`; delete `profile/app.js`. Zero visual or behaviour change.

Steps (small commits, check after each):
1. Create `profile/selectors.js`; move pure computations one at a time, keeping signatures pure: progress buckets (from `App` render), `heatmapData`, ActivityTab's `dayMap`/`totals`/`timelineGroups`/`mergedFeed`/`feedGroups`/`feedBySession`/`feedByDay`, SeriesProgressTab `cards`, StatsTab `streaks`/`pace`/`acquisition`/`timeline`/`consoles`/`rarity`, CompareModal `sharedGames`/`sorted`, SocialTab sorting, RAchievementModal `filteredAchs`. Components call the selectors inside `useMemo` — behaviour identical.
2. Unit-check the selectors in Node against a saved `profileData` fixture (debug mode can dump one) — same outputs before/after.
3. Create `profile/core.js` with `useProfilePage()`; move `App`'s state, effects and actions into it; lift data-affecting sub-component state (modal filters, compare/social sort, feed `groupMode`) into it.
4. `App` becomes `const page = useProfilePage();` + the existing JSX reading from `page.*`.
5. Move the whole view file to `themes/default/profile.js`, switch imports to `@ct/…`, point the registry at it, delete `profile/app.js`, update `sw.js` `PRECACHE`.
6. Update `docs/pages/profile.md` (new file layout, where state lives).

Checks: full QA checklist (§10) on Default; visitor mode `?u=`; every `?tab=`; friends feed streaming; backlog pagination; compare modal; game modal lazy fetch; Stats tab.

### Phase 3 — Core/view split: Game (CHV-018)

Same as Phase 2 for the Game page: `game/selectors.js` (`filteredSorted`, `difficulty`, totals, `friendAchMap`, POC glue), `game/core.js` (`useGamePage()`, all 8 effects, per-tab lazy loads, friend compare flow incl. the `ra_fg_*` session cache, comment paging, leaderboard expansion), `themes/default/game.js`; delete `game/app.js`. Fix `docs/pages/game.md` (lazy loading per tab, `details` id). Do CHV-014 first or drop it.

Checks: every tab incl. POC on a POC subset (`?id=22862&tab=poc`), friend compare, comments "load more", leaderboard expand, subset → parent link, hashes.

### Phase 4 — Retro theme (CHV-019)

1. Confirm: generic 16-bit look vs one specific game (§13).
2. `themes/retro/theme.css`: tokens, window, cursor, bars, chrome overrides (§6.1), pixel font setup.
3. Palette validation (§7).
4. `themes/retro/profile.js`: status + command windows, every tab, both modals, loading/empty/error, visitor mode, phone layout.
5. `themes/retro/game.js`: header window, command list, list + detail, filters, friend compare, leaderboards, community, hashes, POC accordion as nested windows.
6. Registry: `pages: ['profile','game']` → picker appears.
7. Changelog, `docs/` note for the theme.

Checks: §10 in Retro; switching Default ↔ Retro keeps the same tab/filters via URL.

### Phase 5 — Final Fantasy XVI (CHV-020)

Prereq: screenshots reviewed, §8.3 tokens/fonts confirmed and written into this doc. Then same steps as Phase 4 with §8.3.

### Phase 6 — Star Ocean 2R (CHV-021)

Prereq: screenshots; write §8.4 tokens, fonts, frames, cursor, layouts (desktop + phone) into this doc first. Then same steps as Phase 4.

### Phase 7 — Tales of Arise (CHV-022)

Prereq: screenshots; write §8.5 in full, including the ornament/texture plan, before building. Then same steps as Phase 4.

### Theme parity table (keep updated)

| Feature (core field) | Default | Retro | FFXVI | SO2R | Arise |
|---|---|---|---|---|---|
| Profile: all 7 tabs | ✅ | | | | |
| Profile: game modal | ✅ | | | | |
| Profile: compare modal | ✅ | | | | |
| Profile: visitor mode | ✅ | | | | |
| Game: 5 tabs + POC | ✅ | | | | |
| Game: friend compare | ✅ | | | | |
| Game: difficulty curve | ✅ | | | | |

---

## 10. QA checklist (every split and every theme)

**Viewports:** 1440 desktop, 1024 tablet, 390 phone, 320 narrow phone. No horizontal page scroll, 12px+ gutter on phones.

**Profile:** own profile and `?u=<other user>`; each `?tab=` deep link; loading skeleton; profile fetch error; auth error → redirect to login; game modal open/close + lazy achievements + filters; compare modal; Progress buckets and search; Series tab visible only with series; Activity mine + friends (loading, streaming, failed friend, refresh); heatmap day select; Backlog search/filter/group/paging/refresh; Social following/followers/sort/refresh; Stats (own profile only).

**Game:** each tab; POC page; filters and sort; friend compare select/clear; comments load more; leaderboard expand; subset/parent link; missing images fallback.

**Chrome:** bottom nav active state per tab; Menu sheet (all rows); desktop dropdown; debug FAB; PWA install prompt; scroll-to-top.

**Theme mechanics:** switch theme from both pickers; `?theme=` override; unknown id; storage blocked; offline + uncached theme → fallback to Default; Refresh Data / Purge Cache / Log Out keep the theme; pages without a theme file render Default.

**Accessibility:** text contrast ≥ 4.5:1 for body text; focus visible on every interactive element; `prefers-reduced-motion` disables cursor bob/animations; images keep `alt`.

**Performance:** only the active theme's JS/CSS/fonts are requested (check the network tab); Babel transpile time of the theme file roughly ≤ today's `app.js`.

**Legal/style:** no game assets, logos or commercial fonts in the diff.

Screenshots of each checked state go in the task notes (not the repo).

---

## 11. Rules and docs that change

| Where | Today | After |
|---|---|---|
| `CLAUDE.md` hard rules | "All components for a page live in one `app.js`" | "Themed pages: logic in `<page>/core.js` + `selectors.js`; markup in `themes/<id>/<page>.js`. Other pages: one `app.js`." |
| `CLAUDE.md` hard rules | "No CSS files" | "Only `themes/base.css` and one `theme.css` per theme." |
| `CLAUDE.md` | — | "Default first" rule; views never call `ra-api.js`; themes use no game assets |
| decision-003 | accepted | partially superseded by decision-007 |
| `docs/architecture.md` | — | Themes section: loader, registry, storage, import alias, SW |
| `docs/rules.md` | Design system = Default colors | Design system per theme; semantic color table (§7) |
| `docs/pages/profile.md`, `game.md` | single `app.js` | core/selectors/views layout; where each state lives |
| `changelog.md` | — | entries under `Structure` (phases 1–3) and `Polish` or a new `Themes` section (phases 4–7; a new section needs `SECTION_ORDER`/`SECTION_COLORS` in `changelog/app.js` and `docs/pages/changelog.md`) |

---

## 12. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Babel doesn't pick up a script added by the loader | Blank page | Prototype the loader first in Phase 1 (both `document.write` and `appendChild`); keep the fallback timer |
| Split introduces subtle behaviour changes | Bugs in Default | Selectors first with fixture comparisons; small commits; full QA after each step |
| Themes fall behind Default | Inconsistent features | "Default first" rule + parity table; a theme may show "not available" panels |
| Five themes × maintenance | Slower feature work | Build themes one at a time; stop after any phase if it isn't worth it |
| Cache-first SW serves stale theme files | Old theme after deploy | Switch to stale-while-revalidate (§6.3) or strict `CACHE_NAME` bumps |
| Pixel/serif fonts hurt readability of long lists | Poor UX | Minimum sizes per theme (Retro 16px, others 14px body); test with the longest real sets |
| Look too close to a game's UI | Legal/ethics | Style-inspired only; own ornaments; no assets, logos, commercial fonts |
| Theme switch loses place | Annoying | Tabs, filters and search live in core + URL where already in URL; reload keeps URL |
| In-browser Babel slower with more code | Slower first load | Only one theme file loads; keep each theme file ≤ today's `app.js` size |

---

## 13. Open questions

1. ~~**Retro:** generic 16-bit JRPG or a specific game?~~ **Decided 2026-09-27: generic 16-bit JRPG** (§8.2).
2. **Service worker:** switch to stale-while-revalidate (recommended) or keep cache-first with bumps?
3. **CHV-014 (Game desktop single-page layout):** do before Phase 3, or drop?
4. **Changelog section:** log theme work under existing sections, or add a `Themes` section?
5. ~~**Theme names in the picker:** game names or neutral names?~~ **Decided 2026-09-27: game names** ("Final Fantasy XVI", "Star Ocean 2R", "Tales of Arise", plus "Retro" and "Default"), as in the registry (§5.4). Names only, never logos.
6. **Later pages:** after Phase 7, theme Achievement/Console/Search too, or keep them Default forever?

---

## 14. Rough effort

Measured in focused working sessions (a session ≈ a few hours):

| Phase | Effort | Notes |
|---|---|---|
| 1 Infrastructure | 2–3 sessions | Loader prototype is the risky part |
| 2 Profile split | 4–6 sessions | The biggest refactor; 4k lines, many effects |
| 3 Game split | 2–3 sessions | |
| 4 Retro | 4–6 sessions | All Profile tabs + modals + Game, 2 layouts each |
| 5 FFXVI | 4–6 sessions | + screenshot review |
| 6 SO2R | 5–7 sessions | + screenshot review, differentiate from Retro |
| 7 Arise | 6–8 sessions | + ornaments/textures |

Phases 1–3 (≈ 8–12 sessions) deliver no visible feature but make the code easier to work in. Each theme after that is roughly the size of building the Profile + Game UI again.
