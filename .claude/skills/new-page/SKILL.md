---
name: new-page
description: Scaffold a new page in the cheevo-tracker project. Use this skill whenever the user asks to create a new page, add a new route, or build a new section of the app (e.g. "add a leaderboard page", "create a user stats page", "build a new page for X"). The skill generates the exact index.html + app.js boilerplate with all required CDN versions, auth pattern, mobile rules, and shared imports — avoiding the many easy mistakes when setting these up by hand.
---

# Scaffold a New Page

## What you need from the user

Before writing any files, confirm:
1. **Page name** — used as the directory name (e.g. `leaderboard`, `stats`, `user`)
2. **Page title** — shown in `<title>` (e.g. `Cheevo Tracker · Leaderboard`)
3. **Needs auth?** — almost always yes; only skip for fully public pages
4. **Rough purpose** — so you can pre-fill the right Lucide icons and initial state shape

---

## Step 1 — Create the directory

```
<pagename>/
├── index.html
└── app.js
```

The directory goes at the project root alongside `profile/`, `game/`, `console/`, etc.

---

## Step 2 — Write `index.html`

Use this **exact** template. Do not change CDN versions — they are pinned intentionally.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="manifest" href="../manifest.json" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Cheevo Tracker · {{Page Title}}</title>

    <script src="https://cdn.tailwindcss.com"></script>

    <style>
        html, body { background-color: #171a21; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }

        @keyframes shimmer {
            0%   { background-position: -800px 0; }
            100% { background-position:  800px 0; }
        }
        .shimmer {
            background: linear-gradient(90deg, #1b2838 25%, #2a3f52 50%, #1b2838 75%);
            background-size: 800px 100%;
            animation: shimmer 1.6s infinite linear;
            border-radius: 2px;
        }
    </style>

    <script type="importmap">
    {
        "imports": {
            "react": "https://esm.sh/react@18.2.0",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
            "lucide-react": "https://esm.sh/lucide-react@0.263.1"
        }
    }
    </script>

    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <link rel="icon" type="image/x-icon" href="../assets/favicon.ico">
    <link rel="apple-touch-icon" href="../assets/icon-192.png">
</head>
<body class="bg-[#171a21]">
    <div id="root"></div>
    <script type="text/babel" data-type="module" src="./app.js"></script>
    <script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js');</script>
    <script src="../assets/mobile-nav.js"></script>
</body>
</html>
```

---

## Step 3 — Write `app.js`

Start from this skeleton and fill in the page-specific logic.

```js
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { /* Lucide icons */ } from 'lucide-react';
import { MEDIA_URL, SITE_URL } from '../profile/utils/constants.js';
import { getMediaUrl, parseTitle, formatTimeAgo } from '../profile/utils/helpers.js';
import { getCredentials, clearCredentials /* , other ra-api exports */ } from '../profile/utils/ra-api.js';
import { Topbar, Footer } from '../assets/ui.js';

function handleAuthError() {
  clearCredentials();
  window.location.replace('../');
}

function App() {
  const [creds, setCreds] = useState(null);
  const [loading, setLoading] = useState(true);
  // ... page state

  useEffect(() => {
    const c = getCredentials();
    if (!c) { handleAuthError(); return; }
    setCreds(c);
    // fetch data here
  }, []);

  if (!creds) return null;

  return (
    <div className="min-h-screen bg-[#171a21] text-[#c6d4df]">
      <Topbar />
      <main className="max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-5 md:pt-5">
        {/* page content */}
      </main>
      <Footer />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
```

### Auth rules
- Call `getCredentials()` on mount. If null → `handleAuthError()`.
- Wrap every API call in try/catch: `if (err.message === 'AUTH_ERROR') handleAuthError()`.

### Layout rules (apply to every page)
- Page header: `pt-8 pb-5 md:pt-5` — the extra `pt-8` compensates for the hidden Topbar on mobile.
- Content: `px-4 md:px-8` on the main container.
- Sticky bars that span edge-to-edge: `-mx-4 md:-mx-8`.
- Sticky top offset: `top-0 md:top-[26px]` — desktop Topbar is 26px tall.
- Scroll-to-top FAB: use class `scroll-top-btn` (mobile-nav.js repositions it above the nav bar).

### Section header pattern
```jsx
<div className="flex items-center gap-2 border-b border-[#2a475e] pb-1.5 mb-3">
  <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
  <span className="text-[13px] text-white tracking-wide uppercase font-medium">Section Title</span>
</div>
```
Use `#e5b143` (gold) for RA data sections, `#66c0f4` (blue) for activity/engagement sections.

### Mobile layout
- Single breakpoint: `md` = 768px.
- Column → row: `flex flex-col md:flex-row items-center md:items-start gap-5`
- Text alignment inside col/row headers: `text-center md:text-left`
- Desktop-only: `hidden md:block` / `hidden md:inline`
- Mobile-only: `block md:hidden`

---

## Step 4 — After creating the files

1. **Update `CLAUDE.md`** — add the new page doc to the table if you create a `docs/pages/<pagename>.md`.
2. **Update `docs/architecture.md`** — add the directory to the layout tree if it's a permanent new page.
3. **Add a changelog entry** using the `write-changelog` skill.
4. Consider adding the page to the mobile nav (`assets/mobile-nav.js`) if it should appear in the bottom tab bar.
