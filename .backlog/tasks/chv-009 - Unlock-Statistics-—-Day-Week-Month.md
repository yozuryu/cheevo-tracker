---
id: CHV-009
title: Unlock Statistics — Day / Week / Month
status: To Do
assignee: []
created_date: '2026-06-13 08:25'
updated_date: '2026-06-13 12:27'
labels:
  - idb-features
milestone: IDB-Powered Features
dependencies: []
documentation:
  - doc-004
priority: low
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Personal analytics computed entirely from the progress IDB store. No API calls. Placed as a Stats sub-section in the Activity tab or a dedicated Stats tab.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Points and achievement count per day (last 30 days)
- [ ] #2 Points and achievement count per week (last 12 weeks)
- [ ] #3 Points and achievement count per month (last 12 months)
- [ ] #4 Current unlock streak (consecutive days with >=1 unlock)
- [ ] #5 Best all-time streak from available data
- [ ] #6 Most active day of the week (Mon-Sun average)
- [ ] #7 Average unlocks per active day
- [ ] #8 Data sourced from single idbGetAllByIndex('progress', 'username', username) — zero API calls
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read profile/app.js Activity tab to identify insertion point beneath the heatmap
2. On Activity tab mount, call idbGetAllByIndex('progress', 'username', username); flatten all achievement dates from progress rows
3. Compute day buckets: group by YYYY-MM-DD, sum points and count (last 30 days)
4. Compute week buckets: ISO week grouping, sum points and count (last 12 weeks)
5. Compute month buckets: YYYY-MM grouping, sum points and count (last 12 months)
6. Compute current streak: sort unique days descending, count consecutive days from today
7. Compute best streak: scan all unique sorted days for longest consecutive run
8. Compute day-of-week distribution: group by getDay(), average per active day
9. Build StatsSection component with bar charts or stat tables; insert beneath heatmap in Activity tab
10. Handle users with no data gracefully (empty state message)
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 All 7 metrics render correctly with real data
- [ ] #2 Empty state shown gracefully when no progress data exists
- [ ] #3 No regressions on Activity tab heatmap or feed
- [ ] #4 Changelog updated
<!-- DOD:END -->
