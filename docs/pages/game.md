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
| Info | Media gallery, time-to-beat, metadata, links |
| Leaderboards | Game leaderboards + user's entries |
| Community | Recent masters, comments |
| Hashes | Supported ROM hashes |
| Professor Oak | Only shown when `findPocSubset(gameId)` matches — i.e. when browsing a POC subset's own page — see below |

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

## Professor Oak Challenge Tab

**File:** `game/utils/poc.js` (parsing logic) + inline components in `game/app.js` (`PocEntryRow`, `PocHintLine`)

RetroAchievements represents the Professor Oak Challenge (POC) as a **subset game** — its own RA game ID with its own achievement set. The tab shows up when browsing the **subset's own page** directly (e.g. `game/?id=22862`), not the parent game's page — a POC subset already has a normal, independently-browsable game page (with a "Subset of X" link back to the parent, like any other RA subset), so the guide lives there rather than being bolted onto the parent.

`POC_GAMES` in `game/utils/poc.js` groups subsets by their parent game, and `findPocSubset(gameId)` looks up whether the *current* game ID is one of them:

```js
export const POC_GAMES = {
  '7212': { // Pokémon HeartGold Version | Pokémon SoulSilver Version
    subsets: [
      { id: 22862, label: 'HeartGold', version: 'heartgold' },
      { id: 22693, label: 'SoulSilver', version: 'soulsilver' },
    ],
  },
};
```

The tab only appears in the tab bar when `findPocSubset(gameId)` returns non-null. If the subset has siblings under the same parent (e.g. HeartGold's page links to SoulSilver's), an "Also see" row renders plain links to `?id=<siblingId>&tab=poc` — navigating to the sibling's own page, not an in-place data switch.

### Data fetch

No separate fetch — since the tab only appears while already viewing the subset's own page, the achievement data fetched on mount for the page (`getGameInfoAndUserProgress`, see Mount Sequence above) *is* the POC data. `achList` (already computed for the Achievements tab) is reused directly.

### Checkpoint parsing (`game/utils/poc.js`)

POC subsets are community-authored and use inconsistent wording between sets (compare the HeartGold and SoulSilver subsets), so grouping is derived entirely from the live achievement text rather than any hardcoded species/checkpoint list:

- `classifyPocAchievement(ach)` — pattern-matches `ach.description` (and in a few cases `ach.title`, e.g. starter-choice achievements) into either a **marker** (a checkpoint-clear achievement like "Defeat Falkner with 41 pokemon caught", carrying a target Pokédex count) or a **species** entry (a single catch requirement, possibly a multi-choice like a starter).
- `buildPocCheckpoints(achievements)` — sorts achievements by ID, then buckets every species entry into the next marker achievement that follows it in ID order. Anything after the last marker becomes a trailing "Finale" checkpoint (used when the final legendary isn't gated behind its own marker achievement, e.g. SoulSilver's Groudon).

This means adding support for a new POC subset (a different game) only requires adding an entry to `POC_GAMES` — no parsing changes, as long as the achievement text follows one of the known phrasings in `poc.js`. See [`docs/poc-data-generation.md`](../poc-data-generation.md) for the full walkthrough of adding a new game (finding the subset ID, generating reference data, wiring up the config).

### Reference data (`game/data/poc-pokemon.json`)

RA achievement text doesn't say *where* to find a Pokémon or *what level* it evolves at, so a static JSON file (generated once from [PokeAPI](https://pokeapi.co), not hand-authored) is fetched at `./data/poc-pokemon.json` and cached in the `pocReference` state. It's keyed by species display name (including known alternate spellings, e.g. both `Mr. Mime` and `Mr Mime`) and each entry may contain:

| Field | Meaning |
|---|---|
| `evolvesFrom` / `evolveMethod` | Pre-evolution species name + trigger text (e.g. `"Level 18"`, `"Trade holding Metal Coat"`) |
| `locations` | `{ heartgold: [...], soulsilver: [...] }` — human-readable wild encounter spots + method (grass/surf/rod/headbutt/etc.) |
| `breeding` | Text for baby Pokémon only obtainable by breeding (with incense item if required) |
| `legendary` / `mythical` | Flags used as a last-resort fallback when no location/evolution/breeding data applies |

`getPocHint(name, reference, version)` in `game/app.js` resolves a species to a hint in that priority order (evolution → location → breeding → legendary flag). If nothing resolves, `PocEntryRow` falls back to showing the achievement's own `description` text rather than nothing.

### Accordion UI

One collapsible section per checkpoint (gym leader / Elite Four / Champion / finale). The checkpoint containing the first not-yet-cleared marker achievement auto-expands on load (`currentCheckpointKey`); clicking a header toggles `expandedCheckpoint` (only one open at a time). Each checkpoint header shows a cleared checkmark (from the marker achievement's own unlock state) and a `caught / total` count for its species entries. Unlocked species show a caught badge; locked species show their hint from the reference data (or achievement description fallback).

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
