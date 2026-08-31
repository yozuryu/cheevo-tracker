# Console Page

**File:** `console/app.js`  
**URL:** `/console/?id=<consoleId>`  
**Auth required:** Yes

## Data Fetched on Mount

- Console list via `fetchConsoles()` — used to resolve the console name from the ID
- Game list via `fetchConsoleGames(consoleId)` — full list of games for the console
- Completion map via `fetchCompletionMap()` — feeds the coverage strip. Failure is swallowed (the strip just doesn't render); only `AUTH_ERROR` propagates to `handleAuthError()`.

## Constants

- `PUBLISHER_MAP` — maps publisher IDs to display names
- `ERA_MAP` — maps console IDs to historical era labels (e.g., "8-bit", "16-bit", "32-bit")

## Features

- Filterable/sortable game list
- Links to `/game/?id=<gameId>` for each game
- Shows achievement count per game

## Coverage Strip

Sits above the search box on `GameListView`. Renders only once both `games` and `completion` have resolved.

Computed in a `useMemo` over games with `numAchievements > 0` (the denominator — achievement *sets*, not the raw game count in the header):

| Field | Meaning |
|---|---|
| `total` | Games on this console that have an achievement set |
| `played` | Of those, games with a `completion[gameId].numAwarded > 0` |
| `mastered` | Of those, games where `numAwarded >= maxPossible` |

Single bar, two segments: gold (`#e5b143`) for mastered, blue (`#66c0f4`) for played-but-not-mastered, both as a share of `total`.

## Mobile

### Header

```jsx
<main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 pt-8 pb-5 md:pt-5">
```

### Game grid

`grid-cols-2 md:grid-cols-3` — two columns on mobile, three on desktop.

### Breadcrumb

The word "Consoles" in the breadcrumb is `hidden md:inline` — omitted on mobile to save space.
