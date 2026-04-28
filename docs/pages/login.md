# Login Page

**Files:** `index.html` + `login.js`  
**URL:** `/`  
**Auth required:** No

## Flow

1. On mount: call `getCredentials()`. If valid creds exist → `window.location.replace('./profile/')` immediately.
2. User submits username + API key.
3. Call `validateCredentials(u, k)`.
   - Success → `localStorage.setItem('raCredentials', JSON.stringify({ username, apiKey }))` → redirect to `./profile/`
   - `AUTH_ERROR` → show "Invalid username or API key" message
   - Other error → show "Could not connect" message
4. Show spinner while `checking` (initial auth check) or `loading` (form submit).

## Credentials Storage

```js
localStorage.setItem('raCredentials', JSON.stringify({ username, apiKey }));
```

Read by all pages via `getCredentials()` from `ra-api.js`.

## API Key Source

Users find their API key at [retroachievements.org/settings](https://retroachievements.org/settings). Link this in any user-facing help text.

## Mobile

Centered column layout at all sizes — no layout switch at `md`. The form is `max-w-md mx-auto` and fills the viewport on mobile with `px-4 py-12`.

No bottom nav on the login page (no `mobile-nav.js` injected — it's at the root, not inside a page directory).

## What Not to Add

- No "remember me" toggle — credentials are always persisted in localStorage.
- No registration — users must already have a RA account.
- No OAuth — RA uses username + API key auth only.
