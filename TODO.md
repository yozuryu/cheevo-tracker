# Todo

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
