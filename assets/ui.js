import React from 'react';
import { Menu, X, FileText, RotateCcw, LogOut, Trash2, Gamepad2, Bug } from 'lucide-react';

/**
 * Shared UI components — Topbar and Footer.
 * Must use React.createElement (no JSX) — this file is loaded by the native
 * ES module loader, not transpiled by Babel standalone.
 *
 * Topbar props:
 *   crumbs  — array of { label, href? }. First is root; last is current page.
 *             Pass label: null to render a shimmer placeholder (for loading states).
 *   right   — optional element rendered on the far right, before the menu button.
 *
 * Crumb styles:
 *   index 0            → root: muted, bold, uppercase (home anchor)
 *   intermediate + href → dim gray link, hover to lighter gray
 *   intermediate, no href → muted category label
 *   last               → light text, no link (active page)
 *   label === null     → shimmer block
 *
 * Footer props:
 *   label   — string or element for the left-side text.
 *   right   — optional element rendered on the far right.
 */

// ── Debug panel ──────────────────────────────────────────────────────────────

function DebugEntryRow({ entry }) {
  const [expanded, setExpanded] = React.useState(false);
  const isErr = entry.status === 'network_error' || entry.status >= 400;
  const timeAgo = Math.round((Date.now() - entry.ts) / 1000);
  const timeStr = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.round(timeAgo / 60)}m ago`;

  return React.createElement(
    'div',
    { style: { borderBottom: '1px solid #2a475e' } },
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => setExpanded(v => !v),
        style: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
        onMouseEnter: e => { e.currentTarget.style.background = '#202d39'; },
        onMouseLeave: e => { e.currentTarget.style.background = 'none'; },
      },
      React.createElement(
        'span',
        {
          style: {
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '1px 5px', borderRadius: 2, flexShrink: 0,
            color: isErr ? '#ff6b6b' : '#6bcf7f',
            background: isErr ? 'rgba(255,107,107,0.15)' : 'rgba(107,207,127,0.15)',
          },
        },
        isErr ? (entry.status === 'network_error' ? 'NET' : entry.status) : entry.status,
      ),
      React.createElement('span', { style: { fontSize: 11, color: '#c6d4df', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, entry.endpoint),
      React.createElement('span', { style: { fontSize: 9, color: '#546270', flexShrink: 0, marginLeft: 6 } }, `${entry.ms}ms`),
      React.createElement('span', { style: { fontSize: 9, color: '#546270', flexShrink: 0, marginLeft: 6 } }, timeStr),
      React.createElement('span', { style: { fontSize: 10, color: '#546270', flexShrink: 0, marginLeft: 4, transform: expanded ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' } }, '▸'),
    ),
    expanded ? React.createElement(
      'div',
      { style: { padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 8 } },
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
        React.createElement('span', { style: { fontSize: 9, color: '#546270', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 } }, 'Request Params'),
        React.createElement('pre', {
          style: { fontSize: 10, color: '#8f98a0', background: '#101214', borderRadius: 2, padding: '6px 8px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', margin: 0 },
        }, JSON.stringify(entry.params || {}, null, 2)),
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
        React.createElement('span', { style: { fontSize: 9, color: '#546270', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 } }, 'Response'),
        React.createElement('pre', {
          style: { fontSize: 10, color: '#8f98a0', background: '#101214', borderRadius: 2, padding: '6px 8px', overflowX: 'auto', overflowY: 'auto', maxHeight: 220, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', margin: 0 },
        }, entry.error ? `Error: ${entry.error}` : JSON.stringify(entry.data, null, 2)),
      ),
    ) : null,
  );
}

function DebugModal({ onClose }) {
  const [entries, setEntries] = React.useState(() => [...(window.__raDebugLog || [])].reverse());

  React.useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function refresh() { setEntries([...(window.__raDebugLog || [])].reverse()); }
  function clear() { window.__raDebugLog = []; setEntries([]); }

  const btnStyle = (color) => ({ fontSize: 10, color, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '2px 4px' });

  return React.createElement(
    'div',
    {
      onClick: e => { if (e.target === e.currentTarget) onClose(); },
      style: { position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.75)' },
    },
    React.createElement(
      'div',
      {
        onClick: e => e.stopPropagation(),
        style: { background: '#171a21', border: '1px solid #2a475e', borderRadius: '0 0 6px 6px', width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', maxHeight: '85vh' },
      },
      // Header
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #2a475e', background: '#1b2838', borderRadius: '0', flexShrink: 0 } },
        React.createElement(Bug, { size: 13, color: '#e5b143' }),
        React.createElement('span', { style: { fontSize: 12, fontWeight: 600, color: '#c6d4df', flex: 1 } }, 'API Debug Log'),
        React.createElement('span', { style: { fontSize: 10, color: '#546270', marginRight: 8 } }, `${entries.length} call${entries.length !== 1 ? 's' : ''}`),
        React.createElement('button', { type: 'button', style: btnStyle('#8f98a0'), onClick: refresh }, 'Refresh'),
        React.createElement('button', { type: 'button', style: { ...btnStyle('#ff6b6b'), marginRight: 8 }, onClick: clear }, 'Clear'),
        React.createElement('button', { type: 'button', style: { ...btnStyle('#546270'), display: 'flex', alignItems: 'center' }, onClick: onClose }, React.createElement(X, { size: 13 })),
      ),
      // Body
      entries.length === 0
        ? React.createElement('div', { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#546270', fontSize: 11 } }, 'No API calls logged yet.')
        : React.createElement(
            'div',
            { style: { overflowY: 'auto', flex: 1 } },
            ...entries.map((entry, i) => React.createElement(DebugEntryRow, { key: `${i}-${entry.ts}`, entry })),
          ),
    ),
  );
}

function DebugFab() {
  const [enabled, setEnabled] = React.useState(() => localStorage.getItem('raDebugMode') === 'true');
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onToggle(e) { setEnabled(e.detail); if (!e.detail) setOpen(false); }
    window.addEventListener('raDebugModeChange', onToggle);
    return () => window.removeEventListener('raDebugModeChange', onToggle);
  }, []);

  if (!enabled) return null;
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'button',
      {
        type: 'button',
        title: 'API Debug Log',
        onClick: () => setOpen(o => !o),
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#e5b143' },
      },
      React.createElement(Bug, { size: 14 }),
    ),
    open ? React.createElement(DebugModal, { onClose: () => setOpen(false) }) : null,
  );
}

// ── Menu dropdown ─────────────────────────────────────────────────────────────

function MenuDropdown({ onClose }) {
  const ref = React.useRef(null);
  const [debugMode, setDebugMode] = React.useState(() => localStorage.getItem('raDebugMode') === 'true');

  React.useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  function handleRefresh() {
    sessionStorage.clear();
    const lsKeys = Object.keys(localStorage).filter(k => k === 'ra_consoles' || k.startsWith('ra_consolegames_'));
    lsKeys.forEach(k => localStorage.removeItem(k));
    location.reload();
  }

  async function handlePurgeCache() {
    sessionStorage.clear();
    // Clear long-lived localStorage API caches (console list + game lists)
    const lsKeys = Object.keys(localStorage).filter(k => k === 'ra_consoles' || k.startsWith('ra_consolegames_'));
    lsKeys.forEach(k => localStorage.removeItem(k));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    location.reload();
  }

  function handleLogout() {
    localStorage.removeItem('raCredentials');
    window.location.replace('../');
  }

  function handleToggleDebug() {
    const next = !debugMode;
    setDebugMode(next);
    localStorage.setItem('raDebugMode', String(next));
    window.dispatchEvent(new CustomEvent('raDebugModeChange', { detail: next }));
  }

  const rows = [
    { Icon: Gamepad2,  label: 'Consoles',    href: '../console/',   color: '#e5b143' },
    { Icon: FileText,  label: 'Changelog',   href: '../changelog/', color: '#57cbde' },
    null, // divider
    { Icon: RotateCcw, label: 'Refresh Data', onClick: handleRefresh,    color: '#66c0f4' },
    { Icon: Trash2,    label: 'Purge Cache',  onClick: handlePurgeCache, color: '#8f98a0' },
    null, // divider
    { Icon: Bug, label: debugMode ? 'Debug: On' : 'Debug: Off', onClick: handleToggleDebug, color: debugMode ? '#e5b143' : '#546270', labelColor: debugMode ? '#e5b143' : '#8f98a0' },
    null, // divider
    { Icon: LogOut, label: 'Log Out', onClick: handleLogout, color: '#ff6b6b', labelColor: '#ff6b6b' },
  ];

  return React.createElement(
    'div',
    {
      ref,
      className: 'absolute top-full right-0 mt-1 w-44 bg-[#1b2838] border border-[#2a475e] rounded-[3px] overflow-hidden shadow-xl z-50',
    },
    ...rows.map((row, i) => {
      if (row === null) {
        return React.createElement('div', { key: `div-${i}`, className: 'border-t border-[#2a475e]' });
      }
      const inner = [
        React.createElement(row.Icon, { key: 'icon', size: 13, color: row.color, strokeWidth: 2 }),
        React.createElement('span', {
          key: 'label',
          className: 'text-[12px]',
          style: { color: row.labelColor || '#c6d4df' },
        }, row.label),
      ];
      const cls = 'flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-[#202d39] active:bg-[#202d39] transition-colors text-left';
      if (row.href) {
        return React.createElement('a', { key: i, href: row.href, className: cls }, ...inner);
      }
      return React.createElement('button', { key: i, type: 'button', onClick: row.onClick, className: cls + ' font-[inherit]' }, ...inner);
    })
  );
}

function TopbarMenu() {
  const [open, setOpen] = React.useState(false);

  return React.createElement(
    'div',
    { className: 'relative' },
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => setOpen(o => !o),
        className: 'flex items-center justify-center w-6 h-6 text-[#546270] hover:text-[#c6d4df] transition-colors',
      },
      React.createElement(open ? X : Menu, { size: 14 })
    ),
    open ? React.createElement(MenuDropdown, { onClose: () => setOpen(false) }) : null
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────

export function Topbar({ crumbs = [], right }) {
  const items = crumbs.flatMap((crumb, i) => {
    const isFirst = i === 0;
    const isLast  = i === crumbs.length - 1;

    const sep = i > 0
      ? React.createElement('span', { key: `sep-${i}`, className: 'text-[#2a475e] select-none' }, '›')
      : null;

    let el;

    if (crumb.label === null || crumb.label === undefined) {
      el = React.createElement('span', {
        key: `crumb-${i}`,
        className: 'shimmer inline-block w-16 h-[8px] rounded align-middle',
      });
    } else if (isFirst) {
      el = crumb.href
        ? React.createElement('a', {
            key: `crumb-${i}`,
            href: crumb.href,
            className: 'text-[#546270] font-bold tracking-[0.15em] uppercase hover:text-[#8f98a0] transition-colors',
          }, crumb.label)
        : React.createElement('span', {
            key: `crumb-${i}`,
            className: 'text-[#546270] font-bold tracking-[0.15em] uppercase',
          }, crumb.label);
    } else if (isLast) {
      el = React.createElement('span', {
        key: `crumb-${i}`,
        className: 'text-[#c6d4df]',
      }, crumb.label);
    } else if (crumb.href) {
      el = React.createElement('a', {
        key: `crumb-${i}`,
        href: crumb.href,
        className: 'text-[#546270] hover:text-[#8f98a0] transition-colors',
      }, crumb.label);
    } else {
      el = React.createElement('span', {
        key: `crumb-${i}`,
        className: 'text-[#546270]',
      }, crumb.label);
    }

    return sep ? [sep, el] : [el];
  });

  items.push(React.createElement('div', { key: 'spacer', className: 'ml-auto' }));
  if (right) {
    items.push(React.createElement('div', { key: 'right', className: 'shrink-0' }, right));
  }
  items.push(React.createElement(DebugFab, { key: 'debug' }));
  items.push(React.createElement(TopbarMenu, { key: 'menu' }));

  return React.createElement(
    'div',
    { className: 'page-topbar sticky top-0 z-50 bg-[#131a22] border-b border-[#101214] px-4 md:px-8 py-1.5 flex items-center gap-2 text-[10px]' },
    ...items
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function Footer({ label, right }) {
  return React.createElement(
    'footer',
    { className: 'bg-[#1b2838] border-t-2 border-[#2a475e] px-4 md:px-8 py-2.5 flex items-center gap-3 mt-auto' },
    React.createElement('div', { className: 'w-[3px] h-[18px] rounded-[1px] bg-[#66c0f4] opacity-50 shrink-0' }),
    React.createElement('div', { className: 'text-[10px] text-[#546270]' }, label),
    right ? React.createElement('div', { key: 'right', className: 'ml-auto shrink-0' }, right) : null
  );
}
