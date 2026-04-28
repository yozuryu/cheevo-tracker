# Global Rules & Guidelines

Rules that apply to every file in this repo. Page-specific rules are in `docs/pages/`.

## Code Structure

- **One `app.js` per page.** All components for a page live in that file. No separate component files.
- **Sub-components at module level**, not inline in render. Define `function MyRow(...)` outside the parent component.
- **No build tools.** No npm, no bundler, no TypeScript. Plain `.js` files with JSX transpiled in-browser by Babel.
- **`assets/ui.js` uses `React.createElement`, not JSX.** It is loaded as a native ES module, not processed by Babel.

## Styling

| Use | When |
|---|---|
| Tailwind `className` | Fixed structural styles |
| Inline `style={{}}` | Dynamic values (colors from data, computed widths) |
| `<style>` tag with `@keyframes` | CSS animations — inject inside the React return |

- Arbitrary Tailwind values are fine: `text-[11px]`, `w-[140px]`, `tracking-[0.07em]`.
- Do not use CSS files. No external stylesheets beyond the CDN Tailwind script.

## Design System

### Colors

```
Background:        #171a21
Card bg:           #1b2838
Card bg hover:     #202d39
Card bg dark:      #131a22   (topbar, FAB buttons)
Border:            #2a475e
Border dark:       #101214   (inner/inset)
Text primary:      #c6d4df
Text secondary:    #8f98a0
Text muted:        #546270

RA gold:           #e5b143
Cyan accent:       #57cbde
Blue:              #66c0f4
```

### Stat number colors (by semantic meaning)

| Color | Hex | Used for |
|---|---|---|
| Gold | `#e5b143` | Earned value: Points, Mastered |
| White | `#c6d4df` | Identity: Rank |
| Blue | `#66c0f4` | Engagement: Achievements |
| Gray | `#8f98a0` | Lesser tier: Beaten |
| Muted | `#546270` | Context/breadth: Games |

### Completion status colors

| Status | Color |
|---|---|
| Mastered | `#e5b143` (gold) |
| Beaten | `#8f98a0` (gray) |
| In Progress | `#66c0f4` (blue) |
| Not started / border | `#323f4c` |

### Tilde tag colors

| Tag | Color |
|---|---|
| Hack | `#ff6b6b` |
| Homebrew | `#66c0f4` |
| Demo | `#57cbde` |
| Prototype | `#8f98a0` |

### Section headers

Consistent pattern across all pages:

```jsx
<span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
<span className="text-[13px] text-white tracking-wide uppercase font-medium">Title</span>
```

Use `#e5b143` (gold) for RA data sections. Use `#66c0f4` (blue) for activity/engagement sections.

### Typography

- Font: `'Segoe UI', Arial, sans-serif`
- Sizes: 7–15px (compact, dashboard-style)
- Labels: `uppercase tracking-[0.07em]` or `tracking-[0.1em]` with `font-semibold`
- Border radius: 2–3px

### Shimmer skeleton

Defined in each page's `index.html` `<style>` block. Class: `.shimmer`. Use on loading placeholders while data is null.

### Scroll-to-top button

```jsx
<button className="scroll-top-btn w-10 h-10 rounded-full bg-[#131a22] border border-[#2a475e] active:scale-90">
```

Class `scroll-top-btn` is required — `mobile-nav.js` repositions it above the nav bar.

## Mobile Rules

### Breakpoint

`md` = 768px. This is the only breakpoint used for layout switches. `sm` (640px) is used sparingly for grid column counts and secondary details.

### Page headers

All page headers use `pt-8 pb-5 md:pt-5`. The extra `pt-8` compensates for the hidden Topbar breadcrumb on mobile. Apply to every new page.

### Bottom navigation (`assets/mobile-nav.js`)

- Visible only on screens < 768px. Injects a fixed bottom bar with two tabs: Profile and Log.
- Hides `.page-topbar` and `footer` on mobile. Adds `padding-bottom` to body.
- Repositions `.scroll-top-btn` above the nav bar — always use class `scroll-top-btn` on the FAB.

### Content padding

All page `<main>` sections use `px-4 md:px-8`. Sticky bars that span edge-to-edge use `-mx-4 md:-mx-8`.

### Tab bars (sticky)

All sticky tab bars use `top-0 md:top-[26px]` — on desktop the global Topbar is 26px tall.

### Layout direction

Headers and content areas switch from column to row at `md`:

```jsx
<div className="flex flex-col md:flex-row items-center md:items-start gap-5">
```

Text alignment: `text-center md:text-left` inside `flex-col md:flex-row` headers.

### Icon sizes

Page hero icons (game box art, achievement badge, avatar) scale up at `md`:

| Context | Mobile | Desktop |
|---|---|---|
| Profile / User avatar | `w-20 h-20` | `w-24 h-24` |
| Game box art (game page header) | `w-16 h-16` | `w-20 h-20` |
| Achievement badge (achievement header) | `w-16 h-16` | `w-28 h-28` |

### Hiding / showing elements

| Pattern | When to use |
|---|---|
| `hidden md:block` | Desktop-only element |
| `block md:hidden` | Mobile-only element (icon labels in compact tabs) |
| `hidden md:inline` | Desktop-only inline text (breadcrumb words) |
| `sm:hidden` | Elements visible only on mobile (abbreviated hints) |

## Auth Pattern

Every page that requires credentials follows this pattern:

```js
const creds = getCredentials();
if (!creds) { handleAuthError(); return; }
```

```js
function handleAuthError() {
  clearCredentials();
  window.location.replace('../');
}
```

Wrap every API call in a try/catch and call `handleAuthError()` if `err.message === 'AUTH_ERROR'`.

## API Usage

- **Never call `raFetch` directly from `app.js`.** Use exported composites from `ra-api.js`.
- **Never access PascalCase raw fields in `app.js`.** Everything from `ra-api.js` is camelCase.
- **Never bypass `transformData`.** All derived UI state (progress %, mastery status, subset parsing) lives in `transform.js`.
- Rate limit same-endpoint pagination: internal `paginate()` helper sleeps 1 s between pages. Do not add extra delays for `Promise.all` across different endpoints.

## Comments

Write no comments unless the WHY is non-obvious. One short line max. No docstrings. No multi-line comment blocks.

## Changelog

**Update `changelog.md` after every change.** Do not wait for the user to ask.

- Version: `## vYY.MM.DD` (e.g. `## v26.04.28`)
- If an entry for today exists, add to it — never create a duplicate date header.
- One-line summary after the version header.
- `### SectionName` subsections per area changed.
- Section order: RetroAchievements, Auth, Structure.
