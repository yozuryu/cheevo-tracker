# Profile Page

**File:** `profile/app.js` (~2150 LOC)  
**URL:** `/profile/` (own profile) · `/profile/?u=<username>` (visitor mode)  
**Auth required:** Yes

## Tabs

| Tab | Icon | URL param | Notes |
|---|---|---|---|
| Recent Games | Clock | `?tab=games` | Default |
| Completion Progress | BarChart2 | `?tab=progress` | |
| Series Progress | Layers | `?tab=series` | Hidden if no series with `showProgress` |
| Activity | Activity | `?tab=activity` | Lazy-loads achievement chunks on scroll |
| Watchlist | Star | `?tab=watchlist` | Triggers `fetchWatchlist` on first open |

Tab state persists in URL query param. Floating pill (mobile) appears when tab bar scrolls off screen; animated via `slideUpPill`/`slideDownPill` CSS keyframes.

## Mount Sequence

5 parallel requests via `fetchProfile()`:

1. `API_GetUserProfile` → `coreProfile`
2. `API_GetUserSummary?g=20&a=5` → `userSummary`, `recentlyPlayedGames`, `mostRecentGame`, `mostRecentAchievement`
3. `API_GetUserCompletionProgress` (auto-paginated, 500/page) → `gameAwardsAndProgress`
4. `API_GetUserAwards` → `pageAwards`
5. `API_GetAchievementsEarnedBetween` (last 91 days) → pre-populates chunk 0 + computes `points7Days`/`points30Days`

## Lazy Loads

| Trigger | Fetch | State updated |
|---|---|---|
| Watchlist tab opens (first time) | `fetchWatchlist()` | `wantToPlayList` |
| Activity tab scroll (sentinel ref) | `fetchAchievementsChunk(u, k, idx)` idx 1–3 | `achievementChunks` |
| Game modal opens (achievements not yet loaded) | `fetchGameDetails(u, k, gameId)` | `gamesData.detailedGameProgress[gameId]` |

## `rawData` Memo

```js
rawData = {
  ...profileData,          // from fetchProfile()
  wantToPlayList,          // null until watchlist tab opens
  recentAchievements: [],  // not used directly
  detailedGameProgress,    // lazy-populated per game
}
```

Passed to `transformData()` → `{ profile, games, backlog }`.

## Heatmap

Computed via `useMemo` from `achievementChunks`. Format: `{ "YYYY-MM-DD": { count, points } }`. No separate file.

## Game Achievement Modal

`openGameDetails(game)` flow:
1. `setSelectedGame(game)` immediately — modal opens with shimmer
2. If `game.achievements` is empty → fetch `API_GetGameInfoAndUserProgress`
3. Update `gamesData.detailedGameProgress[gameId]` → `rawData` memo recomputes → `transformData` re-runs → modal receives enriched game via `ALL_GAMES.find(g => g.id === selectedGame.id)`
4. `loadingGameDetailId === selectedGame.id` controls shimmer skeleton

## Compare Modal

- Shows side-by-side completion progress between the authed user and another user.
- Leading side (higher %) gets `rgba(102,192,244,0.15)` background highlight on a 120×py-2.5 cell.
- Trailing side gets `transparent`.
- Divider between cells: `w-px self-stretch bg-[#2a475e]`.

## Visitor Mode

Triggered by `?u=<username>` query param. `isVisitorMode = !!targetUser`.

- `fetchProfile(creds.username, creds.apiKey, targetUser)` fetches the target user's data.
- Valid tabs restricted to `['recent', 'progress', 'series']` — backlog, activity, social are disabled.
- Tab bar always visible on all screen sizes (no floating pill).
- Header always visible regardless of active tab.
- Topbar breadcrumb shows visited username instead of "Log out" button.
- `document.title` updates to the visited user's username.

Link to visitor mode: `./profile/?u=<username>` (from within the app) or `../profile/?u=<username>` (from other pages).

## Topbar

Right side: **Log out** button (own profile) or username breadcrumb (visitor mode).

## Series Tab

Renders only if `seriesData.some(s => s.showProgress)`. With no `series.json`, tab never appears.

## Mobile

### Tab bar

On mobile (< 768px), the tab bar is **hidden** in authed mode (`hidden md:block`). It is replaced by the floating pill.

In visitor mode the tab bar is always visible (`block`) and sticks at `top-0` (no desktop Topbar offset).

### Floating pill (authed mode, mobile only)

Appears when `tabBarRef.current.getBoundingClientRect().bottom < 0` AND `window.innerWidth < 768`.

- State: `showFloatingTabs` / `pillLeaving`
- Enter: `slideUpPill` keyframe animation
- Exit: `slideDownPill` keyframe → 210ms delay → hide
- Each tab button: icon (`block md:hidden`) + 9px short label (`block md:hidden`); full text hidden on mobile

Do not render a floating pill for visitor mode — use the always-visible tab bar instead.

### Header visibility

When authed and **not** on the Recent tab, the header and the main two-column grid are hidden on mobile:

```jsx
className={`...${(!isVisitorMode && activeTab !== 'recent') ? ' hidden md:block' : ''}`}
```

The tab bar takes full-screen on non-Recent tabs on mobile.

### Stats panel

Right stats column hidden on mobile unless `statsExpanded`. Expand toggle button is `sm:hidden` (mobile only).

### Watchlist table

Certain columns carry `wl-hide-mobile` class and are hidden on mobile via a `<style>` rule.

### Heatmap

Short hint (`sm:hidden`) vs full hint (`hidden sm:block`) shown depending on screen width.

### Header layout

```jsx
<div className="flex flex-col md:flex-row items-center md:items-start gap-5">
  <div className="w-20 h-20 md:w-24 md:h-24 ...">  {/* avatar */}
  <div className="flex-1 flex flex-col gap-1.5 text-center md:text-left">
```
