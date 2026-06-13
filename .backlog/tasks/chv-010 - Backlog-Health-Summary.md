---
id: CHV-010
title: Backlog Health Summary
status: To Do
assignee: []
created_date: '2026-06-13 08:25'
updated_date: '2026-06-13 12:27'
labels:
  - idb-features
milestone: IDB-Powered Features
dependencies: []
documentation:
  - doc-005
priority: medium
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Compact stats strip at the top of the Backlog tab showing breakdown across all backlog games. Data from backlog x progress x games IDB join — zero API calls.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Shows total backlog games count
- [ ] #2 Shows Not started count (0 achievements earned)
- [ ] #3 Shows In progress count (>0 but <100% achievements)
- [ ] #4 Shows Mastered count (100% achievements)
- [ ] #5 Shows total achievements remaining across all backlog games (sum of numAchievements - earned)
- [ ] #6 Displayed as horizontal stat chips in the backlog header row, same style as existing 'X games' count
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read profile/app.js backlog tab header to find insertion point for stat chips
2. Reuse or share the progress Map built for CHV-007 if both are implemented together; otherwise load idbGetAllByIndex('progress', 'username', username) separately
3. Iterate backlog items: for each gameId look up progress map; classify as not-started / in-progress / mastered
4. Sum (numAchievements - earned) across all items for remaining count
5. Build horizontal stat chip component matching the existing 'X games' count style
6. Insert chips in backlog tab header row alongside existing count label
7. Recompute on backlog refresh
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Stat strip shows correct not-started / in-progress / mastered / remaining counts
- [ ] #2 Counts update correctly after a backlog refresh
- [ ] #3 Chips match existing visual style
- [ ] #4 Changelog updated
<!-- DOD:END -->
