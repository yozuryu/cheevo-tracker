---
id: decision-002
title: IndexedDB over localStorage for API Cache
date: '2026-06-13 12:34'
status: accepted
---
## Context

The app originally cached RA API responses in localStorage using chunked keys (`ra_chunk_{user}_{n}`, `ra_consolegames_{id}`, `ra_fa_{user}`, etc.). localStorage has a hard 5–10 MB quota per origin. A user with a large game library would hit quota errors, silently losing cached data. The chunked key scheme was also fragile and hard to query.

## Decision

Migrate all API cache to a single IndexedDB database named `cheevo_tracker` with structured object stores: `consoles`, `games`, `progress`, `friend_activity`, `backlog`, `friend_list`, `meta`. IDB has no practical quota limit (browser-managed, typically gigabytes). Data is stored as structured objects rather than serialised JSON strings, enabling index-based queries (e.g. all progress rows for a username without loading everything).

localStorage is retained only for small, simple values: credentials, settings flags, and the console list (`ra_consoles`) which is a short array.

## Consequences

- **Good:** Eliminates quota errors for large libraries.
- **Good:** Index queries (`getAll` by username index) replace O(n) localStorage key scans.
- **Good:** Single versioned schema is easier to reason about than scattered keys.
- **Bad:** IDB API is async and more verbose; wrapped with helpers (`idbGet`, `idbPut`, `idbGetAllByIndex`) to keep call sites clean.
- **Bad:** IDB is unavailable in some private browsing modes — handled with try/catch fallbacks.

