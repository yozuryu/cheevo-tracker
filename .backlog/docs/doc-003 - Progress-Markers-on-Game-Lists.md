---
id: doc-003
title: Progress Markers on Game Lists
type: specification
created_date: '2026-06-13 12:10'
updated_date: '2026-06-13 12:11'
---
## Overview

Show a small colored indicator on any game the user has touched, in both the search page and console game list page. Data from a single IDB read at page load — zero API calls.

## Data

`idbGetAllByIndex('progress', 'username', username)` → build a `Set<gameId>` of started games and a `Map<gameId, { earned, total }>` for mastery check. Cross-reference with the displayed game list.

## Marker Design

Thin left-border accent on the game row (same style as achievement card stripes):

| Color | Meaning |
|---|---|
| `#1a4a70` dim blue | Started — some progress |
| `#e5b143` gold | Mastered — earned === numAchievements |
| No marker | Untouched |

## Pages

- **search/app.js** — load user progress map once on mount alongside `getAllGamesFromDB`; apply to result rows
- **console/app.js** — load progress map once on mount; apply to game list rows

## Cost

Single IDB read at page load, zero API calls.
