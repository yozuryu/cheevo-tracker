---
id: CHV-004
title: 'IDB Migration — Phase 3: Console Games + Search Page'
status: Done
assignee: []
created_date: '2026-06-13 08:23'
updated_date: '2026-06-13 12:28'
labels:
  - idb-migration
milestone: IDB Migration
dependencies: []
documentation:
  - doc-001
priority: high
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Redirect ra_consolegames_* localStorage reads to the existing consoles + games IDB stores from Phase 0. Drop consoleName from games store writes. Update search/app.js to resolve console name via consoles store join.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 fetchConsoleGames cache hit checks consoles.get(consoleId).fetchedAt < 24h then reads games by consoleId index
- [x] #2 fetchConsoleGames miss/stale fetches from API, upserts consoles with fetchedAt, writes games rows
- [x] #3 consoleName field dropped from games store writes; callers resolve via getAllGamesFromDB join
- [x] #4 search/app.js resolves console name via consoles store when rendering results
- [x] #5 ra_consolegames_* localStorage reads/writes removed
- [x] #6 'Synced X ago' label added to search page header
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed. fetchConsoleGames reads from consoles+games IDB stores. consoleName dropped from games writes, resolved via getAllGamesFromDB join. search/app.js resolves console name from consoles store. Synced X ago label added to search header. ra_consolegames_* localStorage removed.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tested in browser — feature works end-to-end
- [x] #2 No regressions on related pages
- [x] #3 Changelog updated
<!-- DOD:END -->
