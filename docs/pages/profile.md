# Profile Page

**File:** `profile/app.js` (~4090 LOC)  
**URL:** `/profile/` (own profile) · `/profile/?u=<username>` (visitor mode)  
**Auth required:** Yes

## Tabs

| Tab | Icon | URL param | Notes |
|---|---|---|---|
| Recent Games | Clock | `?tab=games` | Default |
| Completion Progress | BarChart2 | `?tab=progress` | |
| Series Progress | Layers | `?tab=series` | Hidden if no series with `showProgress` |
| Activity | Activity | `?tab=activity` | Mine / Friends toggle; lazy-loads achievement chunks |
| Backlog | Star | `?tab=backlog` | Want-to-play list; triggers `fetchBacklog` on first open |
| Social | Users | `?tab=social` | Following / followers; triggers `fetchSocial` on first open |
| Stats | PieChart | `?tab=stats` | Own profile only. Desktop tab bar + mobile menu sheet — deliberately **not** in the floating pill |

Tab state persists in URL query param. Floating pill (mobile) appears when tab bar scrolls off screen; animated via `slideUpPill`/`slideDownPill` CSS keyframes.

## Mount Sequence

5 parallel requests via `fetchProfile()`:

1. `API_GetUserProfile` → `coreProfile`
2. `API_GetUserSummary?g=20&a=5` → `userSummary`, `recentlyPlayedGames`, `mostRecentGame`, `mostRecentAchievement`
3. `API_GetUserCompletionProgress` (auto-paginated, 500/page) → `gameAwardsAndProgress`
4. `API_GetUserAwards` → `pageAwards`
5. `API_GetAchievementsEarnedBetween` (last 182 days) → pre-populates chunk 0 + computes `points7Days`/`points30Days`

## Lazy Loads

| Trigger | Fetch | State updated |
|---|---|---|
| Backlog tab opens (first time) | `getBacklog()` from IDB, then `fetchBacklog()` | `backlogData` |
| Social tab opens (first time) | `fetchSocial()` | `socialData` |
| Activity tab scroll (sentinel ref) | `fetchAchievementsChunk(u, k, idx)` idx 1–3 | `achievementChunks` |
| Stats tab opens (first time) | `loadAchievements()` — same call the Activity tab makes, shared state | `achievements` |
| Game modal opens (achievements not yet loaded) | `fetchGameDetails(u, k, gameId)` | `gamesData.detailedGameProgress[gameId]` |
| Friends view opens (first time, own session) | `fetchFriendsActivity()` | `friendsActivity`, `friendsActivityStatus` |

## Social Timeline (Activity Tab — Friends View)

The Activity tab has a **Mine / Friends** toggle. Friends view shows a merged timeline of the authed user's own achievements + all followed users' achievements, grouped by day → session (user + game within 1-hour window) → individual achievements.

### State (main app)

| State | Type | Purpose |
|---|---|---|
| `socialView` | `'mine' \| 'friends'` | Active sub-tab |
| `friendsActivityStatus` | `'idle' \| 'loading' \| 'updating' \| 'done' \| 'error'` | Fetch lifecycle |
| `friendsActivity` | `{ [username]: achievement[] }` | Per-friend achievement arrays (streams in) |
| `friendsFetchProgress` | `{ done, total } \| null` | Progress counter for loading indicator |
| `friendsFetchingRef` | `useRef(boolean)` | Re-entry guard for the fetch useEffect |

### Fetch flow

1. User switches to Friends view → useEffect fires (deps: `activeTab`, `socialView`, `friendsActivityStatus`)
2. Resolve following list: `socialData?.following.results ?? fetchSocial()`
3. `allFriendsCached(followingList)` — if all users have a valid `ra_fa_*` cache entry, skip 'loading' state and resolve instantly
4. Otherwise set `friendsActivityStatus = 'loading'`; `fetchFriendsActivity` fetches one user at a time (1000ms gap between API calls), streams results via `onUser` callback
5. On complete: `friendsActivityStatus = 'done'`; on unrecoverable error: `'error'`

### Feed rendering (ActivityTab)

- `mergedFeed`: own `achievements` + all `friendsActivity` values, sorted newest-first
- `feedGroups`: consecutive same-user+game runs within 1-hour window → session objects
- `feedByDay`: `feedGroups.slice(0, visibleSessionCount)` grouped by day; paginated at 100 sessions per page with a "Load more" button
- `FeedSession`: session header (`[avatar] username unlocked in [game icon] Game · Console · time range`) + `FeedAchRow` list
- Own username shown in cyan (`#57cbde`), friends in gold (`#e5b143`)
- HC achievement rows: gold left-border; SC: gray
- New sessions animate in with `feedIn` keyframe (opacity 0→1, translateY −6px→0)

