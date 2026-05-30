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

1. RetroAchievements API — gold `#e5b143`
2. Auth — cyan `#57cbde`
3. Cache — cyan `#57cbde`
4. Structure — gray `#8f98a0`
5. Profile — blue `#66c0f4`
6. Social — blue `#66c0f4`
7. Game Page — gray `#8f98a0`
8. Console Page — gold `#e5b143`
9. Achievement Page — cyan `#57cbde`
10. Backlog — blue `#66c0f4`
11. Settings — gray `#8f98a0`
12. Search — blue `#66c0f4`
13. Navigation — blue `#66c0f4`
14. Polish — dark gray `#546270`
15. User Page — gold `#e5b143`

Unknown sections fall back to gray `#8f98a0`.

## Mobile

Single-column list at all sizes. No layout differences between mobile and desktop — entries are full-width and stack vertically.

No bottom nav inject — the changelog page is at `/changelog/`, which is one of the two mobile nav tabs. The mobile nav is injected via `mobile-nav.js` in `index.html`.

## Changelog Format (Source File)

See `docs/rules.md` → Changelog section for the format to write in `changelog.md`.
