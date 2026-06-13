---
id: CHV-003
title: 'IDB Migration — Phase 2: Friends List & friend_activity Stores'
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
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrate ra_social_* and ra_fa_* localStorage to friend_list and friend_activity IDB stores. 24h stale time. Refresh button in Social tab header refreshes both the following list and triggers re-fetch of all friend activity.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 getSocialData(username) reads friend_list IDB store, returns { ts, following, followers } or null
- [x] #2 setSocialData(username, data) writes to friend_list store
- [x] #3 fetchSocialData uses 24h IDB-backed TTL
- [x] #4 ra_fa_* lcacheGet/lcacheSet replaced with IDB get/put on friend_activity
- [x] #5 allFriendsCached uses single IDB getAll() instead of per-user localStorage loop
- [x] #6 Stale-mark loop replaced with IDB openCursor on friend_activity updating ts field
- [x] #7 Force-clear loop replaced with IDB clear() on friend_activity store
- [x] #8 Refresh button in Social tab header with spinner and 'Synced X ago' label
- [x] #9 ra_social_* and ra_fa_* localStorage reads/writes removed
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed. friend_list and friend_activity IDB stores live. allFriendsCached uses single getAll(). stale-mark and force-clear loops use IDB cursors. Refresh button in Social tab. All ra_social_* and ra_fa_* localStorage removed.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tested in browser — feature works end-to-end
- [x] #2 No regressions on related pages
- [x] #3 Changelog updated
<!-- DOD:END -->
