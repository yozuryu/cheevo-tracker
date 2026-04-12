/**
 * Mobile bottom navigation bar
 * Injected into every page via a <script> tag in index.html.
 * Visible only on screens < 768px (md breakpoint).
 */
(function () {
  const BASE = (document.currentScript.src || '')
    .replace(/\/assets\/mobile-nav\.js.*$/, '');

  const path = window.location.pathname;
  const currentTab = new URLSearchParams(window.location.search).get('tab') || 'recent';
  const isProfile   = path.includes('/profile');
  const isChangelog = path.includes('/changelog');

  // ── Nav tab definitions ───────────────────────────────────────────────────
  const tabs = [
    {
      id: 'recent',
      label: 'Profile',
      href: BASE + '/profile/?tab=recent',
      active: isProfile && currentTab === 'recent',
      color: '#e5b143',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>`,
    },
    {
      id: 'progress',
      label: 'Progress',
      href: BASE + '/profile/?tab=progress',
      active: isProfile && currentTab === 'progress',
      color: '#66c0f4',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>`,
    },
    {
      id: 'activity',
      label: 'Activity',
      href: BASE + '/profile/?tab=activity',
      active: isProfile && currentTab === 'activity',
      color: '#66c0f4',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>`,
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      href: BASE + '/profile/?tab=backlog',
      active: isProfile && currentTab === 'backlog',
      color: '#e5b143',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>`,
    },
    {
      id: 'changelog',
      label: 'Log',
      href: BASE + '/changelog/',
      active: isChangelog,
      color: '#57cbde',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9"  x2="8" y2="9"/>
      </svg>`,
    },
  ];

  // ── CSS ────────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .mnav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 200;
      background: #131a22;
      border-top: 1px solid #2a475e;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    @media (max-width: 767px) {
      .mnav { display: flex; align-items: stretch; }
      body { padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)) !important; }
      .scroll-top-btn { bottom: calc(68px + env(safe-area-inset-bottom, 0px)) !important; }
      /* Hide topbar breadcrumb and footer on mobile — bottom nav replaces them */
      .page-topbar { display: none !important; }
      footer { display: none !important; }
    }

    .mnav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 8px 2px;
      min-height: 60px;
      min-width: 0;
      text-decoration: none;
      color: #546270;
      background: none;
      border: none;
      cursor: pointer;
      position: relative;
      transition: color 0.15s, background 0.1s;
      -webkit-tap-highlight-color: transparent;
    }

    .mnav-item:active { background: rgba(102,192,244,0.06); }

    .mnav-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .mnav-icon svg { transition: stroke 0.15s; }

    .mnav-label {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      line-height: 1;
      white-space: nowrap;
    }

    .mnav-item.mnav-active {
      color: var(--mnav-color, #e5b143);
    }
    .mnav-item.mnav-active .mnav-icon svg {
      stroke: var(--mnav-color, #e5b143);
    }
    .mnav-item.mnav-active::before {
      content: '';
      position: absolute;
      top: 0;
      left: 15%;
      right: 15%;
      height: 2px;
      background: var(--mnav-color, #e5b143);
      border-radius: 0 0 2px 2px;
    }
  `;
  document.head.appendChild(style);

  // ── DOM: nav bar ───────────────────────────────────────────────────────────
  const nav = document.createElement('nav');
  nav.className = 'mnav';
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = tabs
    .map((t) => `<a href="${t.href}"
        class="mnav-item${t.active ? ' mnav-active' : ''}"
        style="--mnav-color: ${t.color};"
        data-id="${t.id}"
        ${t.active ? 'aria-current="page"' : ''}
        aria-label="${t.label}"
      >
        <span class="mnav-icon">${t.icon}</span>
        <span class="mnav-label">${t.label}</span>
      </a>`)
    .join('');

  document.body.appendChild(nav);
})();
