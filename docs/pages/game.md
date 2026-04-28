# Game Page

**File:** `game/app.js`  
**URL:** `/game/?id=<gameId>`  
**Auth required:** Yes

## Data Fetched on Mount

All in parallel:

- `getGameInfoAndUserProgress(username, apiKey, { g: gameId })` — game metadata + per-achievement user progress
- `getGameHashes(username, apiKey, { i: gameId })` — ROM hashes
- `getGameProgression(username, apiKey, { i: gameId })` — progression achievements
- `getGameExtended(username, apiKey, { i: gameId })` — extended game metadata
- `getActiveClaims(username, apiKey)` — active achievement claims
- `getGameRankAndScore(username, apiKey, { i: gameId })` — leaderboard rank
- `getComments(username, apiKey, { t: 1, i: gameId })` — game comments
- `getGameLeaderboards(username, apiKey, { i: gameId })` — all leaderboards
- `getUserGameLeaderboards(username, apiKey, { i: gameId })` — user's leaderboard entries

## Tabs

| Tab | Contents |
|---|---|
| Achievements | Full achievement list with unlock status, friend comparison |
| Leaderboards | Game leaderboards + user's entries |
| Comments | RA game comment thread |

## Achievement Rows

`AchievementRow` props:

| Prop | Type | Meaning |
|---|---|---|
| `ach` | object | Achievement data with `dateEarned`, `dateEarnedHardcore`, `numAwarded`, etc. |
| `totalPlayersCasual` | number | Total players (casual) for % calculation |
| `totalPlayersHardcore` | number | Total players (hardcore) for % calculation |
| `extAch` | object | Extended achievement data from `getGameExtended` |
| `friendAch` | object \| null \| undefined | Friend's achievement unlock. `undefined` = no comparison, `null` = loading |
| `friendUser` | string \| null \| undefined | Friend username. `undefined` = no comparison, `null` = loading |

### Achievement unlock states (left border)

| State | Border color | Background |
|---|---|---|
| Hardcore unlock | `#e5b143` | `#202d39` |
| Softcore unlock | `#8f98a0` | `#202d39` |
| Locked | `#323f4c` | `#1b2838`, opacity 60% |

### Friend comparison column

| State | `friendUser` | `friendAch` | Visual |
|---|---|---|---|
| No comparison | `undefined` | — | Column hidden |
| Loading | `null` | — | Spinner + flat `#2a475e` stripe |
| HC unlocked | string | `dateEarnedHardcore` set | Gold stripe `#e5b143` + badge image |
| SC unlocked | string | `dateEarned` set, no HC | Gray stripe `#8f98a0` + badge image |
| Locked | string | neither set | Dark stripe `#323f4c` + grayscale+dim badge |

Stripe: `w-[3px] self-stretch rounded-full`. Badge: `w-7 h-7 rounded-[2px]`.

## Friend Comparison Flow

1. User clicks "Select Friend ▾" → `loadFollowing()` fires if not already loaded
2. `loadFollowing()`: calls `fetchSocial(u, k)` → reads `social.following?.results` → sets `followingList`
3. User selects a friend → `selectFriendForCompare(friend)`:
   - Check `sessionStorage` for `ra_fg_{user}_{gameId}` (5-min TTL)
   - On miss: call `getGameInfoAndUserProgress(username, apiKey, { u: friend.user, g: gameId })`
   - Cache result, set `friendGameData`
4. `friendAchMap`: `useMemo` → `Map<achievementId, achievementObject>` from `friendGameData.achievements`
5. Deselect: click X on selected friend chip → `setSelectedFriend(null)`, clear `friendGameData`

## Achievement Type Badges

| Type | Icon | Color | Meaning |
|---|---|---|---|
| `progression` | Trophy | `#e5b143` | Required to complete game |
| `win_condition` | Crown | `#ff6b6b` | Triggers game completion |
| `missable` | AlertTriangle | `#ff9800` | Can be permanently missed |

## Award Badges

| Award | Label | Color |
|---|---|---|
| `mastered` | Mastered | `#e5b143` |
| `completed` | Completed | `#e5b143` |
| `beaten-hardcore` | Beaten | `#c6d4df` |
| `beaten-softcore` | Beaten (SC) | `#8f98a0` |

## Caching

| Data | Cache | TTL |
|---|---|---|
| Following list | `localStorage` via `fetchSocial` | 1 hour |
| Per-friend game data | `sessionStorage` key `ra_fg_{user}_{gameId}` | 5 min |

## Mobile

### Header

```jsx
<div className="relative max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-4 md:pt-5">
  <img className="w-16 h-16 md:w-20 md:h-20 ...">  {/* game box art */}
  <h1 className="text-[18px] md:text-[22px] ...">
```

### Stats bar

Uses `grid grid-flow-col auto-cols-fr` — equal-width columns at all sizes. Stat values scale: `text-[12px] md:text-[14px]`.

### Tab bar

Sticky at `top-0 md:top-[26px]`. Tabs are text-only (no icon/label switch) — scrolls horizontally with `overflow-x-auto scrollbar-none`.

### Content sections (Leaderboards, Comments)

Sidebar panels switch from stacked to side-by-side at `md`:

```jsx
<div className="flex flex-col md:flex-row gap-5 md:items-start">
  <div className="w-full md:w-[200px] md:shrink-0">  {/* sidebar */}
```

### Friend comparison picker

No mobile-specific layout override — the picker dropdown and chip are full-width on mobile by default.