## `rawData` Memo

```js
rawData = {
  ...profileData,          // from fetchProfile()
  wantToPlayList,          // backlogData — null until the Backlog tab opens
  recentAchievements: [],  // not used directly
  detailedGameProgress,    // lazy-populated per game
}
```

Passed to `transformData()` → `{ profile, games, backlog }`.

## Completion Progress — Progression Buckets

`progressFilter` state (`'all' | 'nearly' | 'inprogress' | 'abandoned'`) drives a segmented
control above the Mastered toggle. All views run after the shared base filter (has unlocks, has
an achievement set, matches `progressSearch`).

The three progression buckets **partition** started-but-unfinished games — every such game lands
in exactly one, and their counts sum to the unfinished total. Precedence is first-match-wins in
the order below.

| View | Filter | Sort |
|---|---|---|
| `nearly` | `!isMastered && rawProgress >= 75` | achievements remaining asc, then `rawProgress` desc |
| `inprogress` | not nearly, `lastPlayedStr` within 30 days | `lastPlayedStr` desc |
| `abandoned` | not nearly, `lastPlayedStr` older than 30 days **or missing** | `lastPlayedStr` desc |
| `all` | `showMastered \|\| !isMastered` | `rawProgress` desc |

Two deliberate choices:

- **`nearly` is recency-neutral** — it outranks `abandoned`, so a game left at 80% seven months
  ago stays on the finish-line list instead of vanishing into the abandoned pile.
- **Percentage is the gate, remaining is the sort.** A pure `remaining <= N` rule surfaces tiny
  6-achievement sets where the user has one unlock (17% complete, 5 left); a pure percentage rule
  puts an 81%-of-93 set with 18 to go at the top. Gating on 75% and sorting by remaining ascending
  avoids both.

`lastPlayedStr` is the *play* timestamp for games in `recentlyPlayedGames`, falling back to
`mostRecentAwardedDate` otherwise — so launching a game without unlocking anything still counts
as in progress.

The `Mastered` toggle only renders under `all`; the buckets exclude mastered games by definition.
Under the other three a one-line hint replaces it.

## Stats Tab

`StatsTab` — own profile only. Reuses `ALL_GAMES`, `PROFILE_DATA.gameAwards` and `heatmapData`
from the mount fetch, plus the achievement chunks it shares with the Activity tab. No extra
API surface.

### Props

| Prop | Source |
|---|---|
| `achievements` | `allLoadedAchievements` |
| `achLoading` | `achievements === null \|\| achievementsLoadingMore` |
| `games` | `ALL_GAMES` |
| `gameAwards` | `PROFILE_DATA.gameAwards` (needs the raw `awardedAt` field added in `transform.js`) |
| `heatmapData` | the same memo the Activity tab uses |

### Tiles (`StatTile`) — `grid-cols-2 md:grid-cols-4`

| Tile | Derived from |
|---|---|
| Current streak | `heatmapData` day keys. Counts back from today; a quiet today starts the count at yesterday rather than breaking the streak |
| Longest streak | Longest consecutive run in the loaded window |
| Active days | Days with any unlock in the last 90 |
| Points this month | This calendar month's points vs the median of the other months in the window |

Day keys are local (`YYYY-MM-DD`) but parsed as UTC (`T00:00:00Z`) for arithmetic, so run
lengths stay exact across DST boundaries.

### Cards (`StatCard`)

- **Point acquisition** (`PointAcquisitionChart`) — points per **week** as columns with a 4-week
  trailing mean as a 2px line overlay. ~52 columns over the loaded window; weeks start Monday and
  quiet weeks are filled so the axis is real time. Too many columns to label individually, so the
  x-axis ticks the first week of each month. **Both series are points-per-month and share one axis.**
  A cumulative line here would need a second y-scale; dual-axis plots invent a correlation that
  isn't in the data, so the trend is a rolling mean instead. The oldest bucket is dropped because
  the 364-day fetch window clips it. The line starts at the fourth retained week, where a true
  4-week mean first exists.
  Bars are capped at 24px and centred inside full-width bands, so column centres line up with the
  line's percentage geometry — capping the *band* instead misaligns the two series. The line is a
  stretched `viewBox="0 0 100 100"` SVG with `vectorEffect="non-scaling-stroke"` (stays 2px at any
  width); the end marker is a div, so it stays circular while the SVG is stretched. Hovering a
  column band dims the others and swaps the legend row for a readout. Only the peak column carries
  a direct label.
