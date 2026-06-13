---
name: cheevo-tracker
description: Project-level skills for the cheevo-tracker RetroAchievements profile tracker. Provides specialised workflows for this codebase — changelog writing, page scaffolding, RA API endpoint wiring, and docs maintenance. Use these skills whenever working in this repo.
---

# cheevo-tracker

Personal RetroAchievements profile tracker. Static site — React 18, Tailwind, Lucide via CDN, Babel JSX in-browser. No build step, no backend.

## Project Skills

### `write-changelog`
Write or update `changelog.md` after any code change. Knows the `## vYY.MM.DD` format, all valid section names and their order, and the grep-first deduplication workflow. **Always run this after finishing a feature or fix.**

### `new-page`
Scaffold a new page (`index.html` + `app.js`) with the exact CDN versions, shimmer CSS, importmap, auth pattern, mobile layout rules, and shared imports pre-filled correctly.

### `add-ra-endpoint`
Add a new RA API endpoint to `profile/utils/ra-api.js`. Covers the two-layer architecture (raw wrapper → camelCase map, app composite → sessionStorage/IDB cache), cache key conventions, `AUTH_ERROR` handling, and updating `ra-api.md`.

### `update-docs`
Update `docs/pages/*.md`, `docs/rules.md`, or `docs/architecture.md` when page behaviour changes. Knows which doc maps to which page and what each doc's sections cover.

## Key Rules

- No build tools, no npm, no TypeScript. Plain JS + in-browser Babel.
- All components for a page live in one `app.js` — no separate component files.
- Never call `raFetch` directly from `app.js`. Use exported composites from `ra-api.js` only.
- Every page calls `getCredentials()` on mount; null → `handleAuthError()` → redirect.
- Tailwind `className` for fixed styles, inline `style={{}}` for dynamic values, `<style>` + `@keyframes` for animations. No CSS files.
- Full rules: `docs/rules.md` · Architecture: `docs/architecture.md`
