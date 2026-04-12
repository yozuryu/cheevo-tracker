# Todo

## Game Page — Leaderboards Tab

Add a **Leaderboards** tab between Info and Hashes (final tab order: Achievements · Info · Leaderboards · Community · Hashes).

### Data
- `getGameLeaderboards(username, apiKey, { i: gameId })` — list of all leaderboards for the game
  - Fields: `id`, `title`, `description`, `format` (TIME, SCORE, VALUE, etc.), `rankAsc`, `topEntry` (`{ user, score, formattedScore }`)
- `getLeaderboardEntries(username, apiKey, { i: leaderboardId, c: 25 })` — top entries for a selected board
  - Fields per entry: `rank`, `user`, `ulid`, `score`, `formattedScore`, `dateSubmitted`
- `getUserGameLeaderboards(username, apiKey, { i: gameId, u: username })` — the logged-in user's own entries across all boards for this game (for highlighting the user's rank)
- `getGameRankAndScore(username, apiKey, { g: gameId, t: 0 })` — overall top scorers for the game (shown as a pinned "Top Scorers" card at the top of the tab)

### Behaviour
- Lazy-load on first tab open (same pattern as Hashes)
- Initially fetch `getGameLeaderboards` + `getUserGameLeaderboards` + `getGameRankAndScore(t=0)` in parallel
- Render a pinned "Top Scorers" card first (from `getGameRankAndScore`), then the board list
- Clicking a board card expands it (accordion) and lazy-loads `getLeaderboardEntries` for that board (cached per board ID)
- Highlight the logged-in user's row in expanded entries; show "Your Entry" summary pill on the collapsed card if user has an entry
- Loading state: spinner while fetching; per-board spinner on expand
- Empty state: "No leaderboards for this game"

### UI
- **Top Scorers card**: section header + compact rows (rank · avatar · username · score), top 10, gold accent
- **Board card** (collapsed): title left, format badge right; description in muted text; "Your Entry: Rank #N · score" pill if user has one; top entry preview (👑 user · score) bottom-right
- **Board card** (expanded): compact table rows — rank | 28px avatar | username | formatted score | date; user's own row highlighted `bg-[#202d39]` with cyan `#57cbde` left border
- Format badge colors: TIME → blue `#66c0f4`, SCORE → gold `#e5b143`, VALUE / other → gray `#8f98a0`

---

## Game Page — Community Tab

Add a **Community** tab (between Leaderboards and Hashes).

### Data
- `getGameRankAndScore(username, apiKey, { g: gameId, t: 1 })` — latest masters (user, date, numAchievements, totalScore)
- `getComments(username, apiKey, { i: gameId, t: 1, c: 25, sort: '-submitted' })` — game wall comments, newest first
  - Fields per comment: `user`, `ulid`, `submitted`, `commentText`
- Pagination on comments only: "Load more" appends next 25 with `o` offset

### Behaviour
- Lazy-load on first tab open; fetch `getGameRankAndScore(t=1)` + first comments page in parallel
- "Load more" button appends next 25 comments
- Loading state: shimmer skeletons for both sections
- Empty states: hide Recent Masters section if empty; "No comments yet" for comments

### UI
- **Recent Masters** section at top: compact row per user — 28px avatar · username (gold) · date (muted, relative) · "Mastered" badge; max 10 entries; gold `#e5b143` section accent
- **Comments** section below: avatar left (28px, linked), username (gold, `text-[11px]`) + timestamp (muted `text-[9px]`, relative) inline, comment text below (`text-[11px] text-[#c6d4df] leading-snug`); rows separated by `border-b border-[#1b2838]`
- "Load more" button: centered pill, shows "Load more (N remaining)" if total known; blue `#66c0f4` section accent

---

## Game Page — Info Tab Enhancements

Enrich the existing **Info** tab with data from two lazy-loaded endpoints (both fetched in parallel on first Info tab open).

### New endpoints
- `getGameProgression(username, apiKey, { i: gameId })` — median completion times
  - Fields: `medianTimeToBeat`, `medianTimeToBeatHardcore`, `medianTimeToComplete`, `medianTimeToMaster` (all in seconds, nullable)
- `getGameExtended(username, apiKey, { i: gameId })` — extended metadata
  - Fields used: `updated` (last set update date), `claims` (`[]` or array of active dev claims), per-achievement `author` + `dateCreated` + `dateModified`

### New sections in Info tab

**1. Time to Beat** (from `getGameProgression`) — shown only if at least one value is non-null
- 2×2 grid (or 4-col on desktop) using the same stat-cell pattern as the hero stats strip
- Cells: Beat (Casual) / Beat (HC) / Complete / Master — formatted via `fmtPlaytime`
- Muted label below each value; omit cells where value is null
- Section accent: gold `#e5b143`

**2. Set Info** (from `getGameExtended`) — shown only if `updated` or `claims` exist
- `updated`: "Last updated: {date}" as a metadata row in the existing Info table
- `claims`: if `claims.length > 0`, show an amber notice banner below the Info table:
  `"Achievement set actively claimed by {claimant} — set may still be changing"`
  - Amber `#e5b143` left border, `bg-[rgba(229,177,67,0.06)]` bg, amber text for claimant name

### Hero additions (free — data already fetched)

**`isFinal === false` badge**: show an amber "In Dev" badge in the hero title row alongside Subset/Award badges
- Same badge style as existing badges: `text-[8px] font-bold uppercase tracking-[0.07em] px-1.5 py-[2px] rounded-[2px]`
- Color: amber `#e5b143`, only shown when `isFinal === false`

**`parentGameId` link**: for subset games, add a "Parent Game" row in the Info metadata table
- Value: clickable link → `/game/?id={parentGameId}` (internal page link, no `target="_blank"`)
- Icon: `ExternalLink` (already imported), label: "Parent"

### Achievement row additions (from `getGameExtended`)

Show author per achievement — requires merging `getGameExtended` achievements into the existing list by achievement ID:
- Add `author` + `dateCreated` as small muted text below the description in each `AchievementRow`
- Format: `"by {author} · added {formatDate(dateCreated)}"` — `text-[9px] text-[#546270]`
- Only render if `getGameExtended` data has been loaded (graceful — no change until data arrives)

### Fetch strategy
- On first Info tab open: fire `getGameProgression` + `getGameExtended` in parallel, store in state (`gameProgression`, `gameExtended`)
- `gameExtended.achievements` merged into achievement rows reactively (same pattern as `detailedGameProgress` in profile)
- Loading state: shimmer placeholder for Time to Beat section while fetching; Info table renders immediately with existing data

---

## Game Page — Final Tab Order (Mobile)

`Achievements · Info · Leaderboards · Community · Hashes`

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

