---
id: doc-009
title: Game Page — Desktop Single-Page Layout
type: specification
created_date: '2026-06-13 12:10'
updated_date: '2026-06-13 12:15'
---
## Overview

On desktop (`md:` and above), hide the tab bar and display all game page sections simultaneously in a structured layout. Mobile keeps the existing tab behaviour unchanged.

## Layout Structure

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

## Implementation

**Tab bar:** `md:hidden` — hidden on desktop, visible on mobile as before.

**Section visibility:**
```jsx
className={`${tab === 'sectionId' ? 'block' : 'hidden'} md:block`}
```

**Top area wrapper:**
```jsx
<div className="md:flex md:items-start md:gap-6 py-4">
  {/* Achievements — left column */}
  <div className="md:flex-1 md:min-w-0">...</div>
  {/* Right sidebar */}
  <div className="md:w-[320px] md:shrink-0 md:flex md:flex-col md:gap-5">
    {/* Info + Hashes */}
  </div>
</div>
```

**Leaderboards + Community** (full width):
```jsx
<div className="md:grid md:grid-cols-[1fr_2fr] md:gap-6">...</div>
```

`border-t border-[#2a475e]` dividers between top area, Leaderboards, and Community.

## Data Fetching on Desktop

On mobile, each section lazy-loads when its tab is first opened. On desktop, all sections are visible immediately.

**Strategy:** at mount, detect viewport with `window.matchMedia('(min-width: 768px)').matches`. If desktop, fire all fetches eagerly in parallel:

- `getGameProgression` + `getGameExtended` (Info/Achievements)
- `getGameLeaderboards` + `getUserGameLeaderboards` + `getGameRankAndScore(t=0)` (Leaderboards)
- `getGameRankAndScore(t=1)` + `getComments` (Community)
- `getGameHashes` (Hashes)

Mobile keeps existing lazy-load per tab unchanged.
