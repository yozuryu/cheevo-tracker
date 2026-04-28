# Achievement Page

**File:** `achievement/app.js`  
**URL:** `/achievement/?id=<achievementId>`  
**Auth required:** Yes

## Tabs

| Tab | Contents |
|---|---|
| Unlocks | List of players who unlocked the achievement (HC + SC) |
| Comments | RA achievement comment thread |
| Changelog | RA achievement revision history |

## Data Fetched

- `getAchievementUnlocks(username, apiKey, { a: achievementId })` — unlock list (HC + SC)
- `getGameInfoAndUserProgress(username, apiKey, { g: gameId })` — game context + user's unlock status
- `getComments(username, apiKey, { t: 2, i: achievementId })` — achievement comments

Game ID is extracted from the achievement data returned by `getGameInfoAndUserProgress`.

## Mobile

### Header

```jsx
<div className="relative max-w-3xl mx-auto px-4 md:px-8 pt-8 pb-4 md:pt-5">
  <div className="w-16 h-16 md:w-28 md:h-28 ...">  {/* badge — larger on desktop */}
```

The badge grows significantly at `md` (`w-16 → w-28`) because achievement pages are detail-focused.

### Stats bar

`grid grid-flow-col auto-cols-fr` — equal-width columns at all sizes.

### Filter bar

Sticky at `top-0 md:top-[26px]`. Full-width across `max-w-3xl` container.

### Content

Full-width single-column list at all sizes. No layout shift between mobile and desktop.
