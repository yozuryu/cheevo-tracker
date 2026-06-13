---
id: doc-006
title: Friends Weekly Leaderboard
type: specification
created_date: '2026-06-13 12:10'
updated_date: '2026-06-13 12:13'
---
## Overview

Rank followed users by achievements earned or points gained in the last 7 days, computed entirely from cached `friend_activity` IDB data. Zero API calls.

## Data

`friend_activity` store → per user, filter `achievements` where `date >= 7 days ago` → sum points and count achievements. Own row included (from `progress` store).

## Detection Logic

```js
const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
const weeklyAchievements = achievements.filter(a => new Date(a.date).getTime() >= since);
```

## Display

Compact ranked list shown in the Activity tab Friends view (above the feed, or as a toggle):

- Rank number
- Avatar + username
- Achievements earned this week
- Points gained this week

## Cost

Zero API calls — all data already in IDB from the friends feed load.
