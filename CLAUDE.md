# cheevo-tracker — Project Context for Claude

## Working Style

- **Be honest with opinions.** When asked for a preference or recommendation, give a direct, genuine answer — not a diplomatic non-answer.
- **Push back before implementing bad ideas.** If asked to add or change something that seems like a poor UX, visual, or technical decision, say so clearly and explain why before doing it. Do not silently implement something you think is wrong — always confirm first.
- **Discuss before building when uncertain.** For UI/UX decisions especially, a short discussion upfront saves rework.

---

Personal RetroAchievements profile tracker. Static site with no build tool — React, Tailwind, and Lucide loaded via CDN. All RA data is fetched live from the RetroAchievements API using credentials stored in the user's browser (no pipeline, no backend).

---

## Directory Structure

```
cheevo-tracker/
├── index.html                      # Login page (redirects to /profile/ if already authed)
├── login.js                        # Login React app
├── manifest.json                   # PWA manifest
├── sw.js                           # Service worker (cache-first static, pass-through RA API)
├── changelog.md                    # Project changelog (Markdown, parsed by changelog app)
├── CLAUDE.md                       # This file
│
├── assets/
│   ├── mobile-nav.js               # Shared bottom nav bar, injected via <script>
│   ├── avatar.png                  # User avatar
│   ├── icon-192.png / icon-512.png # PWA icons
│   └── icon-ra.png
│
├── profile/
│   ├── index.html                  # RA profile page HTML
│   ├── app.js                      # RA profile React app (~2150 LOC)
│   └── utils/
│       ├── ra-api.js               # RA API client: fetches live data, maps PascalCase → camelCase
│       ├── constants.js            # MEDIA_URL, SITE_URL, TILDE_TAG_COLORS
│       ├── helpers.js              # formatTimeAgo, formatDate, getMediaUrl, parseTitle
│       └── transform.js            # Merges raw API data into UI shape (do not bypass)
│
└── changelog/
    ├── index.html
    └── app.js
```

---

## Auth Flow

Credentials are stored in `localStorage` as `raCredentials = { username, apiKey }`.

