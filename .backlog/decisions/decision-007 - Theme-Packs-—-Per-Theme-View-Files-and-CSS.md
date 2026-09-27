---
id: decision-007
title: Theme Packs — Per-Theme View Files and CSS
date: '2026-09-27 02:34'
status: proposed
---
## Context

Planned game-UI themes (doc-011) change layout, sizes and placement per theme, not just colors. That can't be done with one `app.js` per page and Tailwind classes alone. Babel standalone only transpiles `<script type="text/babel">` tags, so JSX can't be split into natively imported modules.

## Decision

Partially supersedes decision-003 and the "No CSS files" rule, **once the theme work is implemented**:

- Each themed page gets a `core.js` (hooks only, no JSX) that owns fetching, state and actions, still going through `ra-api.js` composites and `transformData`.
- Each theme gets one view file per page (`themes/<id>/<page>.js`, JSX) and one optional `theme.css`. Still no shared component library.
- An inline script in `index.html` picks the active theme (`localStorage.raTheme`) and writes only that theme's script and stylesheet before Babel runs. Pages a theme doesn't implement fall back to the default theme.

## Consequences

- **Good:** Themes can differ completely in layout; data and behaviour fixes are made once.
- **Good:** The core/view split makes the large pages easier to work in even with one theme.
- **Bad:** UI features can need building once per theme — mitigated by the "default first" rule (doc-011).
- **Bad:** Page logic now spans two files (core + view) instead of one.
