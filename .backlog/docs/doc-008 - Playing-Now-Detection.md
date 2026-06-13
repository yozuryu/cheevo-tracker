---
id: doc-008
title: Playing Now Detection
type: specification
created_date: '2026-06-13 12:10'
updated_date: '2026-06-13 12:14'
---
## Overview

Surface a subtle live indicator in the friends feed when a friend earned achievements within the last 30 minutes — making the feed feel closer to real-time. No extra API calls; uses already-cached `friend_activity` data.

## Detection Logic

In `fetchFriendsActivity`, the most recent achievement timestamp per user is already available. After loading (status `done`), compute:

```js
const PLAYING_NOW_MS = 30 * 60 * 1000;
const isPlayingNow = (achievements) =>
  achievements.length > 0 &&
  Date.now() - new Date(achievements[0].date).getTime() < PLAYING_NOW_MS;
```

## Display

- Small green pulsing dot next to the avatar on sessions where the user is playing now
- CSS `ping` animation with a solid inner dot (Tailwind `animate-ping` pattern)
- Colour: `#57de8f` (green — distinct from the existing blue/gold palette)
- Shown on existing session rows only — no separate "online" section; keeps it subtle

## Caveats

- Timestamps come from the RA API and reflect server-side earn time; clock skew under a minute is expected
- 30-minute window matches a typical gaming session gap — short enough to feel live, long enough to survive brief pauses
