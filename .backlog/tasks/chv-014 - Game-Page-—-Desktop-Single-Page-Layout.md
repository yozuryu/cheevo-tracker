---
id: CHV-014
title: Game Page — Desktop Single-Page Layout
status: To Do
assignee: []
created_date: '2026-06-13 12:07'
updated_date: '2026-06-13 12:28'
labels:
  - game-page
milestone: Game Page Desktop Layout
dependencies: []
documentation:
  - doc-009
priority: high
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On desktop (md: and above), hide the tab bar and display all game page sections simultaneously in a structured two-column layout. Mobile keeps existing tab behaviour unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tab bar hidden on desktop via md:hidden; all sections visible via md:block
- [ ] #2 Top area: Achievements in left flex-1 column, Info + Hashes stacked in right w-[320px] sidebar
- [ ] #3 Leaderboards section: full width, md:grid grid-cols-[1fr_2fr] (Top Scorers left, Board list right)
- [ ] #4 Community section: full width, md:grid grid-cols-[1fr_2fr] (Recent Masters left, Comments right)
- [ ] #5 border-t border-[#2a475e] dividers between top area, Leaderboards, and Community
- [ ] #6 On desktop mount, all section fetches fire eagerly in parallel
- [ ] #7 Mobile lazy-load per tab unchanged
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read game/app.js in full — understand tab state variable, all section components, and per-tab fetch triggers
2. Add isDesktop const at component mount: window.matchMedia('(min-width: 768px)').matches
3. Add md:hidden to the tab bar element
4. Update each section div visibility: change hidden/block logic to include md:block so all sections visible on desktop
5. Wrap the top area (Achievements + Info/Hashes) in a flex container: md:flex md:items-start md:gap-6
6. Set Achievements column to md:flex-1 md:min-w-0 and right sidebar to md:w-[320px] md:shrink-0 md:flex md:flex-col md:gap-5
7. Wrap Leaderboards inner content in md:grid md:grid-cols-[1fr_2fr] md:gap-6; add border-t border-[#2a475e] above section
8. Wrap Community inner content in md:grid md:grid-cols-[1fr_2fr] md:gap-6; add border-t border-[#2a475e] above section
9. On desktop isDesktop=true, fire all fetches eagerly in parallel at mount: getGameProgression, getGameExtended, getGameLeaderboards, getUserGameLeaderboards, getGameRankAndScore(t=0), getGameRankAndScore(t=1), getComments, getGameHashes
10. Verify mobile: tab bar still shows, only active section visible, lazy-load per tab unchanged
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Desktop shows all sections simultaneously in two-column layout
- [ ] #2 Mobile tab bar and lazy-load behaviour unchanged
- [ ] #3 All section data loads on desktop page open without manual tab switching
- [ ] #4 No horizontal overflow or layout break at md breakpoint transition
- [ ] #5 Changelog updated
<!-- DOD:END -->
