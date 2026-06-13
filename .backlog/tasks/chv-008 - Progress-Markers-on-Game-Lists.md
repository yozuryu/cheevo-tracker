---
id: CHV-008
title: Progress Markers on Game Lists
status: To Do
assignee: []
created_date: '2026-06-13 08:25'
updated_date: '2026-06-13 12:27'
labels:
  - idb-features
milestone: IDB-Powered Features
dependencies: []
documentation:
  - doc-003
priority: medium
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Show a thin left-border accent on any game the user has touched in the search page and console game list page. Dim blue for started, gold for mastered. Data from a single IDB read at page load — zero API calls.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 search/app.js loads progress map on mount via idbGetAllByIndex('progress', 'username', username)
- [ ] #2 console/app.js loads progress map on mount
- [ ] #3 Left-border accent: #1a4a70 (started), #e5b143 (mastered), no marker for untouched
- [ ] #4 Progress map built as Map<gameId, { earned, total }> for mastery check
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read search/app.js and console/app.js mount sequences to find insertion points
2. Add idbGetAllByIndex('progress', 'username', username) call on mount in both files; build Map<gameId, { earned, total }>
3. Add left-border accent to game row component in search/app.js — check map for gameId, apply #1a4a70 (started) or #e5b143 (mastered)
4. Repeat for console/app.js game list rows
5. Use inline style={{ borderLeft: '3px solid <color>' }} — dynamic value so follows the Tailwind/inline rule
6. Test with games that have 0, partial, and full achievements
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Markers appear on search page and console game list for known-played games
- [ ] #2 No marker shown for untouched games
- [ ] #3 No layout shift or width change on rows
- [ ] #4 Changelog updated
<!-- DOD:END -->
