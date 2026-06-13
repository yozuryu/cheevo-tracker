---
id: decision-001
title: No Build Step — Static Site with CDN React
date: '2026-06-13 12:34'
status: accepted
---
## Context

This is a personal tool hosted on GitHub Pages (static hosting only). The developer wants to iterate quickly without a local dev environment setup cost. npm, webpack, Vite, and TypeScript all add friction — dependency installs, config files, build commands, and a more complex deployment pipeline.

## Decision

Use React, ReactDOM, Lucide, and Babel loaded directly from CDN via `<script>` tags and an import map. JSX is transpiled in-browser by Babel Standalone at runtime. No npm install, no bundler, no build step. Deployment is a plain `git push`.

CDN versions are pinned explicitly in each page's import map (e.g. `react@18.2.0`, `lucide-react@0.263.1`) to prevent surprise breakage from upstream updates.

`assets/ui.js` is the one exception — it uses `React.createElement` directly (no JSX) because it is loaded as a plain `<script>` outside the Babel pipeline.

## Consequences

- **Good:** Zero setup friction. Any text editor + browser works. GitHub Pages deploys automatically on push.
- **Good:** No node_modules, no lock file churn, no build cache invalidation issues.
- **Bad:** In-browser Babel transpilation adds ~300ms parse cost on first load (mitigated by service worker caching).
- **Bad:** No TypeScript, no tree-shaking, no code splitting. Bundle size is unconstrained.
- **Bad:** CDN dependency — offline dev requires service worker cache to be warm.

