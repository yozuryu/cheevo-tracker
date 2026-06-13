---
id: CHV-001
title: 'IDB Migration — Phase 0: Foundation'
status: Done
assignee: []
created_date: '2026-06-13 08:22'
updated_date: '2026-06-13 12:28'
labels:
  - idb-migration
milestone: IDB Migration
dependencies: []
documentation:
  - doc-001
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create openDB() in ra-api.js replacing openSearchDB(). Opens cheevo_tracker v1 with all stores in onupgradeneeded. On first open calls indexedDB.deleteDatabase('cheevo_search'). Export db() lazy singleton. Update Purge Cache and Refresh Data in mobile-nav.js and assets/ui.js.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 openDB() opens cheevo_tracker v1 with stores: consoles, games, progress, friend_activity, backlog, friend_list, meta
- [x] #2 db() helper returns open connection as lazy singleton
- [x] #3 deleteDatabase('cheevo_search') called on first open of cheevo_tracker
- [x] #4 Purge Cache and Refresh Data in mobile-nav.js and assets/ui.js target cheevo_tracker
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed. openDB() creates cheevo_tracker v1 with all 7 stores. db() lazy singleton exported. deleteDatabase('cheevo_search') called on first open. mobile-nav.js and assets/ui.js updated to target cheevo_tracker.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tested in browser — feature works end-to-end
- [x] #2 No regressions on related pages
- [x] #3 Changelog updated
<!-- DOD:END -->
