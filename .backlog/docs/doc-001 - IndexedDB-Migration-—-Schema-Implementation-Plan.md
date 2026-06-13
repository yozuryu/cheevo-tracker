---
id: doc-001
title: IndexedDB Migration — Schema & Implementation Plan
type: specification
created_date: '2026-06-13 08:22'
updated_date: '2026-06-13 08:22'
---
## Overview

Replace scattered localStorage API cache with a single, normalized IndexedDB named **cheevo_tracker**. The existing cheevo_search IDB is renamed — all code that opens it switches to cheevo_tracker. `deleteDatabase('cheevo_search')` is called once on first open of cheevo_tracker to clean up the old DB.

## Schema — cheevo_tracker v1

### consoles (keyPath: id)
- id: number — PK
- name: string
- fetchedAt: number — ms timestamp, replaces meta.consolesFetched

### games (keyPath: id, index: consoleId)
- id: number — PK
- title: string
- imageIcon: string
- numAchievements: number
- points: number
- consoleId: number — FK → consoles.id
- Note: consoleName removed — always join from consoles.name

### progress (keyPath: [username, gameId], index: username)
- username: string — PK part 1
- gameId: number — PK part 2, FK → games.id
- ts: number — ms timestamp
- numAchieved: number
- pctWon: number
- hardcoreMode: boolean
- mostRecentAchievementDate: string | null
- Replaces: ra_chunk_{username}_{chunkIndex} — no more chunking, one row per game

### friend_activity (keyPath: username)
- username: string — PK
- ts: number — ms timestamp
- achievements: { achievementId, gameId, date, type, points, badgeName, title }[]
- Note: gameId stored, NOT gameTitle/gameIcon — resolve from games store
- Replaces: ra_fa_{username}

### backlog (keyPath: username)
- username: string — PK
- ts: number — ms timestamp
- items: { gameId, addedAt }[]
- Note: no title/icon stored — resolve from games store on render
- Replaces: ra_backlog_{username}

### friend_list (keyPath: username)
- username: string — PK
- ts: number — ms timestamp
- following: array
- followers: array
- Replaces: ra_social_{username}

### meta (no keyPath — key-value store)
- 'lastFullFetch' → number ms timestamp of last full index run

## What This Eliminates

| Removed from localStorage | Replaced by |
|---|---|
| ra_consolegames_{id} | games + consoles stores (consoleId index + fetchedAt) |
| ra_chunk_{user}_{n} | progress store (one row per game, compound key) |
| ra_fa_{user} | friend_activity store |
| ra_backlog_{user} | backlog store |
| ra_social_{user} | friend_list store |

consoleName is no longer stored redundantly in games — every render resolves it via `consoles.get(consoleId).name`. The consolesFetched meta key is replaced by fetchedAt directly on each consoles row.

## Priority Order

backlog and friends list first — users explicitly manage these on RA so they know when something changed and expect a manual refresh option. Both get a 24h stale time and an explicit Refresh button. Everything else follows.

## Phase Summary

- Phase 0: Foundation — openDB(), db() singleton, purge cache handlers
- Phase 1: Backlog store — IDB-backed with 24h TTL + Refresh button
- Phase 2: Friends list + friend_activity stores — 24h TTL + Refresh button
- Phase 3: Console games + search page — consoles + games stores, drop ra_consolegames_*
- Phase 4: Progress chunks — progress store, drop ra_chunk_* sessionStorage
- Phase 5: Cleanup — remove dead exports, verify no legacy keys remain
