# Settings Page — removed

The standalone settings page (`settings/app.js`, `/settings/`) **no longer exists.** It was
removed in `e9af883` when its actions moved into the mobile slide-up menu sheet. The `settings/`
directory is an empty leftover.

Those actions now live in `assets/mobile-nav.js`, in the sheet opened from the Menu nav slot:

| Action | What it does |
|---|---|
| Refresh Data | Clears `sessionStorage`, all `ra_*` localStorage keys, and the ephemeral IDB stores (`progress`, `friend_activity`, `backlog`, `friend_list`, `meta`) — keeps the `consoles`/`games` catalog |
| Purge Cache | Deletes every service-worker cache and reloads; leaves all IDB data intact |
| Debug Mode | Toggles `raDebugMode` in localStorage and fires a `raDebugModeChange` event |
| Log Out | Removes `raCredentials` and redirects to `/` |

On desktop the same actions are reached from the Topbar. This file is kept as a pointer so links
to it don't dead-end.
