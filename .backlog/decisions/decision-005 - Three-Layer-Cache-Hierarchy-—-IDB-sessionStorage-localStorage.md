---
id: decision-005
title: 'Three-Layer Cache Hierarchy — IDB, sessionStorage, localStorage'
date: '2026-06-13 12:34'
status: accepted
---
## Context

The app makes many RA API calls that are expensive in latency (external network) and rate-limit budget. Different data has different freshness requirements: game catalogs rarely change, friend activity changes hourly, credentials never expire on their own. A single cache layer with one TTL does not fit all cases.

## Decision

Three cache layers, each with a distinct purpose:

| Layer | Storage | Used for | TTL |
|---|---|---|---|
| **IDB** (`cheevo_tracker`) | IndexedDB | Large structured data: games, consoles, progress, friend activity, backlog, friend list | 24 h per store |
| **sessionStorage** | sessionStorage | In-page ephemeral state: API responses that only need to survive a single page session | Page session |
| **localStorage** | localStorage | Small persistent values: credentials, settings flags, `ra_consoles` console list | Indefinite / 24 h |

API composites in `ra-api.js` check IDB first, fall back to a network fetch, and write results back to IDB. `sessionStorage` is used for data that is cheap to re-fetch on next page load but expensive to re-fetch mid-session (e.g. game details within the game page). `localStorage` holds only values that must survive across sessions and are small enough that quota is never a concern.

## Consequences

- **Good:** Fastest possible render — IDB hit avoids any network call.
- **Good:** Each data type gets appropriate freshness semantics.
- **Good:** sessionStorage auto-clears on tab close, preventing stale mid-session state.
- **Bad:** Three layers to reason about when debugging a caching bug.
- **Bad:** Purge Cache and Refresh Data must be carefully scoped to clear the right layers — implemented in `mobile-nav.js` and `assets/ui.js`.

