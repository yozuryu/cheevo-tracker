# Todo

## Profile Page — Social Timeline Tab

Add a **Social Timeline** tab to the profile page showing a unified Steam-style activity feed of achievement unlocks from the logged-in user and everyone they follow.

### Data
- `API_GetUserFollowing` — list of users the logged-in user follows
- `API_GetUserRecentAchievements?u={user}&c=50` (or `API_GetAchievementsEarnedBetween`) — recent achievements per user
- Own achievements already available via `achievementChunks`

### Behaviour
- Lazy-load on first tab open: fetch following list, then fan-out one `API_GetUserRecentAchievements` call per followed user in parallel (cap concurrency to avoid rate limits)
- Merge own recent achievements + all followed users' achievements, sorted by date descending
- Manual refresh button (no auto-polling — RA API has no push)
- Loading state: shimmer skeletons; per-user progress optional
- Empty states: "You're not following anyone yet" / "No recent activity"

### UI
- Feed row per unlock: user avatar (28px, linked to RA profile) · username (gold) · "earned" · achievement icon · achievement name (white) · "in" · game title (muted) · timestamp (relative, right-aligned)
- Game art thumbnail as left accent or background tint (optional)
- Group consecutive unlocks from the same user+game into a collapsible card ("X earned 5 achievements in [Game]")
- Own unlocks styled slightly differently (e.g. cyan `#57cbde` username) to distinguish from friends
- Section accent: blue `#66c0f4` (engagement/social)

---

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

