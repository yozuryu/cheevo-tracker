---
id: CHV-011
title: Friends Weekly Leaderboard
status: To Do
assignee: []
created_date: '2026-06-13 08:25'
updated_date: '2026-06-13 12:27'
labels:
  - idb-features
milestone: IDB-Powered Features
dependencies: []
documentation:
  - doc-006
priority: medium
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rank followed users by achievements earned or points gained in the last 7 days, computed from cached friend_activity IDB data. Zero API calls.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Filters friend_activity achievements where date >= 7 days ago per user, sums points and count
- [ ] #2 Compact ranked list: rank, avatar, username, achievements this week, points this week
- [ ] #3 Own row included (from progress store)
- [ ] #4 Shown in Activity tab Friends view — above the feed or as a toggle
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read profile/app.js Social/Activity tab friends feed render to find insertion point
2. After fetchFriendsActivity resolves, compute leaderboard: for each friend filter achievements where date >= now - 7 days; sum points and count
3. Fetch own 7-day stats from progress store (idbGetAllByIndex + date filter)
4. Sort all rows descending by points; assign rank numbers
5. Build compact ranked list component: rank, avatar, username, achievements this week, points this week
6. Include own row with distinct visual treatment (highlighted)
7. Render above the feed or as a collapsible toggle — decide based on how crowded the tab is
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Leaderboard ranks friends correctly by weekly points
- [ ] #2 Own row included and visually distinct
- [ ] #3 Handles users with no friend_activity data gracefully (shows 0)
- [ ] #4 No regressions on existing friends feed
- [ ] #5 Changelog updated
<!-- DOD:END -->
