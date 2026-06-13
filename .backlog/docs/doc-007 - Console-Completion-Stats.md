---
id: doc-007
title: Console Completion % Stats
type: specification
created_date: '2026-06-13 12:10'
updated_date: '2026-06-13 12:14'
---
## Overview

Show library completion stats per console on the console page — what % of that console's total game count the user has played at least one achievement in, and what % they've mastered. Data fetched lazily via IntersectionObserver to avoid hammering the API on load.

## Data Sources

- **Console game list:** `fetchConsoleGames(consoleId)` — IDB-cached 24h; gives total game count and per-game data
- **User's played games:** `progress` IDB store — games with `numAchieved > 0` are "played", games with `pctWon >= 1.0` are "mastered"
- Cross-reference by `gameId` to compute played and mastered counts

## Display

Compact stat strip under each console name:

- `X / Y played` — games touched out of total
- `Z mastered` — games at 100%
- Thin progress bar: played % fill with mastered % overlay (brighter fill)
- Skeleton shimmer while loading; hidden if no credentials

## Implementation

Data fetched per-console lazily as the user scrolls (IntersectionObserver) so the page doesn't hammer the API on load. Each console row triggers its own `fetchConsoleGames` call when it enters the viewport; progress map loaded once from IDB on mount.
