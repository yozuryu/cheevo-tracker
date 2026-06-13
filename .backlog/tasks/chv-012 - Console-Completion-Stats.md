---
id: CHV-012
title: Console Completion % Stats
status: To Do
assignee: []
created_date: '2026-06-13 08:26'
updated_date: '2026-06-13 12:27'
labels:
  - console-page
milestone: Page Enhancements
dependencies: []
documentation:
  - doc-007
priority: medium
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Show library completion stats per console on the console page — % of total games played (>=1 achievement) and % mastered (pctWon >= 1.0). Data fetched lazily per console via IntersectionObserver to avoid hammering the API on page load.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Stat strip under each console name: X / Y played, Z mastered
- [ ] #2 Thin progress bar showing played % with mastered % overlay (brighter fill)
- [ ] #3 Data loaded lazily via IntersectionObserver as user scrolls
- [ ] #4 Shown only when credentials exist and data is loaded; skeleton shimmer while loading
- [ ] #5 Cross-references fetchConsoleGames (IDB-cached) with user progress IDB store
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read console/app.js console list render to understand current row structure
2. Load progress map once on mount: idbGetAllByIndex('progress', 'username', username) → Set<gameId> for played, Map<gameId, pctWon> for mastered check
3. Set up IntersectionObserver on each console row element
4. On intersection: call fetchConsoleGames(consoleId); cross-reference games list with progress map to count played (numAchieved > 0) and mastered (pctWon >= 1.0)
5. Render stat strip under console name: 'X / Y played · Z mastered'
6. Render dual progress bar: played % as base fill (#1a9fff), mastered % as overlay (brighter/gold)
7. Show skeleton shimmer while data loads; skip entirely if no credentials
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Stat strip and progress bar appear under each console row
- [ ] #2 Lazy-loads correctly via IntersectionObserver without blocking page render
- [ ] #3 Skeleton shimmer shown during load, hidden once data resolves
- [ ] #4 No regressions on console list scroll or click navigation
- [ ] #5 Changelog updated
<!-- DOD:END -->
