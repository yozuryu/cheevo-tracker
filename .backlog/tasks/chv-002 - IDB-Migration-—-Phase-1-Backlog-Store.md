---
id: CHV-002
title: 'IDB Migration — Phase 1: Backlog Store'
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
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrate ra_backlog_{username} localStorage to the backlog IDB store. 24h stale time, explicit Refresh button in the Backlog tab header with spinner and 'Synced X ago' label.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 getBacklog(username) reads backlog IDB store, returns { ts, items } or null
- [x] #2 setBacklog(username, items) writes { username, ts, items } to backlog store
- [x] #3 clearBacklog(username) deletes record from backlog store
- [x] #4 fetchBacklog uses 24h TTL: cache hit returns IDB data, miss/stale fetches from API and writes to IDB
- [x] #5 Backlog tab mounts from IDB first (instant render) then checks staleness
- [x] #6 Refresh button in Backlog tab header with spinner, calls fetchBacklog(force=true)
- [x] #7 'Synced X ago' label derived from IDB ts field
- [x] #8 ra_backlog_* localStorage reads/writes removed
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed. IDB-backed backlog store with 24h TTL, Refresh button with spinner and Synced X ago label. ra_backlog_* localStorage fully removed.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tested in browser — feature works end-to-end
- [x] #2 No regressions on related pages
- [x] #3 Changelog updated
<!-- DOD:END -->
