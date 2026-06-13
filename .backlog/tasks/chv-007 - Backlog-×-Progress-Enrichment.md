---
id: CHV-007
title: Backlog × Progress Enrichment
status: To Do
assignee: []
created_date: '2026-06-13 08:25'
updated_date: '2026-06-13 12:27'
labels:
  - idb-features
milestone: IDB-Powered Features
dependencies: []
documentation:
  - doc-002
priority: medium
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Enrich each backlog row with real progress data from the progress IDB store. Show earned/total achievements, a progress bar, a status chip (Not started/In Progress/Mastered), a sort option by progress %, and a 'Started only' filter toggle.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Progress bar shows earned / numAchievements per backlog row
- [ ] #2 Status chip: Not started (gray), In Progress (blue >0 but <100%), Mastered (gold 100%)
- [ ] #3 Sort by progress % available (ascending = easiest to finish, descending = most invested)
- [ ] #4 'Started only' filter toggle hides unstarted games
- [ ] #5 Data sourced from progress IDB store via [username, gameId] join — zero API calls
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read profile/app.js backlog tab mount sequence to find insertion point
2. On backlog tab mount, call idbGetAllByIndex('progress', 'username', username) and build Map<gameId, { earned, total }>
3. Enrich each backlog row with earned/total from the map
4. Add progress bar component to backlog row (gold at 100%)
5. Add status chip component: Not started / In Progress / Mastered with correct colours
6. Add sort-by-progress option to existing sort controls (ascending = easiest to finish)
7. Add Started only filter toggle to existing filter controls
8. Handle missing progress entries gracefully (game not yet played = Not started)
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Tested in browser — progress bar and chips render correctly for not-started, in-progress, and mastered games
- [ ] #2 Sort by progress % and Started only filter work correctly
- [ ] #3 No mobile layout regressions
- [ ] #4 Changelog updated
<!-- DOD:END -->
