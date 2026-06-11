---
name: add-ra-endpoint
description: Add a new RetroAchievements API endpoint to ra-api.js in the cheevo-tracker project. Use this skill when the user wants to call a new RA API endpoint, add a raw wrapper, add an app composite with caching, or extend the API client. The skill knows the exact two-layer architecture (raw wrapper → camelCase map, app composite → sessionStorage cache), where to insert in the file, and how to update ra-api.md. Also use it when the user says "add an API call for X", "we need to fetch X from the RA API", or "wire up the X endpoint".
---

# Add a New RA API Endpoint

## Architecture recap

`profile/utils/ra-api.js` has two layers. Know which one(s) you need:

| Layer | What it is | Caching |
|---|---|---|
| **Raw wrapper** | One exported async function per RA endpoint. Calls `raFetch`, maps PascalCase → camelCase, returns plain object. | None |
| **App composite** | Higher-level function that `app.js` actually calls. Composes raw wrappers, adds sessionStorage (5-min TTL) or IDB cache. | sessionStorage or IDB |

`app.js` **never** calls `raFetch` directly and **never** reads PascalCase fields.

---

## Step 1 — Check the RA API docs reference

Read `profile/utils/ra-api.md` for the full endpoint list and existing wrappers before adding anything new — the endpoint may already exist.

---

## Step 2 — Write the raw wrapper

Place it in the appropriate section (User Endpoints, Game Endpoints, etc.) — grouped by resource type in the file.

```js
export async function getSomething(username, apiKey, { paramA, paramB } = {}) {
  const raw = await raFetch('API_GetSomething.php', username, apiKey, { a: paramA, b: paramB });
  return {
    fieldOne:   raw.FieldOne,
    fieldTwo:   raw.FieldTwo   || 0,
    fieldThree: raw.FieldThree || '',
    // map ALL fields you'll use; drop fields you won't
  };
}
```

Rules:
- Every key in the return object is **camelCase**. No PascalCase leaks out.
- Use `|| defaultValue` for optional/nullable fields so callers get a predictable shape.
- The function signature is always `(username, apiKey, { ...namedParams } = {})`.
- If the endpoint is paginated, use the internal `paginate()` helper instead of calling `raFetch` directly.

---

## Step 3 — Write the app composite (if needed)

Only add a composite if `app.js` needs to call this endpoint with caching. Not every raw wrapper needs one.

### sessionStorage composite (5-min TTL — for profile/game data)

```js
export async function fetchSomething(username, apiKey, { paramA } = {}) {
  const key = `ra_something_${username}`;
  const cached = scacheGet(key);
  if (cached) return cached;

  const data = await getSomething(username, apiKey, { paramA });
  scacheSet(key, data);
  return data;
}
```

### IDB composite (24h TTL — for large/persistent data)

For IDB-backed composites, follow the pattern in `fetchBacklog` or `fetchSocialData` — read from the relevant store first, check `ts` against the TTL, fetch and write back on miss.

### Cache key naming

| Data type | Key pattern |
|---|---|
| Profile | `ra_profile_{username}` |
| Achievement chunks | `ra_chunk_{username}_{idx}` |
| Game details | `ra_game_{username}_{gameId}` |
| Watchlist | `ra_watchlist_{username}` |
| New endpoint | `ra_<short_noun>_{username}` or `ra_<short_noun>_{username}_{id}` |

---

## Step 4 — Handle AUTH_ERROR in app.js callers

Any call to a composite must be wrapped:

```js
try {
  const data = await fetchSomething(creds.username, creds.apiKey, { ... });
  // use data
} catch (err) {
  if (err.message === 'AUTH_ERROR') handleAuthError();
  // else handle or ignore
}
```

---

## Step 5 — Update `ra-api.md`

After adding the wrapper (and composite if applicable), update `profile/utils/ra-api.md`:

1. Add the raw wrapper to the correct section table (endpoint name, params, return shape).
2. If you added an app composite, add it to the **App Composites** table at the bottom (function name, cache key, description).

Keep the format consistent with existing entries — one-row-per-function table style.

---

## Step 6 — Update the changelog

Use the `write-changelog` skill. New endpoint wrappers go under `### RetroAchievements API`. New composites with caching go under `### Cache` if the caching behaviour is the notable part, or `### RetroAchievements API` if the data access is.
