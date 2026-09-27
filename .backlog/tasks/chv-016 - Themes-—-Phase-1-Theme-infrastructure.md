---
id: CHV-016
title: 'Themes — Phase 1: Theme infrastructure'
status: To Do
assignee: []
created_date: '2026-09-27 02:35'
updated_date: '2026-09-27 02:55'
labels:
  - themes
milestone: m-0
dependencies: []
documentation:
  - doc-011
priority: medium
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Loader, registry and picker for game-UI themes (doc-011, decision-007). Ships with only the Default theme; the picker stays hidden until a second theme exists.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 themes/registry.js lists themes, names, implemented pages and preview colors
- [ ] #2 Inline script in themed pages' index.html reads localStorage.raTheme and writes the active theme's view script and theme.css before Babel runs; unknown/missing value or unimplemented page falls back to default
- [ ] #3 Import-map alias (e.g. @ct/) so theme files import core modules without page-relative paths
- [ ] #4 Theme picker in the mobile menu sheet and desktop Topbar, reloads on change; Refresh Data does not reset raTheme
- [ ] #5 Shared chrome (mobile-nav.js, ui.js, pwa-install.js) reads CSS variables so themes can restyle it
- [ ] #6 CLAUDE.md, docs/rules.md, docs/architecture.md updated; decision-007 accepted
- [ ] #7 Service-worker strategy decided and implemented; theme files served fresh after deploy
- [ ] #8 Loader failure (404/offline) falls back to Default without a reload loop
- [ ] #9 ?theme= URL override works for one page load without saving
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
See doc-011 §5, §6, §9 Phase 1.
1. Decide service-worker strategy (§6.3, open question 2) and implement it.
2. Add themes/registry.js, themes/loader.js, themes/base.css, themes/default/theme.css.
3. Prototype the loader first: confirm Babel standalone picks up the view script (document.write vs head.appendChild).
4. Profile + Game index.html: registry + loader in <head> before Babel, '@ct/': '../' import-map alias, remove the direct app.js script tag (registry points Default at profile/app.js and game/app.js until Phases 2-3).
5. Move index.html inline colors and .shimmer to --ct-* variables; load base.css on every page.
6. Convert mobile-nav.js, ui.js, pwa-install.js hex values to var(--ct-*, fallback) (§6.1 table).
7. Theme picker in Menu sheet + MenuDropdown (hidden while only Default is visible); ?theme= override.
8. Loader failure fallback: reload once with ?theme=default (sessionStorage guard).
9. Update CLAUDE.md, docs/rules.md, docs/architecture.md (§11); mark decision-007 accepted.
10. QA §10 (Default only): screenshot compare desktop + 390px on every page.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 No visual change with the Default theme
- [ ] #2 Changelog updated
<!-- DOD:END -->
