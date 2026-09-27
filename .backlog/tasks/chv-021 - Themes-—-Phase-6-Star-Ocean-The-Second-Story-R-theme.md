---
id: CHV-021
title: 'Themes — Phase 6: Star Ocean The Second Story R theme'
status: To Do
assignee: []
created_date: '2026-09-27 02:35'
updated_date: '2026-09-27 02:55'
labels:
  - themes
milestone: m-0
dependencies:
  - CHV-019
documentation:
  - doc-011
priority: low
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
JRPG theme after SO2R's menus; achievements as a Battle Trophies-style list, profile as a status screen. Needs reference screenshots.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Profile and Game fully themed incl. loading, empty, error states and modals
- [ ] #2 Phone layout at 390px with no horizontal scroll
- [ ] #3 Style only: no game art, logos or commercial fonts
- [ ] #4 Theme spec in doc-011 §8.4 completed and reviewed before implementation
- [ ] #5 Status and rarity palettes pass validate_palette.js on the theme surface
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See doc-011 §7, §8.4, §8.6, §9.
1. Collect reference screenshots (§8.6 list); keep them out of the repo.
2. Write the full theme spec into doc-011 §8.4 before building: tokens, fonts, frames/ornaments, selection style, Profile and Game layouts for desktop and phone.
3. theme.css + palette validation (§7).
4. profile.js and game.js covering every tab, modal, state and visitor mode.
5. Registry pages; parity table; changelog.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Changelog updated
<!-- DOD:END -->
