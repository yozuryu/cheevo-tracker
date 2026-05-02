# Todo

## Profile Page — Social Timeline Tab

Add a **Social** sub-section inside the existing **Activity** tab. Activity tab gains two views: **Mine** (current behaviour) and **Friends** (merged feed of self + all following users sorted by date).

---

### Architecture

**Data sources**
- Own achievements: `achievementChunks[0]` (already loaded, covers ~6 months / 182 days) — used directly in the merge, never re-fetched
- Friends list: `fetchSocial(u, k)` (cached 1h in localStorage); following list is at `.following.results` — lazy-loaded by the Social tab, so Activity must fetch it independently if Social tab hasn't been opened yet
- Per-friend achievements: `getAchievementsEarnedBetween(u, k, { u: friendUser, f: start, t: end })` — one call per followed user, 3-month window; returns a flat array (not paginated)

**New state (profile/app.js)**
```js
const [socialView,            setSocialView]            = useState('mine');   // 'mine' | 'friends'
const [friendsActivity,       setFriendsActivity]       = useState({});       // { [username]: achievement[] }
const [friendsFetchProgress,  setFriendsFetchProgress]  = useState(null);     // { done, total } | null
const [friendsActivityStatus, setFriendsActivityStatus] = useState('idle');   // 'idle' | 'loading' | 'done' | 'error'
```

