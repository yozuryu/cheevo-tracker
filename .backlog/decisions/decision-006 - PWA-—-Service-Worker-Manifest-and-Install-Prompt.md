---
id: decision-006
title: 'PWA — Service Worker, Manifest, and Install Prompt'
date: '2026-06-13 12:36'
status: accepted
---
## Context

The app is a personal daily-use tool. Opening it via a browser bookmark adds friction compared to a home screen icon. The app already has all data cached locally in IDB and sessionStorage, so it can function meaningfully offline (cached pages load instantly; only live API calls fail). Making it installable as a PWA closes the gap between web and native app experience at zero cost given the existing static site + service worker setup.

## Decision

Three PWA components are in place:

**`manifest.json`** — declares `name`, `short_name`, `start_url`, `display: standalone`, theme/background colours, and 192×512 px icon set. Linked from every `index.html` via `<link rel="manifest">`.

**`sw.js`** (service worker) — cache-first strategy for all same-origin static assets (JS, HTML, icons); precaches a defined `PRECACHE` list on install. Network-first for `changelog.md` so it stays fresh. Cross-origin RA API calls pass through uncached. Cache is versioned by a timestamp constant (`CACHE_NAME`) — bumping it on deploy evicts the old cache.

**`assets/pwa-install.js`** — listens for `beforeinstallprompt`, slides up a 10-second install banner when the browser determines the app is installable. Auto-dismisses after 10 s; manual dismiss (×) sets a 7-day localStorage cooldown (`ra_pwa_dismissed_at`). Shown once per session via `sessionStorage`. Skipped entirely if already running in standalone mode. Injected via `<script>` tag into all 7 pages.

## Consequences

- **Good:** App is installable on Android and desktop Chrome; appears in home screen / app drawer.
- **Good:** Cached assets load instantly on repeat visits even on slow connections.
- **Good:** Offline mode works for previously loaded pages — cached HTML + JS renders immediately; IDB data is available; only live RA API calls fail.
- **Bad:** Service worker cache requires explicit versioning (`CACHE_NAME`) — forgetting to bump it after a deploy means users get stale JS.
- **Bad:** `beforeinstallprompt` is browser-controlled and fires only when the browser deems the app installable (engagement heuristic, HTTPS/localhost, valid manifest + SW) — the install banner cannot be force-shown.
- **Bad:** iOS Safari does not fire `beforeinstallprompt`; the install banner never shows on iOS. Users must use the Share → Add to Home Screen flow manually.

