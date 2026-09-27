---
id: CHV-017
title: 'Themes — Phase 2: Core/view split for Profile'
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
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Move Profile page state, fetching and actions into profile/core.js hooks (no JSX) and the markup into themes/default/profile.js. Zero visual change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 profile/core.js exposes hooks returning data + actions for every tab, modal, filter, sort, compare and visitor mode
- [ ] #2 Default view contains no fetching or ra-api.js calls
- [ ] #3 All ra-api.js / transformData hard rules still hold
- [ ] #4 profile/selectors.js functions are pure (no React, no fetch) and match previous outputs on a fixture
- [ ] #5 useProfilePage() return shape matches doc-011 §4.2
- [ ] #6 profile/app.js deleted; view lives in themes/default/profile.js
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See doc-011 §2.2, §3, §4.2, §9 Phase 2. Small commits, QA after each.
1. profile/selectors.js: move pure computations one at a time (progress buckets, heatmapData, ActivityTab heatmap/timeline/feed memos, Series cards, Stats streaks/pace/acquisition/timeline/consoles/rarity, Compare sharedGames/sorted, Social sort, modal filteredAchs). Components call them inside useMemo.
2. Compare selector outputs before/after against a saved profileData fixture in Node.
3. profile/core.js: useProfilePage() owns App state, effects and actions; lift data-affecting sub-component state (modal filters, compare/social sort, feed groupMode) into it. Return shape per §4.2.
4. App renders from page.* only; presentational state (pill, scroll-top, expanded panels, visibleSessionCount) stays in the view.
5. Move the view to themes/default/profile.js with @ct/ imports; point registry at it; delete profile/app.js; update sw.js PRECACHE.
6. Update docs/pages/profile.md.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Profile looks and behaves identically on desktop and 390px mobile
- [ ] #2 Changelog updated
<!-- DOD:END -->
