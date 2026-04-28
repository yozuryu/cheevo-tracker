# cheevo-tracker — Claude Context

## Working Style

- **Give honest opinions.** Direct answer when asked for a preference — no diplomatic deflection.
- **Push back before implementing bad ideas.** If a request seems like poor UX, visual, or technical decision, say so and explain why. Confirm before proceeding.
- **Discuss before building when uncertain.** Especially for UI/UX decisions — a short discussion upfront prevents rework.

---

## What This Repo Is

Personal RetroAchievements profile tracker. Static site — React, Tailwind, Lucide via CDN, Babel JSX in-browser. All RA data fetched live from the RA API using credentials stored in the user's browser. No build step, no backend.

---

## Detailed Documentation

| Topic | File |
|---|---|
| Repo layout, tech stack, data flow, caching, auth, PWA | [`docs/architecture.md`](docs/architecture.md) |
| Global rules: styling, design system, code conventions, changelog | [`docs/rules.md`](docs/rules.md) |
| Login page | [`docs/pages/login.md`](docs/pages/login.md) |
| Profile page (tabs, mount sequence, modals, compare, visitor mode) | [`docs/pages/profile.md`](docs/pages/profile.md) |
| Game page (achievements, friend comparison, leaderboards) | [`docs/pages/game.md`](docs/pages/game.md) |
| Achievement page | [`docs/pages/achievement.md`](docs/pages/achievement.md) |
| Console page | [`docs/pages/console.md`](docs/pages/console.md) |
| Settings page | [`docs/pages/settings.md`](docs/pages/settings.md) |
| Changelog page | [`docs/pages/changelog.md`](docs/pages/changelog.md) |
| `ra-api.js` full endpoint reference | [`profile/utils/ra-api.md`](profile/utils/ra-api.md) |

---

## Hard Rules (Read First)

These are enforced on every task. Details in the linked docs.

**API**
- Never call `raFetch` or read PascalCase raw fields from `app.js`. Call exported composites from `ra-api.js` only.
- Never bypass `transformData` to build UI state from raw API data.

**Code structure**
- No build tools, no npm, no TypeScript.
- All components for a page live in one `app.js`. No separate component files.
- `assets/ui.js` uses `React.createElement` (no JSX) — it is not processed by Babel.

**Auth**
- Every page calls `getCredentials()` on mount. Null → `handleAuthError()` → clear localStorage → redirect to `../`.
- Any `AUTH_ERROR` from an API call also triggers `handleAuthError()`.

**Styling**
- Tailwind `className` for fixed styles. Inline `style={{}}` for dynamic values. `<style>` + `@keyframes` for animations.
- No CSS files.

**Changelog**
- **Always update `changelog.md` after every code change.** Do not wait to be asked.
- Format: `## vYY.MM.DD`. If today's entry exists, add to it — never create a duplicate header.
- Section order: RetroAchievements, Auth, Structure.
