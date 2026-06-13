---
id: CHV-006
title: 'IDB Migration — Phase 5: Cleanup & Verification'
status: Done
assignee: []
created_date: '2026-06-13 08:24'
updated_date: '2026-06-13 12:28'
labels:
  - idb-migration
milestone: IDB Migration
dependencies: []
documentation:
  - doc-001
priority: high
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove dead exports, verify no legacy localStorage/sessionStorage keys remain in any read/write path, confirm Purge Cache correctly wipes cheevo_tracker IDB.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 updateAllGamesForConsole export removed (now internal to fetchConsoleGames); clearAllGamesStore removed
- [x] #2 No ra_fa_, ra_chunk_, ra_consolegames_, ra_backlog_, ra_social_ keys remain in any read/write path
- [x] #3 ra_consoles (console list, 24h localStorage TTL) confirmed as only remaining active localStorage key
- [x] #4 search/app.js imports unchanged — export names preserved during migration
- [x] #5 Purge Cache in assets/ui.js and mobile-nav.js calls indexedDB.deleteDatabase('cheevo_tracker') + sessionStorage.clear() + clears ra_* localStorage keys
- [x] #6 Changelog updated
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed. Dead exports removed. Verified no legacy ra_fa_, ra_chunk_, ra_consolegames_, ra_backlog_, ra_social_ keys remain. Only ra_consoles (console list) kept in localStorage. Purge Cache correctly targets cheevo_tracker IDB. Changelog updated.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tested in browser — feature works end-to-end
- [x] #2 No regressions on related pages
- [x] #3 Changelog updated
<!-- DOD:END -->
