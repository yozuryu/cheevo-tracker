---
id: CHV-020
title: 'Themes — Phase 5: Final Fantasy XVI theme'
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
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Minimal dark theme after FFXVI's menus: thin lines, serif titles, lots of space; Game page as an Active Time Lore-style list + detail. Needs reference screenshots.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Profile and Game fully themed incl. loading, empty, error states and modals
- [ ] #2 Phone layout at 390px with no horizontal scroll
- [ ] #3 Style only: no game art, logos or commercial fonts
- [ ] #4 Theme spec in doc-011 §8.3 completed and reviewed before implementation
- [ ] #5 Status and rarity palettes pass validate_palette.js on the theme surface
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See doc-011 §7, §8.3, §8.6, §9.
1. Collect reference screenshots (§8.6 list); keep them out of the repo.
2. Write the full theme spec into doc-011 §8.3 before building: tokens, fonts, frames/ornaments, selection style, Profile and Game layouts for desktop and phone.
3. theme.css + palette validation (§7).
4. profile.js and game.js covering every tab, modal, state and visitor mode.
5. Registry pages; parity table; changelog.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Changelog updated
<!-- DOD:END -->
