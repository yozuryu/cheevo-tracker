---
id: decision-003
title: Single app.js per Page — No Component Files
date: '2026-06-13 12:34'
status: accepted
---
## Context

Without a bundler, splitting components across multiple files would require either multiple `<script>` tags (order-dependent, global scope pollution) or ES module imports (which work but add latency per file on cold load). The app is a personal tool where each page is self-contained and relatively small.

## Decision

All React components for a given page live in a single `app.js` file co-located with that page's `index.html`. No separate component files, no shared component library across pages. Shared utilities (`ra-api.js`, `helpers.js`, `constants.js`, `transform.js`) live in `profile/utils/` and are imported as ES modules where needed.

The one structural exception is `assets/ui.js` — shared low-level UI primitives (icons, buttons) used across multiple pages, written in `React.createElement` form so it can be loaded as a plain script without Babel.

## Consequences

- **Good:** Each page is self-contained and easy to understand in isolation.
- **Good:** No import graph to trace when debugging a page.
- **Good:** No bundler needed — single script tag per page.
- **Bad:** Some component code is duplicated across pages (e.g. avatar components, shimmer skeletons).
- **Bad:** Large pages (profile, game) have long `app.js` files that require scrolling to navigate.

