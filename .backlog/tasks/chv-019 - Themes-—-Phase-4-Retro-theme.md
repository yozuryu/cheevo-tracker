---
id: CHV-019
title: 'Themes — Phase 4: Retro theme'
status: To Do
assignee: []
created_date: '2026-09-27 02:35'
updated_date: '2026-09-27 02:58'
labels:
  - themes
milestone: m-0
dependencies:
  - CHV-017
  - CHV-018
documentation:
  - doc-011
priority: low
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generic 16-bit JRPG theme (decided 2026-09-27, not one specific game) for Profile and Game: blue gradient window boxes, bevelled borders, pixel font, hand cursor on the selected row. Spec: doc-011 §8.2.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Profile and Game fully themed incl. loading, empty, error states and modals
- [ ] #2 Phone layout at 390px with no horizontal scroll
- [ ] #3 Picker becomes visible with Default and Retro
- [ ] #4 Style only: no game art, logos or commercial fonts
- [ ] #5 Status and rarity palettes pass validate_palette.js on the Retro surface
- [ ] #6 prefers-reduced-motion disables cursor bob and window animations
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See doc-011 §7, §8.2, §9 Phase 4.
1. Confirm generic 16-bit look vs a specific game (open question 1).
2. themes/retro/theme.css: tokens, window, bevel, hand cursor (own SVG), segmented bars, pixel font setup, chrome variable overrides.
3. Validate status + rarity palettes against the window surface (dataviz validate_palette.js).
4. themes/retro/profile.js: status + command windows, all 7 tabs, game and compare modals, loading/empty/error, visitor mode, phone layout (horizontal command row).
5. themes/retro/game.js: header window, command list, list + detail window, filters, friend compare, leaderboards, community, hashes, POC as nested windows; phone detail as bottom sheet.
6. Registry pages: ['profile','game'] so the picker appears.
7. Parity table in doc-011 §9; changelog; docs note.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Changelog updated
<!-- DOD:END -->
