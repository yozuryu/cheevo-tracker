---
id: doc-002
title: Backlog × Progress Enrichment
type: specification
created_date: '2026-06-13 12:10'
updated_date: '2026-06-13 12:10'
---
## Overview

Enrich each backlog row with real progress data from the `progress` IDB store. Currently each backlog row is blind to how far along you are.

## Data Join

`backlog.items[].gameId` × `progress` store filtered by `[username, gameId]` → count earned achievements. `games` store gives `numAchievements` total for the progress bar denominator.

## Display Additions Per Row

- **Progress bar:** earned / total achievements (gold at 100%)
- **Status chip:**
  - `Not started` — gray, 0 earned
  - `In Progress` — blue, >0 but <100%
  - `Mastered` — gold, 100%
- **Sort option:** by progress % (ascending = easiest to finish, descending = most invested)
- **Filter:** "Started only" toggle to focus on in-progress games

## Note on "Beaten"

RA's beaten status requires knowing which achievements are Win Condition type — not stored in the current `progress` rows (only events, not types). Omit beaten until achievement type data is added to the progress store.

## Cost

Zero API calls — single IDB join across `backlog`, `progress`, and `games` stores at render time.
