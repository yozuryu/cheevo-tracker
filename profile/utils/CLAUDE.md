# profile/utils — Claude Context

## ra-api.js

Full endpoint reference: [`ra-api.md`](ra-api.md)

### Two-layer design

**Layer 1 — raw endpoint functions** (one per RA API endpoint):
- Named after the RA API function in camelCase: `getUserProfile`, `getUserSummary`, `getGameInfoAndUserProgress`, etc.
- Pure fetch + PascalCase → camelCase mapping. No caching. No side effects.
- Signature: `(username, apiKey, params)` → typed camelCase object.

**Layer 2 — app composites** (the only functions called from `app.js`):

| Function | Cache key | What it does |
|---|---|---|
| `fetchProfile(u, k)` | `ra_profile_{u}` | 5 parallel requests on mount; returns `{ profileData, firstChunkAchievements }` |
| `fetchAchievementsChunk(u, k, idx)` | `ra_chunk_{u}_{idx}` | 6-month achievement window by index (0 = latest) |
| `fetchWatchlist(u, k)` | `ra_watchlist_{u}` | Full want-to-play list, all pages |
| `fetchGameDetails(u, k, gameId)` | `ra_game_{u}_{gameId}` | Game metadata + per-achievement user progress incl. `userTotalPlaytime` |
| `validateCredentials(u, k)` | — | Minimal profile call; throws `AUTH_ERROR` if invalid |

All composites cache in sessionStorage with a 5-minute TTL (`CACHE_TTL = 5 * 60 * 1000`).

### Rules

- Raw RA API responses are PascalCase (`GameID`, `NumAwarded`, …). Everything exported from `ra-api.js` is camelCase.
- Do **not** call `raFetch` or read raw fields from `app.js` — always go through exported functions.
- Same-endpoint pagination loops sleep 1 s between pages (internal `paginate()` helper).
- `fetchProfile` fires 5 **different** endpoints in `Promise.all` — no delay needed between them.
- Cache invalidation before 5 minutes: `sessionStorage.clear()` or remove individual keys by name.

### `profileData` shape (returned by `fetchProfile`, consumed by `transformData`)

```
{
  metadata:              { extractionTimestamp }
  coreProfile:           { user, userPic, memberSince, richPresenceMsg, totalPoints,
                           totalSoftcorePoints, totalTruePoints, motto }
  userSummary:           { rank, totalRanked, softcoreRank, status, lastActivity }
  gameAwardsAndProgress: { total, results: [{ gameId, title, consoleName, imageIcon,
                           numAwarded, numAwardedHardcore, maxPossible,
                           highestAwardKind, highestAwardDate, mostRecentAwardedDate }] }
  pageAwards:            { visibleUserAwards: [{ awardType, imageIcon, awardData,
                           title, consoleName, awardedAt }] }
  recentlyPlayedGames:   [{ gameId, title, consoleName, lastPlayed, imageIcon,
                           imageIngame, imageTitle, numAchieved, numPossibleAchievements }]
  mostRecentGame:        { gameId, title, consoleName, lastPlayed, imageIcon } | null
  mostRecentAchievement: { achievementId, title, description, points, trueRatio,
                           badgeName, hardcoreMode, gameId, gameTitle, gameIcon,
                           consoleName, date } | null
  points7Days:           number
  points30Days:          number
}
```

---

## transform.js

Consumes the `rawData` memo from `app.js` and returns `{ profile, games, backlog }`.

```
rawData = {
  ...profileData,         // from fetchProfile()
  wantToPlayList,         // from fetchWatchlist(), null until watchlist tab opens
  recentAchievements: [], // not used directly — achievements handled via achievementChunks
  detailedGameProgress,   // lazy-populated per game via fetchGameDetails()
}
```

Do not bypass `transformData` to build UI state from raw API data. All merging and
derived fields (progress %, mastery, subset parsing, etc.) live here.

---

## helpers.js

Pure utility functions — no API calls, no state.

| Function | Purpose |
|---|---|
| `getMediaUrl(path)` | Prepends `MEDIA_URL` to an RA image path |
| `formatTimeAgo(date, refTime)` | Human-readable relative time ("3 days ago") |
| `formatDate(date)` | Short formatted date string |
| `parseTitle(title)` | Parses `~Tag~` prefixes and `[Subset - Name]` suffixes from RA game titles |

---

## constants.js

| Export | Value |
|---|---|
| `MEDIA_URL` | `https://media.retroachievements.org` |
| `SITE_URL` | `https://retroachievements.org` |
| `TILDE_TAG_COLORS` | Map of tag name → hex color |
