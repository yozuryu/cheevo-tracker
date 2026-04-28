# Changelog Page

**File:** `changelog/app.js`  
**URL:** `/changelog/`  
**Auth required:** No

## Data Source

Fetches `/changelog.md` at runtime (network-first via service worker — always fresh).

## Parsing

`parseChangelog(md)` splits the markdown into:

```js
[{
  date: string,          // "v26.04.28"
  summary: string|null,  // one-line summary after the version header
  sections: [{
    title: string,       // e.g. "RetroAchievements"
    entries: string[],   // bullet point text
  }]
}]
```

Inline code (backtick-wrapped) is rendered as `<code>` via `renderText()`.

## Section Order & Colors

Sections render in this order (defined in `SECTION_ORDER`):

1. Auth
2. RetroAchievements
3. Console Page
4. (additional sections alphabetically)

Each section has a distinct accent color for its badge.

## Mobile

Single-column list at all sizes. No layout differences between mobile and desktop — entries are full-width and stack vertically.

No bottom nav inject — the changelog page is at `/changelog/`, which is one of the two mobile nav tabs. The mobile nav is injected via `mobile-nav.js` in `index.html`.

## Changelog Format (Source File)

See `docs/rules.md` → Changelog section for the format to write in `changelog.md`.
