---
id: CHV-018
title: 'Themes — Phase 3: Core/view split for Game'
status: To Do
assignee: []
created_date: '2026-09-27 02:35'
updated_date: '2026-09-27 02:55'
labels:
  - themes
milestone: m-0
dependencies:
  - CHV-016
documentation:
  - doc-011
priority: medium
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Same split as Profile for the Game page: game/core.js hooks + themes/default/game.js view. Zero visual change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 game/core.js covers achievements, filters/sort, friend comparison, leaderboards, community and lazy-load per tab
- [ ] #2 Default view contains no fetching or ra-api.js calls
- [ ] #3 useGamePage() return shape matches doc-011 §4.3
- [ ] #4 game/app.js deleted; view lives in themes/default/game.js
- [ ] #5 POC tab works on a POC subset page (?id=22862&tab=poc)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See doc-011 §2.3, §4.3, §9 Phase 3. Resolve CHV-014 (do first or drop) before starting.
1. game/selectors.js: filteredSorted, difficulty bands, totals, friendAchMap, POC glue.
2. game/core.js: useGamePage() with all 8 effects (per-tab lazy loads), friend compare flow incl. ra_fg_* session cache, comment paging, leaderboard expansion. Return shape per §4.3.
3. View reads page.* only; move to themes/default/game.js; delete game/app.js; update sw.js.
4. Fix docs/pages/game.md: per-tab lazy loading (not all on mount), Info tab id is 'details', new file layout.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Game page looks and behaves identically on desktop and 390px mobile
- [ ] #2 Changelog updated
<!-- DOD:END -->
