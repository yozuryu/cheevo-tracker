/**
 * Mobile bottom navigation bar + slide-up menu sheet.
 * Injected into every page via a <script> tag.
 * Visible only on screens < 768px (md breakpoint).
 */
(function () {
  const BASE = (document.currentScript.src || '')
    .replace(/\/assets\/mobile-nav\.js.*$/, '');

  const path       = window.location.pathname;
  const currentTab = new URLSearchParams(window.location.search).get('tab') || 'recent';
  const isProfile  = path.includes('/profile');

  // ── Sheet icon SVGs (16px) ─────────────────────────────────────────────────
  const ICON_USER     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  const ICON_GAMEPAD  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="12" r="1"/><circle cx="18" cy="10" r="1"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`;
  const ICON_FILETEXT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
  const ICON_REFRESH  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>`;
  const ICON_PURGE    = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
  const ICON_DEBUG    = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="6" width="8" height="14" rx="4"/><path d="m19 7-3 2"/><path d="m5 7 3 2"/><path d="M19 12h-4"/><path d="M5 12h4"/><path d="m19 17-3-2"/><path d="m5 17 3-2"/></svg>`;
  const ICON_LOGOUT   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
  const ICON_SEARCH   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

  // ── Nav tab definitions ────────────────────────────────────────────────────
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
      id: 'backlog',
      label: 'Backlog',
      href: BASE + '/profile/?tab=backlog',
      active: isProfile && currentTab === 'backlog',
      color: '#e5b143',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
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
      id: 'menu',
      label: 'Menu',
      href: null,
      active: false,
      color: '#8f98a0',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>`,
    },
  ];

  // ── CSS ────────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .mnav {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 200;
      background: #131a22;
      border-top: 1px solid #2a475e;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    @media (max-width: 767px) {
      .mnav { display: flex; align-items: stretch; }
      body { padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)) !important; }
      .scroll-top-btn { bottom: calc(68px + env(safe-area-inset-bottom, 0px)) !important; }
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
      width: 20px; height: 20px;
      display: flex; align-items: center; justify-content: center;
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

    .mnav-item.mnav-active { color: var(--mnav-color, #e5b143); }
    .mnav-item.mnav-active .mnav-icon svg { stroke: var(--mnav-color, #e5b143); }
    .mnav-item.mnav-active::before {
      content: '';
      position: absolute;
      top: 0; left: 15%; right: 15%;
      height: 2px;
      background: var(--mnav-color, #e5b143);
      border-radius: 0 0 2px 2px;
    }

    /* ── Slide-up menu sheet ── */
    .msheet-bd {
      position: fixed;
      inset: 0;
      z-index: 300;
      background: rgba(0, 0, 0, 0.6);
      animation: mbd-in 0.2s ease-out;
    }
    .msheet-bd.closing { animation: mbd-out 0.15s ease-in forwards; }

    @keyframes mbd-in  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes mbd-out { from { opacity: 1; } to { opacity: 0; } }

    .msheet {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: #1b2838;
      border-top: 1px solid #2a475e;
      border-radius: 12px 12px 0 0;
      padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      max-height: 85vh;
      overflow-y: auto;
      animation: msheet-in 0.2s ease-out;
    }
    .msheet-bd.closing .msheet { animation: msheet-out 0.15s ease-in forwards; }

    @keyframes msheet-in  { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes msheet-out { from { transform: translateY(0); } to { transform: translateY(100%); } }

    .msheet-handle {
      width: 36px; height: 4px;
      background: #2a475e;
      border-radius: 2px;
      margin: 10px auto 6px;
    }

    .msheet-user, .msheet-row {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 14px 16px;
      box-sizing: border-box;
    }
    .msheet-row {
      background: none;
      border: none;
      cursor: pointer;
      text-decoration: none;
      font-family: 'Segoe UI', Arial, sans-serif;
      text-align: left;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.1s;
    }
    .msheet-row:active { background: #202d39; }

    .msheet-row-icon {
      width: 32px; height: 32px;
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .msheet-row-body {
      display: flex; flex-direction: column;
      gap: 2px; min-width: 0; flex: 1;
    }
    .msheet-row-label {
      font-size: 13px; font-weight: 600;
      color: #c6d4df; line-height: 1.2;
    }
    .msheet-row-desc { font-size: 10px; color: #546270; line-height: 1.2; }
    .msheet-divider  { height: 1px; background: #2a475e; }
  `;
  document.head.appendChild(style);

  // ── DOM: nav bar ───────────────────────────────────────────────────────────
  const nav = document.createElement('nav');
  nav.className = 'mnav';
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = tabs.map((t) => {
    const isBtn = !t.href;
    const tag   = isBtn ? 'button' : 'a';
    const attr  = isBtn ? 'type="button"' : `href="${t.href}"`;
    return `<${tag} ${attr}
        class="mnav-item${t.active ? ' mnav-active' : ''}"
        style="--mnav-color: ${t.color};"
        data-id="${t.id}"
        ${t.active && !isBtn ? 'aria-current="page"' : ''}
        aria-label="${t.label}"
      >
        <span class="mnav-icon">${t.icon}</span>
        <span class="mnav-label">${t.label}</span>
      </${tag}>`;
  }).join('');

  document.body.appendChild(nav);

  // ── Sheet logic ────────────────────────────────────────────────────────────
  const menuNavBtn = nav.querySelector('[data-id="menu"]');
  let sheetOpen = false;

  function makeRow(tag, href, iconHtml, iconColor, iconBg, label, desc, labelColor) {
    const el = document.createElement(tag);
    if (tag === 'button') el.type = 'button';
    if (href) el.href = href;
    el.className = 'msheet-row';
    const iconStyle  = `background:${iconBg || '#202d39'};color:${iconColor}`;
    const labelStyle = labelColor ? ` style="color:${labelColor}"` : '';
    el.innerHTML = `<span class="msheet-row-icon" style="${iconStyle}">${iconHtml}</span><span class="msheet-row-body"><span class="msheet-row-label"${labelStyle}>${label}</span>${desc ? `<span class="msheet-row-desc">${desc}</span>` : ''}</span>`;
    return el;
  }

  function divider() {
    return Object.assign(document.createElement('div'), { className: 'msheet-divider' });
  }

  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    menuNavBtn.classList.remove('mnav-active');
    document.body.style.overflow = '';
    const bd = document.querySelector('.msheet-bd');
    if (bd) { bd.classList.add('closing'); setTimeout(() => bd.remove(), 150); }
  }

  function openSheet() {
    if (sheetOpen) { closeSheet(); return; }
    sheetOpen = true;
    menuNavBtn.classList.add('mnav-active');
    document.body.style.overflow = 'hidden';

    let creds = null;
    try { creds = JSON.parse(localStorage.getItem('raCredentials')); } catch {}
    let dbg = localStorage.getItem('raDebugMode') === 'true';

    const bd = document.createElement('div');
    bd.className = 'msheet-bd';
    bd.addEventListener('click', (e) => { if (e.target === bd) closeSheet(); });

    const sheet = document.createElement('div');
    sheet.className = 'msheet';

    // Handle bar
    const handle = document.createElement('div');
    handle.className = 'msheet-handle';
    sheet.appendChild(handle);

    // Username row (non-interactive)
    if (creds?.username) {
      const userRow = document.createElement('div');
      userRow.className = 'msheet-user';
      userRow.innerHTML = `<span class="msheet-row-icon" style="background:#202d39;color:#8f98a0">${ICON_USER}</span><span class="msheet-row-body"><span class="msheet-row-label">${creds.username}</span><span class="msheet-row-desc">Signed in to RetroAchievements</span></span>`;
      sheet.appendChild(userRow);
    }

    sheet.appendChild(divider());

    // Navigation links
    sheet.appendChild(makeRow('a', BASE + '/console/',   ICON_GAMEPAD,  '#e5b143', '#202d39', 'Consoles',  null));
    sheet.appendChild(makeRow('a', BASE + '/search/',    ICON_SEARCH,   '#66c0f4', '#202d39', 'Search',    'Search games across all consoles'));
    sheet.appendChild(makeRow('a', BASE + '/changelog/', ICON_FILETEXT, '#57cbde', '#202d39', 'Changelog', null));

    sheet.appendChild(divider());

    // Refresh Data
    const refreshRow = makeRow('button', null, ICON_REFRESH, '#66c0f4', '#202d39', 'Refresh Data', 'Clear profile & activity cache, keep game catalog');
    refreshRow.addEventListener('click', async () => {
      sessionStorage.clear();
      Object.keys(localStorage).filter(k => k.startsWith('ra_')).forEach(k => localStorage.removeItem(k));
      // Clear only ephemeral IDB stores — keep consoles + games (expensive catalog data)
      if (window.indexedDB) {
        await new Promise(resolve => {
          const req = indexedDB.open('cheevo_tracker');
          req.onsuccess = e => {
            const db = e.target.result;
            const toClean = ['progress', 'friend_activity', 'backlog', 'friend_list', 'meta']
              .filter(s => db.objectStoreNames.contains(s));
            if (!toClean.length) { db.close(); resolve(); return; }
            const tx = db.transaction(toClean, 'readwrite');
            toClean.forEach(s => tx.objectStore(s).clear());
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror    = () => { db.close(); resolve(); };
          };
          req.onerror = () => resolve();
        });
      }
      location.reload();
    });
    sheet.appendChild(refreshRow);

    // Purge Cache
    const purgeRow = makeRow('button', null, ICON_PURGE, '#8f98a0', '#202d39', 'Purge Cache', 'Force fresh app download, keep all data');
    purgeRow.addEventListener('click', async () => {
      // Clear only SW asset cache — IDB data (including game catalog) is untouched
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      location.reload();
    });
    sheet.appendChild(purgeRow);

    sheet.appendChild(divider());

    // Debug toggle
    const dbgIcon = () => dbg ? 'rgba(229,177,67,0.1)' : '#202d39';
    const dbgColor = () => dbg ? '#e5b143' : '#546270';
    const debugRow = makeRow('button', null, ICON_DEBUG, dbgColor(), dbgIcon(), 'Debug Mode', dbg ? 'Enabled — API log visible in topbar' : 'Disabled');
    debugRow.addEventListener('click', () => {
      dbg = !dbg;
      localStorage.setItem('raDebugMode', String(dbg));
      window.dispatchEvent(new CustomEvent('raDebugModeChange', { detail: dbg }));
      debugRow.querySelector('.msheet-row-icon').style.background = dbgIcon();
      debugRow.querySelector('.msheet-row-icon').style.color      = dbgColor();
      debugRow.querySelector('.msheet-row-desc').textContent = dbg ? 'Enabled — API log visible in topbar' : 'Disabled';
    });
    sheet.appendChild(debugRow);

    sheet.appendChild(divider());

    // Log Out
    const logoutRow = makeRow('button', null, ICON_LOGOUT, '#ff6b6b', '#202d39', 'Log Out', 'Clear credentials and return to login', '#ff6b6b');
    logoutRow.addEventListener('click', () => {
      localStorage.removeItem('raCredentials');
      window.location.replace(BASE + '/');
    });
    sheet.appendChild(logoutRow);

    bd.appendChild(sheet);
    document.body.appendChild(bd);
  }

  menuNavBtn.addEventListener('click', openSheet);
})();
