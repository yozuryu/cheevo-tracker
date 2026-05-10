# Todo

## Mobile Menu / Settings Unification

### Goal

Unify the menu and settings experience across mobile and desktop so both surfaces expose the same actions without navigating to a separate settings page on mobile.

### Current state

**Desktop (topbar `MenuDropdown` in `assets/ui.js`):**
- Consoles · Changelog · Refresh Data · Purge Cache · Debug toggle · Log Out

**Mobile (bottom nav in `assets/mobile-nav.js`):**
- Profile · Progress · Activity · Consoles · Social · Settings (links to `/settings/` page)

The mobile bottom nav has a dedicated Settings tab that navigates to a full page. The desktop has a hamburger menu in the topbar covering app-level actions. There is no inline settings panel on mobile.

### What to change

**Mobile bottom nav (`assets/mobile-nav.js`):**
- Replace the Settings tab with a **Menu** tab (hamburger icon) — nav stays at 6 tabs, Settings → Menu, no tab is dropped
- Menu tab opens the slide-up sheet instead of navigating away

**Slide-up menu sheet (new, mobile only):**
- Triggered by tapping the Menu tab; dismissed by tapping the backdrop or tapping Menu again
- Slides up from the bottom, full-width, dark backdrop
- Lives in `assets/mobile-nav.js` as a pure DOM addition (no JSX) — runs on every page automatically; Debug toggle dispatches `CustomEvent('raDebugModeChange')` same as the existing settings page does
- **Content (merge of settings page + desktop dropdown):** username display · Consoles · Changelog · Refresh Data · Purge Cache · Debug toggle · Log Out
  - Username pulled from `localStorage.getItem('raCredentials')`
  - Backlog shortcut omitted — already reachable via the profile tab

**Settings page (`/settings/`):**
- Remove entirely — content fully covered by slide-up sheet + desktop dropdown
- Delete `settings/index.html`, `settings/app.js`
- Remove from `sw.js` precache list and bump `CACHE_NAME` to force cache invalidation
- Remove Settings link from mobile nav (replaced by Menu tab above)

**Menu animations:**
- Desktop `MenuDropdown` (`assets/ui.js`): animate **entry only** — short slide-down + fade-in on open (~150ms ease-out); skip close animation to avoid the complexity of keeping the element mounted after `open` goes false
- Mobile slide-up sheet: animate in (`translateY(100%) → translateY(0)`) with backdrop fade-in (~200ms ease-out); reverse on dismiss (~150ms ease-in) using a CSS class swap before removing from DOM

---

## Game Page — Desktop Single-Page Layout

On desktop (`md:` and above), hide the tab bar and display all sections simultaneously in a structured layout. Mobile keeps the existing tab behaviour unchanged.

### Layout structure

```
┌─────────────────────────────────────────────────────┐
│                  Hero + Stats strip                  │  full width (existing)
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│   Achievements               │   Info               │
│   (filter/sort + list)       │   Time to Beat       │
│                              │   Links              │
│   flex-1, min-w-0            │   ──────────────     │
│                              │   Hashes             │
│                              │   w-[320px] shrink-0 │
│                              │                      │
├──────────────────────────────┴──────────────────────┤
│   Leaderboards                                       │
│   ┌─────────────────┬──────────────────────────┐    │
│   │  Top Scorers    │  Board list (accordion)  │    │
│   │  1fr            │  2fr                     │    │
│   └─────────────────┴──────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│   Community                                          │
│   ┌─────────────────┬──────────────────────────┐    │
│   │  Recent Masters │  Comments + load more    │    │
│   │  1fr            │  2fr                     │    │
│   └─────────────────┴──────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Rationale:**
- Achievements is the primary content → full height left column, no vertical cap
- Info + Hashes are compact metadata → right sidebar, stacked; Hashes fits here as utility content (ROM lookup)
- Leaderboards and Community each benefit from full width but have a natural internal 2-col split (summary left, detail right)
- This mirrors how gaming sites like RA itself or HowLongToBeat lay out game pages

### Implementation

**Tab bar:** `md:hidden` — hidden on desktop, visible on mobile as before

**Section visibility logic** — each section div uses:
```jsx
className={`${tab === 'sectionId' ? 'block' : 'hidden'} md:block`}
```
Mobile: only active tab section visible. Desktop: all sections always visible.

**Top area wrapper** (inside `max-w-4xl mx-auto px-4 md:px-8`):
```jsx
<div className="md:flex md:items-start md:gap-6 py-4">
  {/* Achievements — left column */}
  <div className="md:flex-1 md:min-w-0 ...">...</div>

  {/* Right sidebar */}
  <div className="md:w-[320px] md:shrink-0 md:flex md:flex-col md:gap-5">
    {/* Info section */}
    {/* Hashes section */}
  </div>
</div>
```

**Leaderboards section** (full width, `max-w-4xl mx-auto px-4 md:px-8 py-4`):
```jsx
<div className="md:grid md:grid-cols-[1fr_2fr] md:gap-6">
  {/* Top Scorers */}
  {/* Board list */}
</div>
```

**Community section** (full width, same wrapper):
```jsx
<div className="md:grid md:grid-cols-[1fr_2fr] md:gap-6">
  {/* Recent Masters */}
  {/* Comments */}
</div>
```

A `border-t border-[#2a475e]` divider separates the top two-column area from Leaderboards, and Leaderboards from Community.

### Data fetching on desktop

On mobile, each section lazy-loads when its tab is first opened. On desktop, all sections are visible on page load so lazy-loading by tab is useless.

**Strategy:** at mount, detect viewport with `window.matchMedia('(min-width: 768px)').matches`. If desktop, fire all section fetches eagerly in parallel alongside the main fetch:
- `getGameProgression` + `getGameExtended` (Info/Achievements enrichment)
- `getGameLeaderboards` + `getUserGameLeaderboards` + `getGameRankAndScore(t=0)` (Leaderboards)
- `getGameRankAndScore(t=1)` + `getComments` (Community)
- `getGameHashes` (Hashes)

On mobile, keep existing lazy-load per tab as-is. The state variables and fetch functions are the same — only the trigger changes.

### Section headers on desktop sidebar

In the right sidebar on desktop, Info and Hashes need their own section headers (they have them in tab view already — just ensure they're visible in sidebar context too). No change needed — headers are always rendered inside each section.

### Scroll behaviour

No scroll containers within sections — everything flows naturally in the page scroll. The sticky tab bar on mobile remains sticky; on desktop it is hidden so no sticky element is needed below the hero.
