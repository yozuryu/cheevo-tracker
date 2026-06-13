---
id: CHV-013
title: Playing Now Detection in Friends Feed
status: To Do
assignee: []
created_date: '2026-06-13 08:26'
updated_date: '2026-06-13 12:28'
labels:
  - social
milestone: Page Enhancements
dependencies: []
documentation:
  - doc-008
priority: low
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Surface a subtle green pulsing dot on friend sessions in the friends feed when a friend earned achievements within the last 30 minutes, making the feed feel closer to real-time.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 isPlayingNow: achievements[0].date within 30 minutes of Date.now()
- [ ] #2 Green pulsing dot (color: #57de8f) next to avatar for playing-now sessions using CSS ping animation
- [ ] #3 Dot shown on existing session rows only — no separate online section
- [ ] #4 Handles clock skew gracefully; 30-minute window matches typical gaming session gap
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read profile/app.js friends feed session row render to find avatar element
2. Add isPlayingNow helper: achievements.length > 0 && Date.now() - new Date(achievements[0].date).getTime() < 30 * 60 * 1000
3. Add green pulsing dot element adjacent to avatar in session row when isPlayingNow is true
4. Style with <style> + @keyframes ping (outer ring) + solid inner dot; colour #57de8f
5. No Tailwind animate-ping — implement keyframes directly per project no-build convention
6. Test visually by temporarily lowering threshold to confirm animation fires
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Pulsing dot appears on sessions with achievements in the last 30 minutes
- [ ] #2 No dot shown on older sessions
- [ ] #3 Animation is subtle and does not cause layout shift
- [ ] #4 Changelog updated
<!-- DOD:END -->
