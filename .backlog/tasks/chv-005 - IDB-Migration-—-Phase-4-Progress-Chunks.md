---
id: CHV-005
title: 'IDB Migration — Phase 4: Progress Chunks'
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
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace ra_chunk_{username}_{n} sessionStorage chunk loader with fetchAllAchievements that writes one row per game to the progress IDB store. TTL stored in meta as progress_ts_{username}.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 fetchAllAchievements groups achievements by [username, gameId] rows in progress store
- [x] #2 Chunk-index loop removed — no more ra_chunk_{username}_{n} sessionStorage keys
- [x] #3 All callers that reassembled chunks updated to use allLoadedAchievements = achievements || [] (no merge step)
- [x] #4 clearProgress(username) helper added using username index + openKeyCursor delete loop
- [x] #5 fetchAllAchievements(forceRefresh=true) calls clearProgress internally
- [x] #6 ra_chunk_* sessionStorage reads/writes removed
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed. fetchAllAchievements writes one row per game to progress store. Chunk loop removed. clearProgress(username) helper added. forceRefresh=true calls clearProgress internally. ra_chunk_* sessionStorage fully removed.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tested in browser — feature works end-to-end
- [x] #2 No regressions on related pages
- [x] #3 Changelog updated
<!-- DOD:END -->