- **Login page** (`/index.html` + `login.js`): collects username + API key, validates with `API_GetUserProfile`, stores on success, redirects to `/profile/`.
- **Profile page**: on mount, calls `getCredentials()`. If null → `handleAuthError()` → clears localStorage → `window.location.replace('../')`.
- **Any RA API call** that returns `AUTH_ERROR` also triggers `handleAuthError()`.
- The RA API key is found at [retroachievements.org/settings](https://retroachievements.org/settings).

---

## Data Flow

All data is fetched live from `https://retroachievements.org/API/`. No static JSON files. No pipeline.

### On mount (parallel)
1. `API_GetUserProfile` → `coreProfile`
2. `API_GetUserSummary?g=20&a=5` → `userSummary`, `recentlyPlayedGames`, `mostRecentGame`, `mostRecentAchievement`
3. `API_GetUserCompletionProgress` (paginated, 500/page) → `gameAwardsAndProgress`
4. `API_GetUserAwards` → `pageAwards`
5. `API_GetAchievementsEarnedBetween` (last 91 days) → pre-populates chunk 0 + computes `points7Days`/`points30Days`

### Lazy loads
- **Watchlist tab opens** → `API_GetUserWantToPlayList` (paginated, 100/page)
- **Activity tab scroll** → additional 91-day achievement chunks (indices 1–3) via `API_GetAchievementsEarnedBetween`
- **Game modal opens** (if achievements not yet loaded) → `API_GetGameInfoAndUserProgress` → updates `gamesData.detailedGameProgress[gameId]`

### Data assembly (`rawData` memo)
```javascript
{
  ...profileData,          // from fetchProfile()
  wantToPlayList,          // from fetchWatchlist(), null until watchlist tab opens
  recentAchievements: [],  // not used directly; achievements handled via achievementChunks
  detailedGameProgress,    // lazy-populated per game
}
```
This is passed to `transformData()` from `utils/transform.js`, which merges everything into `{ profile, games, backlog }`.

### Heatmap
Computed via `useMemo` from `achievementChunks` (no separate file). Format: `{ "YYYY-MM-DD": { count, points } }`.

### `ra-api.js` mapping
Raw RA API responses use PascalCase (`GameID`, `NumAwarded`, etc.). `ra-api.js` maps these to the camelCase shape expected by `transform.js`. Do not access raw API responses directly from `app.js`.

---

## Profile Page (`profile/app.js`)

### Tabs
Five tabs: **Recent Games** (Clock) · **Completion Progress** (BarChart2) · **Series Progress** (Layers) · **Activity** (Activity) · **Watchlist** (Star)

- Series tab only renders if `seriesData.some(s => s.showProgress)` — with no `series.json`, it never shows
- Tab state persists in URL: `?tab=progress`
- Floating pill (mobile): appears when natural tab bar scrolls off screen; animated via `slideUpPill`/`slideDownPill`

### Game achievement modal
`openGameDetails(game)` is passed as `onViewDetails` to `GameCard`. It:
1. Calls `setSelectedGame(game)` immediately (modal opens)
2. If `game.achievements` is empty, fetches `API_GetGameInfoAndUserProgress`
3. Updates `gamesData.detailedGameProgress[gameId]` → triggers `rawData` memo → `transformData` re-runs → modal receives enriched game from `ALL_GAMES.find(g => g.id === selectedGame.id)`
4. Modal shows shimmer skeleton while `loadingGameDetailId === selectedGame.id`

### Topbar
Has a **Log out** button (right side) that calls `clearCredentials()` + redirects to `../`.

---

## Mobile / PWA

### Bottom navigation (`assets/mobile-nav.js`)
Self-contained IIFE. Visible only on screens < 768px. **Two tabs only**: Profile (`/profile/`) and Log (`/changelog/`).
- `BASE` derived from `document.currentScript.src`
- Injects CSS: hides `.page-topbar` and `footer` on mobile, adds `padding-bottom` to body, repositions `.scroll-top-btn`

### PWA
- `manifest.json` scope: `./` (relative, works on any host)
- Service worker: cache-first for same-origin static assets; cross-origin requests (RA API) pass through untouched
- `changelog.md` uses network-first so it's always fresh

### Page headers (mobile)
All page headers use `pt-8 pb-5 md:pt-5` — extra top padding compensates for the hidden breadcrumb. Apply to any new pages.

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| UI framework | React 18.2 | Via CDN (`esm.sh`), no build step |
| Styling | Tailwind CSS | Via CDN, arbitrary values used heavily |
| Icons | Lucide React 0.263.1 | Via CDN |
| JS transform | Babel standalone | Transpiles JSX in-browser |
| Hosting | GitHub Pages | Static files |

No bundler, no npm for the frontend, no TypeScript. All frontend files are plain `.js` (JSX transpiled in-browser by Babel).

---

## Code Conventions

### Styling
- **Tailwind className** for fixed/structural styles
- **Inline `style={{}}`** for dynamic values (colors from data, animation delays)
- **`<style>` tag with `@keyframes`** for CSS animations — injected inside the React return
- Arbitrary Tailwind values used extensively: `text-[11px]`, `w-[140px]`, `tracking-[0.07em]`

### Component patterns
- All functional components with hooks (`useState`, `useEffect`, `useMemo`, `useRef`)
- `useMemo` used aggressively for derived data
- All components for a page live in one `app.js` — no separate component files
- Sub-components defined at module level, not inline

### Data flow
- Data fetched on mount with `useEffect` + `fetchProfile()` from `ra-api.js`
- Loading skeletons shown while data is `null`/loading
- Chunk-based lazy loading via `IntersectionObserver` with a sentinel `ref` at the bottom of the list

### RA title parsing
RA game titles use special syntax handled by `parseTitle()` in `utils/helpers.js`:
- `~Tag~` prefix → tag badge (Homebrew, Demo, Prototype, Hack)
- `[Subset - Name]` suffix → subset game; extract parent title and subset name

---

## Design System

### Color palette
```
Background:        #171a21   (page bg)
Card bg:           #1b2838   (primary card)
Card bg darker:    #202d39   (secondary card, hover)
Card bg dark:      #131a22   (topbar, FAB buttons)
Border:            #2a475e   (standard border)
Border dark:       #101214   (inner/inset border)
Text primary:      #c6d4df
Text secondary:    #8f98a0
Text muted:        #546270

RA gold:           #e5b143
Cyan accent:       #57cbde
Blue:              #66c0f4
```

### Completion status colors
- Mastered: `#e5b143` (gold)
- Beaten: `#8f98a0` (gray)
- In Progress: `#66c0f4` (blue)
- Not started / border: `#323f4c`

### Stat number colors
- Gold `#e5b143` — earned value: Points, Mastered
- White `#c6d4df` — identity: Rank
- Blue `#66c0f4` — engagement: Achievements
- Gray `#8f98a0` — lesser tier: Beaten
- Muted `#546270` — context/breadth: Games

### Tilde tag colors
- Hack: red `#ff6b6b`
- Homebrew: blue `#66c0f4`
- Demo: cyan `#57cbde`
- Prototype: gray `#8f98a0`

### Typography
- Font: `'Segoe UI', Arial, sans-serif`
- Sizes: 7–15px (very compact, dashboard-style)
- Labels: `uppercase tracking-[0.07em]` or `tracking-[0.1em]` with `font-semibold`
- Border radius: mostly 2–3px (sharp, minimal)

### Section headers
Consistent pattern:
```jsx
<span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
<span className="text-[13px] text-white tracking-wide uppercase font-medium">Title</span>
```
RA sections use `#e5b143` (gold). Blue `#66c0f4` used for activity/engagement sections.

### Shimmer skeleton
Defined in each `index.html` `<style>` block. Class name: `.shimmer`. Used on loading placeholders.

### Scroll-to-top button
Rounded FAB: `w-10 h-10 rounded-full bg-[#131a22] border border-[#2a475e] active:scale-90`. Has class `scroll-top-btn` so `mobile-nav.js` can reposition it above the nav bar.

---

## Changelog Convention

**Always update `changelog.md` after making any code changes.** Every feature, fix, or improvement must be logged — do not wait for the user to ask.

Version format: `## vYY.MM.DD` (e.g. `## v26.04.11`). **If an entry for today's date already exists, add to it — never create a second `## vYY.MM.DD` header for the same date.** Check the top of `changelog.md` before adding a new header.

Structure:
- One-line summary after the version
- `### SectionName` subsections matching the area changed
- Bullet points per change, technical but readable

Section order: RetroAchievements, Auth, Structure.
