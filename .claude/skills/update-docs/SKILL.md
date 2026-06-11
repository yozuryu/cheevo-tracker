---
name: update-docs
description: Update the docs/ documentation files in the cheevo-tracker project to reflect code changes. Use this skill when a page feature changes, a new component or tab is added, a fetch flow is modified, or any behaviour described in docs/ becomes stale. Also use it when the user says "update the docs", "keep docs in sync", or "document this". The skill knows which doc file maps to which page and what each doc covers so updates stay consistent with the existing format.
---

# Update Docs

## When to use

Update docs whenever you modify behaviour that is described in a doc file. Common triggers:

- Added or removed a tab, modal, or major component on a page
- Changed a fetch flow, lazy-load trigger, or cache strategy for a page
- Added new state variables or props that other contributors need to understand
- Changed mount sequence or auth flow on a page
- Added a new page (create the doc, then add it to the table in `CLAUDE.md`)

You don't need to update docs for pure styling tweaks, minor bug fixes, or internal refactors that don't change observable behaviour.

---

## Page → doc file map

| Page / area | Doc file |
|---|---|
| Login page (`index.html` / `login.js`) | `docs/pages/login.md` |
| Profile page (`profile/app.js`) | `docs/pages/profile.md` |
| Game page (`game/app.js`) | `docs/pages/game.md` |
| Achievement page (`achievement/app.js`) | `docs/pages/achievement.md` |
| Console page (`console/app.js`) | `docs/pages/console.md` |
| Settings page (`settings/`) | `docs/pages/settings.md` |
| Changelog page (`changelog/app.js`) | `docs/pages/changelog.md` |
| Global rules (styling, design system, auth, API rules) | `docs/rules.md` |
| Repo layout, stack, data flow, caching, PWA | `docs/architecture.md` |
| RA API client (`profile/utils/ra-api.js`) | `profile/utils/ra-api.md` |

---

## How each doc is structured

Before editing, read the target doc to understand its existing sections. Docs are written in Markdown with tables and fenced code blocks. Keep the same heading depth and table style as the rest of the file.

### `docs/pages/<page>.md` — typical sections

- **Tabs** — table of tab IDs, icons, URL params, notes
- **Mount Sequence** — what fetches fire on load and in what order
- **Lazy Loads** — what triggers deferred fetches (scroll, tab open, modal open)
- **State** — key `useState` / `useRef` variables with type and purpose
- **Fetch flow** — how a specific fetch works (steps, conditions, callbacks)
- **Component breakdown** — named sub-components and their responsibilities
- **Mobile** — responsive behaviour, breakpoints, hidden/visible rules

### `docs/rules.md` — global rules

Covers code structure, styling, design system (colors, typography, component patterns), mobile rules, auth pattern, API usage, and changelog rules. Update here when you change a convention that applies everywhere.

### `docs/architecture.md`

Covers stack, directory layout, shared utilities, data flow diagram, caching strategy, auth, PWA, mobile nav. Update here when you add a new page directory, change the caching strategy, or add a new shared utility.

### `profile/utils/ra-api.md`

Full endpoint reference. Update via the `add-ra-endpoint` skill — it handles the ra-api.md update as part of its workflow.

---

## How to edit

Use targeted edits — append to an existing section, update a table row, or insert a new section. Don't rewrite whole files. Match the voice and level of detail of surrounding content (terse, factual, no filler prose).

If a section in the doc no longer exists in the code, remove or update it rather than leaving stale information.

---

## After updating docs

Add a `### Structure` changelog entry noting the doc update, e.g.:
- Updated `docs/pages/profile.md` — added Friends feed group mode to Social Timeline section
