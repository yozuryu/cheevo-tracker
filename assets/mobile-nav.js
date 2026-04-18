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
  const isProfile  = path.includes('/profile');
  const isConsole  = path.includes('/console');
  const isSettings = path.includes('/settings');

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
      id: 'console',
      label: 'Consoles',
      href: BASE + '/console/',
      active: isConsole,
      color: '#e5b143',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
        <circle cx="15" cy="12" r="1"/><circle cx="18" cy="10" r="1"/>
        <rect x="2" y="6" width="20" height="12" rx="2"/>
      </svg>`,
    },
    {
      id: 'social',
      label: 'Social',
      href: BASE + '/profile/?tab=social',
      active: isProfile && currentTab === 'social',
      color: '#57cbde',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: BASE + '/settings/',
      active: isSettings,
      color: '#8f98a0',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
