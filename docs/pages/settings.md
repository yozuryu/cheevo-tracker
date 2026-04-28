# Settings Page

**File:** `settings/app.js`  
**URL:** `/settings/`  
**Auth required:** Yes

## Feature Rows

Each setting is a row with an icon, label, and action. Current rows:

- **Log out** — `clearCredentials()` + redirect to `../`
- **Clear cache** — `sessionStorage.clear()` + `localStorage.clear()` (except credentials)
- Any additional settings follow the same icon + label + action row pattern

## Adding a New Setting

1. Define the row as a component or inline JSX in the settings list.
2. Use the same row pattern: icon (Lucide), label text, action button/toggle on the right.
3. No separate state file — all state in `app.js`.

## Mobile

Single-column, centered, max-width constrained:

```jsx
<div className="max-w-lg mx-auto w-full px-4 pt-8 pb-5 md:pt-5 flex-1">
```

No layout differences between mobile and desktop — settings rows are full-width at all sizes.
