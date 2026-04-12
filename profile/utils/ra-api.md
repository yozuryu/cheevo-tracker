# ra-api.js — RetroAchievements API Reference

Browser-side RA API client for cheevo-tracker. No build step, no npm.  
All raw RA responses are PascalCase; everything exported from this module is camelCase.

**Base URL:** `https://retroachievements.org/API`  
**Auth:** every request automatically appends `z={username}&y={apiKey}`  
**Official docs:** https://api-docs.retroachievements.org/

---

## Table of Contents

- [Architecture & Caching](#architecture--caching)
- [Error Handling](#error-handling)
- [Credentials](#credentials)
- [User Endpoints](#user-endpoints)
- [Game Endpoints](#game-endpoints)
- [Achievement Endpoints](#achievement-endpoints)
- [System Endpoints](#system-endpoints)
- [Leaderboard Endpoints](#leaderboard-endpoints)
- [Feed Endpoints](#feed-endpoints)
- [Comment Endpoints](#comment-endpoints)
- [Ticket Endpoints](#ticket-endpoints)
- [App Composites](#app-composites)

---

## Architecture & Caching

### Two layers

| Layer | Functions | Caching |
|---|---|---|
| **Raw endpoint wrappers** | `getUserProfile`, `getGame`, `getAchievementsEarnedBetween`, … | None — pure fetch + map |
| **App composites** | `fetchProfile`, `fetchAchievementsChunk`, `fetchWatchlist`, `fetchGameDetails`, `validateCredentials` | sessionStorage, 5-minute TTL |

Raw wrappers are safe to call in any context. App composites are what `app.js` uses.

### Cache

```js
CACHE_TTL = 5 * 60 * 1000  // 5 minutes
```

| Composite | sessionStorage key |
|---|---|
| `fetchProfile(username, …)` | `ra_profile_{username}` |
| `fetchAchievementsChunk(username, …, idx)` | `ra_chunk_{username}_{idx}` |
| `fetchWatchlist(username, …)` | `ra_watchlist_{username}` |
| `fetchGameDetails(username, …, gameId)` | `ra_game_{username}_{gameId}` |

**To bust cache manually** (e.g. after a "Refresh" button):
```js
sessionStorage.clear();                        // all keys
sessionStorage.removeItem('ra_profile_User');  // specific key
```

### Pagination

Endpoints that return paginated results have an internal `paginate()` helper that:
1. Fetches page 0
2. Checks `results.length < pageSize` or `all.length >= Total` to detect last page
3. Sleeps 1 s between pages (same-endpoint rate limiting)
4. Returns a flat merged array

Functions that auto-paginate are marked **auto-paginated** in their docs.

---

## Error Handling

All functions throw on failure. Two error types:

| Error message | Cause | Action |
|---|---|---|
| `'AUTH_ERROR'` | HTTP 401, or API returned `{ message: "Credentials are required." }` | Call `clearCredentials()` and redirect to login |
| `'HTTP {status}'` | Non-401 HTTP error (500, 404, etc.) | Show error UI or retry |

The app's `handleAuthError()` in `app.js` handles `AUTH_ERROR` globally.

---

## Credentials

```js
import { getCredentials, clearCredentials } from './utils/ra-api.js';

const creds = getCredentials();
// → { username: "User", apiKey: "abc123..." } | null

clearCredentials();
// removes 'raCredentials' from localStorage
```

Credentials are stored in `localStorage` as:
```json
{ "username": "User", "apiKey": "abc123..." }
```

---

## User Endpoints

---

### `getUserProfile`

```js
getUserProfile(username, apiKey, { u? })
```

Basic profile snapshot — points, motto, avatar, membership date.

**PHP:** `API_GetUserProfile.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |

**Response:**

```js
{
  user:                string,   // "User"
  ulid:                string,   // "00000000000000"
  userPic:             string,   // "/UserPic/User.png"
  memberSince:         string,   // "2013-06-01 20:14:38"
  richPresenceMsg:     string,   // "Playing Super Mario World"
  lastGameId:          number,   // 1
  contribCount:        number,   // 0  (achievements contributed)
  contribYield:        number,   // 0  (points contributed)
  totalPoints:         number,   // 5432
  totalSoftcorePoints: number,   // 120
  totalTruePoints:     number,   // 8765  (RetroPoints / TrueRatio sum)
  permissions:         number,   // 1 (0=banned, 1=normal, 4=developer, etc.)
  untracked:           number,   // 0 | 1
  id:                  number,   // internal user ID
  userWallActive:      number,   // 0 | 1
  motto:               string,   // "My motto"
}
```

**Usage:**
```js
const profile = await getUserProfile(username, apiKey);
// or query a different user:
const other = await getUserProfile(username, apiKey, { u: 'OtherUser' });
```

---

### `getUserSummary`

```js
getUserSummary(username, apiKey, { u?, g?=10, a?=5 })
```

Extended profile including recently played games and recent achievement activity.

**PHP:** `API_GetUserSummary.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |
| `g` | number | No | `10` | Number of recently played games to return (max 20) |
| `a` | number | No | `5` | Number of recent achievements to include |

**Response:**

```js
{
  user:                string,   // "User"
  ulid:                string,
  memberSince:         string,   // "2013-06-01 20:14:38"
  lastActivity:        object | null,  // raw LastActivity object from API (may be null)
  richPresenceMsg:     string,
  richPresenceMsgDate: string | null,  // ISO datetime of last RP update
  lastGameId:          number,
  contribCount:        number,
  contribYield:        number,
  totalPoints:         number,
  totalSoftcorePoints: number,
  totalTruePoints:     number,
  permissions:         number,
  untracked:           number,
  id:                  number,
  userWallActive:      number,
  motto:               string,
  rank:                number,   // global hardcore rank
  softcoreRank:        number | null,
  totalRanked:         number,   // total number of ranked users
  status:              string,   // "Offline" | "Online" | "Playing {game}"
  userPic:             string,
  recentlyPlayedCount: number,
  recentlyPlayed: [
    {
      gameId:                  number,
      title:                   string,
      consoleName:             string,
      lastPlayed:              string,   // "2024-01-15 18:30:00"
      imageIcon:               string,   // "/Images/012345.png"
      imageIngame:             string | null,
      imageTitle:              string | null,
      numAchieved:             number,   // user's unlocked count
      numPossibleAchievements: number,   // total achievements in game
    }
  ],
  awarded:            object,   // raw Awarded map (keyed by gameId) — not further mapped
  recentAchievements: object,   // raw RecentAchievements map — not further mapped
  lastGame:           object | null,  // raw LastGame object from API
}
```

> **Note:** `awarded` and `recentAchievements` are left as raw API objects because their
> nested structure is consumed directly in `fetchProfile` to extract `mostRecentAchievement`.
> Do not rely on these fields directly in `app.js`.

---

### `getUserPoints`

```js
getUserPoints(username, apiKey, { u? })
```

Lightweight call to get current point totals only.

**PHP:** `API_GetUserPoints.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |

**Response:**

```js
{
  points:         number,   // hardcore points total
  softcorePoints: number,
}
```

---

### `getUserCompletionProgress`

```js
getUserCompletionProgress(username, apiKey, { u? })
```

All games the user has any progress on. **Auto-paginated** (500/page, 1 s between pages).

**PHP:** `API_GetUserCompletionProgress.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |

**Response:** `Array` — one entry per game touched:

```js
[
  {
    gameId:                number,
    title:                 string,
    consoleName:           string,
    imageIcon:             string,   // "/Images/012345.png"
    numAwarded:            number,   // softcore OR hardcore unlocks (whichever is higher)
    numAwardedHardcore:    number,
    maxPossible:           number,   // total achievements in the set
    highestAwardKind:      string | null,
    // → "mastered" | "beaten-hardcore" | "beaten-softcore" | "completed" | null
    highestAwardDate:      string | null,  // ISO datetime
    mostRecentAwardedDate: string | null,  // ISO datetime of last unlock
  }
]
```

> **Tip:** `numAwarded === maxPossible && maxPossible > 0` → mastered.  
> `highestAwardKind` is the authoritative mastery/beaten status.

---

### `getUserCompletedGames`

```js
getUserCompletedGames(username, apiKey, { u? })
```

> ⚠️ **Legacy endpoint.** Use `getUserCompletionProgress` instead — it returns more fields
> and supports pagination. This endpoint is preserved for compatibility.

**PHP:** `API_GetUserCompletedGames.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |

**Response:** `Array`

```js
[
  {
    gameId:      number,
    title:       string,
    imageIcon:   string,
    consoleId:   number,
    consoleName: string,
    maxPossible: number,
    numAwarded:  number,
    pctWon:      number,   // float 0–100, e.g. 42.857142857143
    hardcoreMode: boolean, // true if this row represents the hardcore completion
  }
]
```

> Games may appear twice — once for softcore, once for hardcore — with different `hardcoreMode` values.

---

### `getUserProgress`

```js
getUserProgress(username, apiKey, { u?, i })
```

Quick progress snapshot for a list of specific game IDs. Useful for checking a handful of games
without pulling the full completion list.

**PHP:** `API_GetUserProgress.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |
| `i` | string \| string[] | Yes | — | Comma-separated game IDs or array, e.g. `[1, 2, 3]` |

**Response:** Object keyed by game ID string:

```js
{
  "1": {
    numPossibleAchievements: number,
    possibleScore:           number,   // total points if all achievements earned
    numAchieved:             number,
    scoreAchieved:           number,
    numAchievedHardcore:     number,
    scoreAchievedHardcore:   number,
  },
  "2": { … },
}
```

**Usage:**
```js
const progress = await getUserProgress(username, apiKey, { i: [1, 228, 724] });
console.log(progress["228"].numAchieved);
```

---

### `getUserAwards`

```js
getUserAwards(username, apiKey, { u? })
```

All visible awards — game mastery/completion/beaten badges and site awards (Patreon, etc.).

**PHP:** `API_GetUserAwards.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |

**Response:**

```js
{
  totalAwardsCount:          number,
  hiddenAwardsCount:         number,
  masteryAwardsCount:        number,
  completionAwardsCount:     number,
  beatenHardcoreAwardsCount: number,
  beatenSoftcoreAwardsCount: number,
  eventAwardsCount:          number,
  siteAwardsCount:           number,
  visibleUserAwards: [
    {
      awardedAt:    string,         // ISO datetime, e.g. "2024-01-15T18:30:00+00:00"
      awardType:    string,         // "Mastery/Completion" | "Game Beaten" | "Site Award" | …
      awardData:    number | null,  // game ID for game awards
      awardDataExtra: number,       // 1 if hardcore, 0 if softcore (for game awards)
      displayOrder: number,
      title:        string,         // game title or award name
      consoleId:    number | null,
      consoleName:  string | null,
      flags:        number | null,
      imageIcon:    string,         // "/Images/012345.png"
    }
  ],
}
```

> **Filter game awards:** `awardType === "Mastery/Completion" || awardType === "Game Beaten"`  
> **Filter site awards:** everything else (Patreon, events, etc.)

---

### `getUserRecentAchievements`

```js
getUserRecentAchievements(username, apiKey, { u?, m?=60 })
```

Achievements unlocked in the last N minutes. Useful for a live "now playing" feed.

**PHP:** `API_GetUserRecentAchievements.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |
| `m` | number | No | `60` | Look-back window in minutes |

**Response:** Array — same shape as [`getAchievementsEarnedBetween`](#getachievementsearnedBetween).

---

### `getAchievementsEarnedBetween`

```js
getAchievementsEarnedBetween(username, apiKey, { u?, f, t })
```

All achievements unlocked within a Unix timestamp range. Used to build the activity heatmap.

**PHP:** `API_GetAchievementsEarnedBetween.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |
| `f` | number | Yes | — | Range start (Unix epoch seconds) |
| `t` | number | Yes | — | Range end (Unix epoch seconds) |

**Response:** `Array`

```js
[
  {
    date:          string,          // "2024-01-15 18:30:00" (UTC)
    hardcoreMode:  boolean,         // true if unlocked in hardcore mode
    achievementId: number,          // e.g. 12345
    title:         string,          // "Ring Ring"
    description:   string,          // "Collect 10 rings"
    badgeName:     string,          // "54321" → badge URL: MEDIA_URL/Badge/54321.png
    points:        number,          // 5
    trueRatio:     number,          // RetroPoints (weighted points)
    type:          string | null,   // "progression" | "win_condition" | "missable" | null
    gameId:        number,
    gameTitle:     string,
    gameIcon:      string,          // "/Images/012345.png"
    consoleName:   string,
  }
]
```

**Usage:**
```js
const nowTs = Math.floor(Date.now() / 1000);
const sixMonthsAgo = nowTs - 182 * 24 * 60 * 60;
const achievements = await getAchievementsEarnedBetween(username, apiKey, {
  f: sixMonthsAgo,
  t: nowTs,
});
```

---

### `getAchievementsEarnedOnDay`

```js
getAchievementsEarnedOnDay(username, apiKey, { u?, d })
```

All achievements unlocked on a specific calendar day (UTC).

**PHP:** `API_GetAchievementsEarnedOnDay.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |
| `d` | string | Yes | — | Date in `YYYY-MM-DD` format |

**Response:** Same array shape as [`getAchievementsEarnedBetween`](#getachievementsearnedBetween).

---

### `getUserWantToPlayList`

```js
getUserWantToPlayList(username, apiKey, { u? })
```

User's want-to-play list. **Auto-paginated** (100/page, 1 s between pages).

**PHP:** `API_GetUserWantToPlayList.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |

**Response:** `Array`

```js
[
  {
    id:                    number,   // game ID
    title:                 string,
    imageIcon:             string,   // "/Images/012345.png"
    consoleId:             number,
    consoleName:           string,
    pointsTotal:           number,   // total points available if all achievements earned
    achievementsPublished: number,   // count of achievements in the set
  }
]
```

---

### `getUserRecentlyPlayedGames`

```js
getUserRecentlyPlayedGames(username, apiKey, { u?, c?=10, o?=0 })
```

Recently played games with per-game achievement progress. More fields than the `recentlyPlayed`
array in `getUserSummary` (includes hardcore breakdown, box art).

**PHP:** `API_GetUserRecentlyPlayedGames.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |
| `c` | number | No | `10` | Number of games (max **50**) |
| `o` | number | No | `0` | Offset for pagination |

**Response:** `Array`

```js
[
  {
    gameId:                  number,
    consoleId:               number,
    consoleName:             string,
    title:                   string,
    imageIcon:               string,
    imageTitle:              string | null,
    imageIngame:             string | null,
    imageBoxArt:             string | null,
    lastPlayed:              string,   // "2024-01-15 18:30:00"
    achievementsTotal:       number,   // same as numPossibleAchievements
    numPossibleAchievements: number,
    possibleScore:           number,
    numAchieved:             number,   // softcore unlocks
    scoreAchieved:           number,
    numAchievedHardcore:     number,
    scoreAchievedHardcore:   number,
  }
]
```

---

### `getUserClaims`

```js
getUserClaims(username, apiKey, { u? })
```

Achievement set claims made by the user over their lifetime (for developers).

**PHP:** `API_GetUserClaims.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |

**Response:** `Array`

```js
[
  {
    id:          number,
    user:        string,
    ulid:        string,
    gameId:      number,
    gameTitle:   string,
    gameIcon:    string,
    consoleId:   number,
    consoleName: string,
    claimType:   number,   // 0 = primary, 1 = collaboration
    setType:     number,   // 0 = new set, 1 = revision
    status:      number,   // 0 = active, 1 = complete, 2 = dropped, 3 = expired
    extension:   number,
    special:     number,
    created:     string,   // ISO datetime
    doneTime:    string,   // ISO datetime
    updated:     string,   // ISO datetime
    userIsJrDev: number,   // 0 | 1
    minutesLeft: number,   // remaining time (negative = expired)
  }
]
```

---

### `getUserGameRankAndScore`

```js
getUserGameRankAndScore(username, apiKey, { u?, g })
```

User's rank and score for a specific game. Returns `null` if the user has no progress.

**PHP:** `API_GetUserGameRankAndScore.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |
| `g` | number | Yes | — | Game ID |

**Response:** `object | null`

```js
{
  user:       string,
  ulid:       string,
  userRank:   number,   // rank on this game's leaderboard
  totalScore: number,   // total points earned in this game
  lastAward:  string,   // ISO datetime of last achievement unlock
}
```

---

### `getUserSetRequests`

```js
getUserSetRequests(username, apiKey, { u?, t?=0 })
```

Games the user has voted to get an achievement set.

**PHP:** `API_GetUserSetRequests.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |
| `t` | number | No | `0` | `0` = active requests only, `1` = all (including fulfilled) |

**Response:**

```js
{
  totalRequests: number,   // total requests the user has made
  pointsForNext: number,   // points needed to unlock the next request slot
  requestedSets: [
    {
      gameId:      number,
      title:       string,
      consoleId:   number,
      consoleName: string,
      imageIcon:   string,
    }
  ],
}
```

---

### `getUsersIFollow`

```js
getUsersIFollow(username, apiKey, { c?=100, o?=0 })
```

Paginated list of users the **authenticated user** follows. Does not accept a `u` parameter —
always returns data for the credentials supplied.

**PHP:** `API_GetUsersIFollow.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `c` | number | No | `100` | Count (max 500) |
| `o` | number | No | `0` | Offset |

**Response:**

```js
{
  count:   number,
  total:   number,
  results: [
    {
      user:           string,
      ulid:           string,
      points:         number,
      pointsSoftcore: number,
      isFollowingMe:  boolean,  // whether they also follow the authenticated user
    }
  ],
}
```

---

### `getUsersFollowingMe`

```js
getUsersFollowingMe(username, apiKey, { c?=100, o?=0 })
```

Paginated list of users following the **authenticated user**.

**PHP:** `API_GetUsersFollowingMe.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `c` | number | No | `100` | Count (max 500) |
| `o` | number | No | `0` | Offset |

**Response:**

```js
{
  count:   number,
  total:   number,
  results: [
    {
      user:           string,
      ulid:           string,
      points:         number,
      pointsSoftcore: number,
      amIFollowing:   boolean,  // whether the authenticated user also follows them
    }
  ],
}
```

---

### `getGameInfoAndUserProgress`

```js
getGameInfoAndUserProgress(username, apiKey, { u?, g })
```

Full game metadata + user's unlock state for every achievement. The most data-rich endpoint —
used to populate the game achievement modal.

**PHP:** `API_GetGameInfoAndUserProgress.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `u` | string | No | `username` | Target username or ULID |
| `g` | number | Yes | — | Game ID |

**Response:**

```js
{
  // Game metadata
  id:                         number,
  title:                      string,
  consoleId:                  number,
  consoleName:                string,
  forumTopicId:               number | null,
  imageIcon:                  string,   // "/Images/012345.png"
  imageTitle:                 string | null,
  imageIngame:                string | null,
  imageBoxArt:                string | null,
  publisher:                  string | null,
  developer:                  string | null,
  genre:                      string | null,
  released:                   string | null,   // "1996-03-21 00:00:00"
  isFinal:                    boolean,
  richPresencePatch:          string | null,
  guideUrl:                   string | null,
  parentGameId:               number | null,   // set if this is a subset game
  numDistinctPlayers:         number,
  numDistinctPlayersCasual:   number,
  numDistinctPlayersHardcore: number,
  numAchievements:            number,

  // User progress
  userTotalPlaytime:          number | null,   // seconds played (integer) — can be null
  numAwardedToUser:           number,          // total unlocked (softcore + hardcore)
  numAwardedToUserHardcore:   number,
  userCompletion:             string,          // "42.86%" — softcore completion %
  userCompletionHardcore:     string,          // "42.86%"
  highestAwardKind:           string | null,   // "mastered" | "beaten-hardcore" | "beaten-softcore" | null
  highestAwardDate:           string | null,

  // Per-achievement data
  achievements: {
    "[achievementId]": {
      id:                 number,
      title:              string,
      description:        string,
      points:             number,
      trueRatio:          number,    // RetroPoints
      badgeName:          string,    // e.g. "54321" → MEDIA_URL/Badge/54321.png
      type:               string | null,  // "progression" | "win_condition" | "missable" | null
      displayOrder:       number,
      numAwarded:         number,    // global casual unlock count
      numAwardedHardcore: number,    // global hardcore unlock count
      dateEarned:         string | null,  // "2024-01-15 18:30:00" or null if locked
      dateEarnedHardcore: string | null,
    }
  },
}
```

> `userTotalPlaytime` is in **seconds**. Convert: `hours = Math.floor(s / 3600)`.  
> An achievement is unlocked if `dateEarned !== null`.  
> An achievement is hardcore if `dateEarnedHardcore !== null`.

---

## Game Endpoints

---

### `getGame`

```js
getGame(username, apiKey, { i })
```

Basic game metadata. No achievement list, no user data.

**PHP:** `API_GetGame.php`

**Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `i` | number | Yes | Game ID |

**Response:**

```js
{
  title:                 string,
  gameTitle:             string,          // same as title
  consoleId:             number,
  consoleName:           string,
  forumTopicId:          number | null,
  flags:                 number | null,   // 0 = released, 4 = hack, 8 = subset, etc.
  gameIcon:              string,
  imageIcon:             string,
  imageTitle:            string | null,
  imageIngame:           string | null,
  imageBoxArt:           string | null,
  publisher:             string | null,
  developer:             string | null,
  genre:                 string | null,
  released:              string | null,
  releasedAtGranularity: string | null,   // "year" | "month" | "day"
}
```

---

### `getGameExtended`

```js
getGameExtended(username, apiKey, { i, f?=3 })
```

Full game metadata including the complete achievement list. No per-user unlock data.

**PHP:** `API_GetGameExtended.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `i` | number | Yes | — | Game ID |
| `f` | number | No | `3` | `3` = official only, `5` = include unofficial/demoted |

**Response:**

```js
{
  id:                         number,
  title:                      string,
  consoleId:                  number,
  consoleName:                string,
  forumTopicId:               number | null,
  flags:                      number | null,
  imageIcon:                  string,
  imageTitle:                 string | null,
  imageIngame:                string | null,
  imageBoxArt:                string | null,
  publisher:                  string | null,
  developer:                  string | null,
  genre:                      string | null,
  released:                   string | null,
  releasedAtGranularity:      string | null,
  isFinal:                    boolean,
  richPresencePatch:          string | null,
  guideUrl:                   string | null,
  updated:                    string | null,
  parentGameId:               number | null,
  numDistinctPlayers:         number,
  numDistinctPlayersCasual:   number,
  numDistinctPlayersHardcore: number,
  numAchievements:            number,
  claims:                     array,   // raw claim objects
  achievements: {
    "[achievementId]": {
      id:                 number,
      numAwarded:         number,    // global casual unlock count
      numAwardedHardcore: number,
      title:              string,
      description:        string,
      points:             number,
      trueRatio:          number,
      author:             string,
      authorUlid:         string,
      dateModified:       string,
      dateCreated:        string,
      badgeName:          string,
      displayOrder:       number,
      type:               string | null,
    }
  },
}
```

---

### `getGameList`

```js
getGameList(username, apiKey, { i, f?=1, h?=0, c?=500, o?=0 })
```

All games for a given console/system.

**PHP:** `API_GetGameList.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `i` | number | Yes | — | Console/system ID (see `getConsoleIds`) |
| `f` | number | No | `1` | `1` = only games with published achievements |
| `h` | number | No | `0` | `1` = include ROM hash list per game |
| `c` | number | No | `500` | Count per request |
| `o` | number | No | `0` | Offset |

**Response:** `Array`

```js
[
  {
    title:           string,
    id:              number,
    consoleId:       number,
    consoleName:     string,
    imageIcon:       string,
    numAchievements: number,
    numLeaderboards: number,
    points:          number,   // total available points
    dateModified:    string | null,
    forumTopicId:    number | null,
    hashes:          string[],  // empty unless h=1
  }
]
```

---

### `getGameHashes`

```js
getGameHashes(username, apiKey, { i })
```

Supported ROM file hashes for a game (for emulator compatibility).

**PHP:** `API_GetGameHashes.php`

**Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `i` | number | Yes | Game ID |

**Response:** `Array`

```js
[
  {
    md5:      string,          // "abc123def456..."
    name:     string,          // "Super Mario World (USA).sfc"
    labels:   string[],        // ["nointro", "rapatches"]
    patchUrl: string | null,
  }
]
```

---

### `getGameLeaderboards`

```js
getGameLeaderboards(username, apiKey, { i, c?=100, o?=0 })
```

All leaderboards for a game with the current top entry.

**PHP:** `API_GetGameLeaderboards.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `i` | number | Yes | — | Game ID |
| `c` | number | No | `100` | Count (max 500) |
| `o` | number | No | `0` | Offset |

**Response:**

```js
{
  count:   number,
  total:   number,
  results: [
    {
      id:          number,
      rankAsc:     boolean,    // true = lower score is better (time trial)
      title:       string,
      description: string,
      format:      string,     // "VALUE" | "SECS" | "MILLISECS" | "MINUTES" | etc.
      author:      string,
      authorUlid:  string,
      topEntry: {
        user:           string,
        ulid:           string,
        score:          number,
        formattedScore: string,   // "1:23.45" or "12345"
      } | null,
    }
  ],
}
```

---

### `getUserGameLeaderboards`

```js
getUserGameLeaderboards(username, apiKey, { i, u?, c?=200, o?=0 })
```

Leaderboard entries for a specific user on a game. Only returns leaderboards where the user
has submitted a score.

**PHP:** `API_GetUserGameLeaderboards.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `i` | number | Yes | — | Game ID |
| `u` | string | No | `username` | Target username or ULID |
| `c` | number | No | `200` | Count (max 500) |
| `o` | number | No | `0` | Offset |

**Response:**

```js
{
  count:   number,
  total:   number,
  results: [
    {
      id:          number,
      rankAsc:     boolean,
      title:       string,
      description: string,
      format:      string,
      userEntry: {
        user:           string,
        ulid:           string,
        score:          number,
        formattedScore: string,
        rank:           number,
        dateUpdated:    string,   // ISO datetime
      },
    }
  ],
}
```

---

### `getGameRankAndScore`

```js
getGameRankAndScore(username, apiKey, { g, t?=0 })
```

Top players for a game — either by total score or by most recent mastery date.

**PHP:** `API_GetGameRankAndScore.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `g` | number | Yes | — | Game ID |
| `t` | number | No | `0` | `0` = high scores, `1` = latest masters |

**Response:** `Array`

```js
[
  {
    user:            string,
    ulid:            string,
    numAchievements: number,
    totalScore:      number,
    lastAward:       string,   // ISO datetime
    rank:            number,
  }
]
```

---

### `getGameProgression`

```js
getGameProgression(username, apiKey, { i, h?=0 })
```

Aggregated statistics on how long players take to beat/complete/master a game.

**PHP:** `API_GetGameProgression.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `i` | number | Yes | — | Game ID |
| `h` | number | No | `0` | `1` = prefer hardcore player data |

**Response:**

```js
{
  id:                       number,
  title:                    string,
  consoleId:                number,
  consoleName:              string,
  imageIcon:                string,
  numDistinctPlayers:       number,
  medianTimeToBeat:         number | null,          // seconds
  medianTimeToBeatHardcore: number | null,          // seconds
  medianTimeToComplete:     number | null,          // seconds (softcore 100%)
  medianTimeToMaster:       number | null,          // seconds (hardcore 100%)
  numAchievements:          number,
  achievements:             array,   // raw achievement progression data
}
```

---

## Achievement Endpoints

---

### `getAchievementOfTheWeek`

```js
getAchievementOfTheWeek(username, apiKey)
```

The current featured achievement with global unlock stats and recent unlockers.

**PHP:** `API_GetAchievementOfTheWeek.php`

**Parameters:** None beyond auth.

**Response:**

```js
{
  achievement:          object,   // raw Achievement object { ID, Title, Description, Points, … }
  console:              object,   // { ID, Title }
  forumTopic:           object,   // { ID }
  game:                 object,   // { ID, Title }
  startAt:              string,   // ISO datetime when this week started
  totalPlayers:         number,
  unlocksCount:         number,
  unlocksHardcoreCount: number,
  unlocks: [
    {
      user:             string,
      ulid:             string,
      raPoints:         number,
      raSoftcorePoints: number,
      dateAwarded:      string,    // ISO datetime
      hardcoreMode:     boolean,
    }
  ],
}
```

---

### `getAchievementUnlocks`

```js
getAchievementUnlocks(username, apiKey, { a, c?=50, o?=0 })
```

Paginated list of users who unlocked a specific achievement.

**PHP:** `API_GetAchievementUnlocks.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `a` | number | Yes | — | Achievement ID |
| `c` | number | No | `50` | Count (max 500) |
| `o` | number | No | `0` | Offset |

**Response:**

```js
{
  achievement:          object,   // raw achievement metadata
  console:              object,   // { ID, Title }
  game:                 object,   // { ID, Title }
  unlocksCount:         number,   // total casual unlocks
  unlocksHardcoreCount: number,
  totalPlayers:         number,
  unlocks: [
    {
      user:             string,
      ulid:             string,
      raPoints:         number,
      raSoftcorePoints: number,
      dateAwarded:      string,
      hardcoreMode:     boolean,
    }
  ],
}
```

---

### `getAchievementCount`

```js
getAchievementCount(username, apiKey, { i })
```

Returns the list of achievement IDs for a game without any additional metadata.

**PHP:** `API_GetAchievementCount.php`

**Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `i` | number | Yes | Game ID |

**Response:**

```js
{
  gameId:         number,
  achievementIds: number[],   // e.g. [12345, 12346, 12347, …]
}
```

---

### `getAchievementDistribution`

```js
getAchievementDistribution(username, apiKey, { i, h?=0, f?=3 })
```

Shows how many players have earned exactly N achievements in a game.
Useful for difficulty distribution charts.

**PHP:** `API_GetAchievementDistribution.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `i` | number | Yes | — | Game ID |
| `h` | number | No | `0` | `1` = hardcore mode distribution |
| `f` | number | No | `3` | `3` = official only, `5` = include unofficial |

**Response:** Object — keys are achievement counts (as strings), values are player counts:

```js
{
  "1":  1240,   // 1240 players have earned exactly 1 achievement
  "2":  980,
  "3":  754,
  // …
  "48": 12,     // 12 players have earned all 48 achievements (mastered)
}
```

---

## System Endpoints

---

### `getConsoleIds`

```js
getConsoleIds(username, apiKey, { a?=0, g?=0 })
```

All consoles and systems supported by RetroAchievements.

**PHP:** `API_GetConsoleIDs.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `a` | number | No | `0` | `1` = active systems only |
| `g` | number | No | `0` | `1` = gaming systems only (excludes events, hubs) |

**Response:** `Array`

```js
[
  {
    id:           number,    // e.g. 1 = Mega Drive, 2 = N64, 21 = SNES, …
    name:         string,    // "SNES/Super Famicom"
    iconUrl:      string | null,
    active:       boolean,
    isGameSystem: boolean,   // false for hubs, events, etc.
  }
]
```

---

## Leaderboard Endpoints

---

### `getLeaderboardEntries`

```js
getLeaderboardEntries(username, apiKey, { i, c?=100, o?=0 })
```

Paginated entries for a specific leaderboard.

**PHP:** `API_GetLeaderboardEntries.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `i` | number | Yes | — | Leaderboard ID |
| `c` | number | No | `100` | Count (max 500) |
| `o` | number | No | `0` | Offset |

**Response:**

```js
{
  count:   number,
  total:   number,
  results: [
    {
      rank:           number,
      user:           string,
      ulid:           string,
      score:          number,
      formattedScore: string,   // "1:23.456" or "12345"
      dateSubmitted:  string,   // ISO datetime
    }
  ],
}
```

---

## Feed Endpoints

---

### `getRecentGameAwards`

```js
getRecentGameAwards(username, apiKey, { d?, o?=0, c?=25, k? })
```

Recent game beaten/mastery awards from all users across the site.

**PHP:** `API_GetRecentGameAwards.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `d` | string | No | today | Start date `YYYY-MM-DD` (UTC) |
| `o` | number | No | `0` | Offset |
| `c` | number | No | `25` | Count (max 100) |
| `k` | string | No | all | Comma-separated award kinds to filter: `beaten-softcore`, `beaten-hardcore`, `completed`, `mastered` |

**Response:**

```js
{
  count:   number,
  total:   number,
  results: [
    {
      user:        string,
      ulid:        string,
      awardKind:   string,     // "mastered" | "beaten-hardcore" | "beaten-softcore" | "completed"
      awardDate:   string,     // ISO datetime
      gameId:      number,
      gameTitle:   string,
      consoleId:   number,
      consoleName: string,
    }
  ],
}
```

---

### `getActiveClaims`

```js
getActiveClaims(username, apiKey)
```

All currently active achievement set development claims across the site.

**PHP:** `API_GetActiveClaims.php`

**Parameters:** None beyond auth.

**Response:** Array — see [claim object shape](#getuserclaims).

---

### `getClaims`

```js
getClaims(username, apiKey, { k?=1 })
```

Inactive (historical) claims.

**PHP:** `API_GetClaims.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `k` | number | No | `1` | `1` = completed, `2` = dropped, `3` = expired |

**Response:** Array — same shape as `getActiveClaims`.

---

## Comment Endpoints

---

### `getComments`

```js
getComments(username, apiKey, { i, t, c?=100, o?=0, sort?='-submitted' })
```

Comments on a game page, achievement, or user wall.

**PHP:** `API_GetComments.php`

**Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `i` | number | Yes | — | Target ID (game ID, achievement ID, or user ID) |
| `t` | number | Yes | — | `1` = game, `2` = achievement, `3` = user wall |
| `c` | number | No | `100` | Count (max 500) |
| `o` | number | No | `0` | Offset |
| `sort` | string | No | `'-submitted'` | `'submitted'` = oldest first, `'-submitted'` = newest first |

**Response:**

```js
{
  count:   number,
  total:   number,
  results: [
    {
      user:        string,
      ulid:        string,
      submitted:   string,   // ISO datetime
      commentText: string,
    }
  ],
}
```

---

## Ticket Endpoints

---

### `getTicketData`

```js
getTicketData(username, apiKey, { ticketId?, achievementId?, gameId?, targetUser?, f?, c?=10, o?=0 })
```

Multi-mode endpoint — behaviour depends on which optional param is passed.

**PHP:** `API_GetTicketData.php`

**Mode selection:**

| Params passed | Mode | Returns |
|---|---|---|
| `{ ticketId }` | Single ticket | Full ticket object |
| `{ achievementId }` | Achievement stats | Open ticket count for that achievement |
| `{ gameId }` | Game stats | Open ticket count for that game |
| `{ targetUser }` | Developer stats | Open/closed/resolved counts for that user |
| `{ c, o }` | Recent tickets | Paginated list of most recently filed tickets |
| `{ f: 1, c, o }` | Most ticketed games | Paginated list of games with most open tickets |

Returns the **raw API response** without additional camelCase mapping, because the shape
varies significantly between modes.

**Usage:**
```js
// Single ticket
const ticket = await getTicketData(username, apiKey, { ticketId: 12345 });

// Most recent 5 tickets
const recent = await getTicketData(username, apiKey, { c: 5 });

// Open tickets for a game
const gameTickets = await getTicketData(username, apiKey, { gameId: 228 });
```

---

## App Composites

These are the only functions `app.js` should call. They compose raw endpoint calls and add
sessionStorage caching.

---

### `fetchProfile(username, apiKey)`

Fires **5 parallel requests** on initial page load. No delay needed between them (all different endpoints).

Requests fired:
1. `API_GetUserProfile`
2. `API_GetUserSummary` (g=20, a=5)
3. `API_GetUserCompletionProgress` (all pages)
4. `API_GetUserAwards`
5. `API_GetAchievementsEarnedBetween` (last 6 months, chunk 0)

**Returns:** `{ profileData, firstChunkAchievements }`

- `firstChunkAchievements` — array of achievement unlock objects (last 6 months), used to seed the Activity tab and compute `points7Days`/`points30Days`.
- `profileData` — merged object consumed by `transformData()`:

```js
{
  metadata:    { extractionTimestamp: string },  // ISO datetime of this fetch
  coreProfile: {
    user, userPic, memberSince, richPresenceMsg,
    totalPoints, totalSoftcorePoints, totalTruePoints, motto
  },
  userSummary: {
    rank, totalRanked, softcoreRank, status,
    lastActivity: null  // not exposed in current API shape
  },
  gameAwardsAndProgress: {
    total:   number,
    results: [{ gameId, title, consoleName, imageIcon, numAwarded, numAwardedHardcore,
                maxPossible, highestAwardKind, highestAwardDate, mostRecentAwardedDate }]
  },
  pageAwards: {
    visibleUserAwards: [{ awardType, imageIcon, awardData, title, consoleName, awardedAt }]
  },
  recentlyPlayedGames:   [{ gameId, title, consoleName, lastPlayed, imageIcon,
                            imageIngame, imageTitle, numAchieved, numPossibleAchievements }],
  mostRecentGame:        { gameId, title, consoleName, lastPlayed, imageIcon } | null,
  mostRecentAchievement: { achievementId, title, description, points, trueRatio,
                           badgeName, hardcoreMode, gameId, gameTitle, gameIcon,
                           consoleName, date } | null,
  points7Days:  number,
  points30Days: number,
}
```

**Cache key:** `ra_profile_{username}` — TTL 5 minutes.

---

### `fetchAchievementsChunk(username, apiKey, chunkIndex)`

Fetches a 6-month window of achievements.

| `chunkIndex` | Time window |
|---|---|
| `0` | Most recent 6 months |
| `1` | 6–12 months ago |

**Returns:** `Array` — same shape as [`getAchievementsEarnedBetween`](#getachievementsearnedBetween).

**Cache key:** `ra_chunk_{username}_{chunkIndex}` — TTL 5 minutes.

> **Note:** The app uses `TOTAL_ACH_CHUNKS = 2` and loads both chunks eagerly when the
> Activity tab is first opened, with a 1-second stagger between them.

---

### `fetchWatchlist(username, apiKey)`

Fetches the full want-to-play list (all pages, 100/page, 1 s between pages).

**Returns:**
```js
{
  total:   number,
  results: [{ id, title, consoleName, imageIcon, pointsTotal, achievementsPublished }]
}
```

**Cache key:** `ra_watchlist_{username}` — TTL 5 minutes.

---

### `fetchGameDetails(username, apiKey, gameId)`

Fetches `API_GetGameInfoAndUserProgress` for a single game. Called lazily when a game modal
is opened and `game.achievements` is empty.

**Returns:**
```js
{
  userTotalPlaytime:          number | null,   // seconds — convert to h/m for display
  numAwardedToUser:           number,
  numAwardedToUserHardcore:   number,
  highestAwardKind:           string | null,
  highestAwardDate:           string | null,
  imageIngame:                string | null,
  imageTitle:                 string | null,
  parentGameId:               number | null,
  numDistinctPlayersCasual:   number,
  numDistinctPlayersHardcore: number,
  genre:                      string | null,
  developer:                  string | null,
  released:                   string | null,
  achievements: {
    "[id]": { id, title, description, points, trueRatio, badgeName, type, displayOrder,
              numAwarded, numAwardedHardcore, dateEarned, dateEarnedHardcore }
  }
}
```

**Cache key:** `ra_game_{username}_{gameId}` — TTL 5 minutes.

---

### `validateCredentials(username, apiKey)`

Makes a minimal `API_GetUserProfile` call. Used on the login page to verify credentials
before storing them.

**Returns:** raw profile object on success.  
**Throws:** `Error('AUTH_ERROR')` if credentials are invalid.