**New composite in ra-api.js**
```js
fetchFriendsActivity(username, apiKey, followingList, { onProgress, onUser })
```
- Iterates **following list only** (self is excluded — own data comes from `achievementChunks[0]`)
- Concurrency cap: 4 parallel requests
- 500ms sleep between batches (rate limit)
- **Per-user retry:** `withRetry(fn, 2, 1000)` (existing helper — 3 total attempts, 1s delay, re-throws `AUTH_ERROR` immediately); catch the final throw to skip the user and continue
- Per-user cache: `localStorage` key `ra_fa_{friendUser}` (keyed to the friend's username, e.g. `ra_fa_FriendA`), TTL 1 hour — checked before fetching, written after success
- On cache hit: calls `onUser(username, cached)` immediately, counts toward `onProgress`
- Calls `onProgress(done, total)` callback after each user resolves (hit or miss)
- Returns early per-user results via `onUser(username, achievements)` callback (streaming)
- `getAchievementsEarnedBetween` returns a flat array in one call — no pagination needed

---

### Phase 1 — Mine / Friends toggle UI
- [x] Add `socialView` + `friendsActivityStatus` state to profile app
- [x] Add toggle buttons ("Mine" / "Friends") at the top of the Activity tab content (ActivityTab has no existing controls — the toggle row is the first control)
- [x] "Mine" shows existing heatmap + achievement chunk list (no change)
- [x] "Friends" shows a placeholder "Coming soon" card for now; **no heatmap**
- [x] Toggle only visible when Activity tab is active

### Phase 2 — Friends fetch + streaming
- [x] Add `fetchFriendsActivity` composite to `ra-api.js` with streaming callbacks, concurrency cap, per-user retry (3×), and per-user localStorage cache (1h TTL)
- [x] Trigger fetch on first switch to "Friends" view (guard with `friendsActivityStatus === 'idle'`); resolve following list via `const social = socialData ?? await fetchSocial(u, k)` then pass `social.following.results` into `fetchFriendsActivity` — reuses the 1h localStorage cache if Social tab was previously opened
- [x] Show progress bar + "Fetching X / Y users…" label while fetching
- [x] Stream results into `friendsActivity` map as each user resolves — render immediately, don't wait for all
- [x] Manual **Refresh** button: clears all `ra_fa_*` localStorage keys, resets `friendsActivity` to `{}`, `friendsFetchProgress` to `null`, and `friendsActivityStatus` to `'idle'` — the status reset triggers re-fetch via the same useEffect
- [x] Empty states: "You're not following anyone" / "No activity in the last 3 months"
- [x] On fetch complete, set `friendsActivityStatus = 'done'`; on unrecoverable error (all retries exhausted for every user), set `'error'` — render an error card with a **Retry** button that resets status to `'idle'` and re-triggers the fetch

### Phase 3 — Flat merged feed
- [x] `FeedRow` component: avatar (28px, linked to `/profile/?u=`) · username · "unlocked" · badge icon (linked to `/achievement/?id=`) · achievement name · "in" · game title (linked to `/game/?id=`) · relative timestamp right-aligned
- [x] Own rows: `#57cbde` (cyan) username; friend rows: `#e5b143` (gold) username
- [x] HC badge: gold left-border stripe; SC: gray
- [x] Merge `achievementChunks[0]` (own) + all `friendsActivity` values into a flat array, sort by date descending
- [x] Render incrementally as `friendsActivity` fills in (each `onUser` call triggers re-merge)

### Phase 4 — Grouping
- [x] Group consecutive unlocks from the same user + game within a **1-hour** window (≥ 3 achievements) into a collapsed card: "[Avatar] [User] unlocked N achievements in [Game] · [time ago]"
- [x] Expand/collapse per group to show individual `FeedRow`s
- [x] Ungrouped items render as individual `FeedRow`s

### Phase 5 — Pagination + polish
- [x] If merged feed exceeds 200 items: show first 100, "Load more" button appends next 100
- [x] On tab re-open within 1 hour (all users still cached): restore feed instantly from cache, no loading state (`friendsActivityStatus` stays `'done'`)
- [x] Update `docs/pages/profile.md` and `docs/architecture.md` with new state and composite
- [x] Update changelog

---

---

## Game Page — Desktop Single-Page Layout

On desktop (`md:` and above), hide the tab bar and display all sections simultaneously in a structured layout. Mobile keeps the existing tab behaviour unchanged.

### Layout structure

```
┌─────────────────────────────────────────────────────┐
│                  Hero + Stats strip                  │  full width (existing)
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│   Achievements               │   Info               │
│   (filter/sort + list)       │   Time to Beat       │
│                              │   Links              │
│   flex-1, min-w-0            │   ──────────────     │
│                              │   Hashes             │
│                              │   w-[320px] shrink-0 │
│                              │                      │
├──────────────────────────────┴──────────────────────┤
│   Leaderboards                                       │
│   ┌─────────────────┬──────────────────────────┐    │
│   │  Top Scorers    │  Board list (accordion)  │    │
│   │  1fr            │  2fr                     │    │
│   └─────────────────┴──────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│   Community                                          │
│   ┌─────────────────┬──────────────────────────┐    │
│   │  Recent Masters │  Comments + load more    │    │
│   │  1fr            │  2fr                     │    │
│   └─────────────────┴──────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Rationale:**
- Achievements is the primary content → full height left column, no vertical cap
- Info + Hashes are compact metadata → right sidebar, stacked; Hashes fits here as utility content (ROM lookup)
- Leaderboards and Community each benefit from full width but have a natural internal 2-col split (summary left, detail right)
- This mirrors how gaming sites like RA itself or HowLongToBeat lay out game pages

### Implementation

**Tab bar:** `md:hidden` — hidden on desktop, visible on mobile as before

**Section visibility logic** — each section div uses:
```jsx
className={`${tab === 'sectionId' ? 'block' : 'hidden'} md:block`}
```
Mobile: only active tab section visible. Desktop: all sections always visible.

**Top area wrapper** (inside `max-w-4xl mx-auto px-4 md:px-8`):
```jsx
<div className="md:flex md:items-start md:gap-6 py-4">
  {/* Achievements — left column */}
  <div className="md:flex-1 md:min-w-0 ...">...</div>

  {/* Right sidebar */}
  <div className="md:w-[320px] md:shrink-0 md:flex md:flex-col md:gap-5">
    {/* Info section */}
    {/* Hashes section */}
  </div>
</div>
```

**Leaderboards section** (full width, `max-w-4xl mx-auto px-4 md:px-8 py-4`):
```jsx
<div className="md:grid md:grid-cols-[1fr_2fr] md:gap-6">
  {/* Top Scorers */}
  {/* Board list */}
</div>
```

**Community section** (full width, same wrapper):
```jsx
<div className="md:grid md:grid-cols-[1fr_2fr] md:gap-6">
  {/* Recent Masters */}
  {/* Comments */}
</div>
```

A `border-t border-[#2a475e]` divider separates the top two-column area from Leaderboards, and Leaderboards from Community.

### Data fetching on desktop

On mobile, each section lazy-loads when its tab is first opened. On desktop, all sections are visible on page load so lazy-loading by tab is useless.

**Strategy:** at mount, detect viewport with `window.matchMedia('(min-width: 768px)').matches`. If desktop, fire all section fetches eagerly in parallel alongside the main fetch:
- `getGameProgression` + `getGameExtended` (Info/Achievements enrichment)
- `getGameLeaderboards` + `getUserGameLeaderboards` + `getGameRankAndScore(t=0)` (Leaderboards)
- `getGameRankAndScore(t=1)` + `getComments` (Community)
- `getGameHashes` (Hashes)

On mobile, keep existing lazy-load per tab as-is. The state variables and fetch functions are the same — only the trigger changes.

### Section headers on desktop sidebar

In the right sidebar on desktop, Info and Hashes need their own section headers (they have them in tab view already — just ensure they're visible in sidebar context too). No change needed — headers are always rendered inside each section.

### Scroll behaviour

No scroll containers within sections — everything flows naturally in the page scroll. The sticky tab bar on mobile remains sticky; on desktop it is hidden so no sticky element is needed below the hero.
