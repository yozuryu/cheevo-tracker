---
id: decision-004
title: No Backend — Client-Side RA API Calls Only
date: '2026-06-13 12:34'
status: accepted
---
## Context

RetroAchievements provides a public API authenticated with a username + API key. The app needs to display personal profile data. Options were: (a) a backend proxy server that holds credentials and fetches on behalf of the user, or (b) direct client-side calls with credentials stored in the browser.

## Decision

All RA API calls are made directly from the browser using credentials (username + API key) stored in the user's own localStorage. There is no backend server, no proxy, and no server-side credential storage. The app is deployed purely as static files on GitHub Pages.

API calls go through `ra-api.js` which is the single authorised entry point — `app.js` files never call `raFetch` directly.

## Consequences

- **Good:** Zero hosting cost and zero server maintenance — GitHub Pages is free and has no moving parts.
- **Good:** User credentials never leave the user's own browser; no server-side breach risk.
- **Good:** No auth system to build or maintain.
- **Bad:** API key is visible in browser devtools to anyone with physical access to the device.
- **Bad:** CORS must be permitted by the RA API (it is, for their public endpoints).
- **Bad:** Cannot perform server-side aggregation, background sync, or push notifications.

