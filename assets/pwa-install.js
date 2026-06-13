/**
 * PWA install prompt banner.
 * Slides up from the bottom when the browser fires beforeinstallprompt.
 * Auto-dismisses after 10 s; X button sets a 7-day cooldown.
 * Injected into every page via a <script> tag.
 */
(function () {
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone) return;

  const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
  const DURATION_MS = 10000;
  const dismissed = localStorage.getItem('ra_pwa_dismissed_at');
  if (dismissed && Date.now() - parseInt(dismissed, 10) < COOLDOWN_MS) return;

  // Only show once per session to avoid nagging across page navigations
  if (sessionStorage.getItem('ra_pwa_shown')) return;

  const scriptSrc = (document.currentScript || {}).src || '';
  const BASE = scriptSrc.replace(/\/assets\/pwa-install\.js.*$/, '');
  const iconSrc = BASE + '/assets/icon-192.png';

  let deferredPrompt = null;
  let banner = null;
  let rafId = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showBanner();
  });

  window.addEventListener('appinstalled', () => {
    hideBanner(true);
  });

  function showBanner() {
    if (banner) return;
    sessionStorage.setItem('ra_pwa_shown', '1');

    const style = document.createElement('style');
    style.textContent = `
      .pwa-banner {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(calc(100% + 28px));
        z-index: 250;
        width: min(380px, calc(100vw - 32px));
        background: #1b2838;
        border: 1px solid #2a475e;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.65);
        font-family: 'Segoe UI', Arial, sans-serif;
        overflow: hidden;
        transition: transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
      }
      .pwa-banner.pwa-visible {
        transform: translateX(-50%) translateY(0);
      }
      .pwa-banner.pwa-hiding {
        transform: translateX(-50%) translateY(calc(100% + 28px));
        transition: transform 0.25s ease-in;
      }
      @media (max-width: 767px) {
        .pwa-banner {
          bottom: calc(72px + env(safe-area-inset-bottom, 0px));
        }
      }
      .pwa-body {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 13px 13px 11px;
      }
      .pwa-appicon {
        width: 40px; height: 40px;
        border-radius: 10px;
        background: #171a21;
        border: 1px solid #2a475e;
        flex-shrink: 0;
        overflow: hidden;
        display: flex; align-items: center; justify-content: center;
      }
      .pwa-appicon img { width: 100%; height: 100%; display: block; }
      .pwa-text { flex: 1; min-width: 0; }
      .pwa-title { font-size: 13px; font-weight: 600; color: #c6d4df; line-height: 1.2; }
      .pwa-sub   { font-size: 11px; color: #546270; margin-top: 2px; line-height: 1.2; }
      .pwa-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
      .pwa-install-btn {
        height: 30px; padding: 0 13px;
        background: #1a9fff;
        color: #fff;
        border: none; border-radius: 6px;
        font-size: 12px; font-weight: 600;
        cursor: pointer;
        font-family: 'Segoe UI', Arial, sans-serif;
        white-space: nowrap;
        transition: background 0.12s;
      }
      .pwa-install-btn:hover  { background: #40b3ff; }
      .pwa-install-btn:active { background: #1580cc; }
      .pwa-close-btn {
        width: 26px; height: 26px;
        background: none; border: none;
        color: #546270; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        border-radius: 5px;
        flex-shrink: 0;
        transition: color 0.12s, background 0.12s;
        padding: 0;
      }
      .pwa-close-btn:hover { color: #8f98a0; background: rgba(255,255,255,0.06); }
      .pwa-progress { height: 2px; background: #253344; }
      .pwa-bar { height: 100%; background: #1a9fff; width: 100%; }
    `;
    document.head.appendChild(style);

    banner = document.createElement('div');
    banner.className = 'pwa-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Install Cheevo Tracker');
    banner.innerHTML = `
      <div class="pwa-body">
        <div class="pwa-appicon"><img src="${iconSrc}" alt=""></div>
        <div class="pwa-text">
          <div class="pwa-title">Install Cheevo Tracker</div>
          <div class="pwa-sub">Add to your home screen</div>
        </div>
        <div class="pwa-actions">
          <button class="pwa-install-btn" type="button">Install</button>
          <button class="pwa-close-btn" type="button" aria-label="Dismiss">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="pwa-progress"><div class="pwa-bar"></div></div>
    `;
    document.body.appendChild(banner);

    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('pwa-visible')));

    const bar = banner.querySelector('.pwa-bar');
    const startTime = performance.now();

    rafId = requestAnimationFrame(function tick(now) {
      const frac = Math.max(0, 1 - (now - startTime) / DURATION_MS);
      bar.style.width = (frac * 100) + '%';
      if (frac > 0) {
        rafId = requestAnimationFrame(tick);
      } else {
        hideBanner(false);
      }
    });

    banner.querySelector('.pwa-install-btn').addEventListener('click', () => {
      hideBanner(false);
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
      }
    });

    banner.querySelector('.pwa-close-btn').addEventListener('click', () => {
      hideBanner(true);
    });
  }

  function hideBanner(persist) {
    if (!banner) return;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (persist) localStorage.setItem('ra_pwa_dismissed_at', String(Date.now()));
    banner.classList.remove('pwa-visible');
    banner.classList.add('pwa-hiding');
    const el = banner;
    banner = null;
    setTimeout(() => el.remove(), 260);
  }
})();