- **Mastery timeline** — lifetime, bucketed by month from `gameAwards[].awardedAt`. Mastery and
  Beaten stack in one column with a 2px surface gap, using the same gold/grey the Consoles card
  does. Hovering a column dims the others and swaps
  the legend row for a readout, matching the acquisition chart (`tlHover` state, keyed by month). Empty months are filled, short histories pad back to a 24-month
  span, and the axis always runs to the current month so a drought is visible. Columns are
  `flex: 1 1 0` with `minWidth: 10px` / `maxWidth: 22px` — they fill the card on desktop and
  overflow into a horizontal scroll on mobile, auto-scrolled to the right edge on mount (same
  `requestAnimationFrame` trick as the heatmap).
- **Consoles** (`StackedBarRow`) — **everything is counted in games.** Bar length is games played
  on that console (relative to the console with the most), split into **1–3 segments** ordered
  **in progress (`#66c0f4`) → beaten (grey `#8f98a0`) → mastered (gold)**. Mastered wins over
  beaten, so a game is never counted twice. The mastered/beaten counts printed beside the bar are
  the same numbers the segments encode.

  **In progress is deliberately first.** A stacked bar is only precisely comparable across rows for
  the segment anchored at the baseline; everything after it floats. Only 3 of 12 consoles have a
  mastered game, so a mastered-first order left nine bars starting on a different colour and
  nothing comparable at the baseline — every row has in-progress games, so blue anchors all of
  them. Left-to-right then reads as the progression, gold terminating the bar, matching the
  blue-to-gold progress bars elsewhere in the app. **The legend follows the segment order**; if one
  changes, change the other.

  Segments were briefly weighted by *achievements earned in* mastered/beaten games, which was
  coherent arithmetic but read as broken: one 80-achievement mastery filled 83% of a PSP bar
  labelled "1 mastered". Keep both the length and the segments in one unit.

  Rows sort by games played; top 10, remainder rolled into one "N more systems" row that sums
  every segment. Achievements unlocked is no longer encoded on this card.
- **Rarity profile** — unlocks banded by `trueRatio / points`, RA's own difficulty weighting.
  Bands: Common `<1.5`, Uncommon `<3`, Rare `<6`, Very rare `<12`, Ultra rare above. Achievements
  with no points or no `trueRatio` are skipped.

  Rarity has **its own palette**, not the generic accents and not a single-hue ramp:

  | Band | Colour |
  |---|---|
  | Common | `#8f98a0` grey |
  | Uncommon | `#66c0f4` blue — the app's bar blue exactly |
  | Rare | `#e8813c` orange |
  | Very rare | `#f5e08f` pale yellow |
  | Ultra rare | `#c94040` deep red |

  The three warm tiers are hue-wheel neighbours, so they are separated by **lightness**, not hue.
  At comparable saturation they measure ΔE 8–11 against each other and collapse entirely under
  red-green CVD; spread across lightness they clear it (CVD ΔE 12.4 deutan, contrast all ≥ 3:1).
  The shades are also pulled away from meanings the app already owns — `#f5e08f` is far from the
  `#e5b143` gold that means *mastered*, and `#c94040` is far from the `#ff6b6b` that means *error*.

  Nothing in this palette encodes the order; the labels, counts and percentages do. The one
  sub-floor pair is grey↔blue at ΔE 13.9, the same pair already accepted on the Consoles card and
  mitigated the same way. Kept in sync with the game page's `DIFFICULTY_BANDS` — same ladder.

Charts are hand-rolled divs (plus one stretched SVG for the trend line) — no chart library,
consistent with the heatmap.

Chart palettes are checked with the `dataviz` skill's `scripts/validate_palette.js` against the
`#1b2838` card surface before shipping. The award segments use the repo's status colors unchanged;
grey↔`#66c0f4` falls below the validator's normal-vision floor, so every segment carries its own
count and icon as secondary encoding — see `docs/rules.md`. The app's `#66c0f4` / `#e5b143` accents sit outside the
validator's dark lightness band but pass CVD separation, normal-vision separation and contrast by
wide margins; they are kept for design-system consistency. Ordered scales must use the validated
single-hue ramp rather than a set of accent hues.

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

### Backlog table

Certain columns carry `wl-hide-mobile` class and are hidden on mobile via a `<style>` rule.

### Heatmap

Short hint (`sm:hidden`) vs full hint (`hidden sm:block`) shown depending on screen width.

### Header layout

```jsx
<div className="flex flex-col md:flex-row items-center md:items-start gap-5">
  <div className="w-20 h-20 md:w-24 md:h-24 ...">  {/* avatar */}
  <div className="flex-1 flex flex-col gap-1.5 text-center md:text-left">
```
