import React from 'react';
import { Menu, X, FileText, RotateCcw, LogOut, Trash2, Gamepad2 } from 'lucide-react';

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

// ── Menu dropdown ─────────────────────────────────────────────────────────────

function MenuDropdown({ onClose }) {
  const ref = React.useRef(null);

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

  const rows = [
    { Icon: Gamepad2,  label: 'Consoles',    href: '../console/',   color: '#e5b143' },
    { Icon: FileText,  label: 'Changelog',   href: '../changelog/', color: '#57cbde' },
    null, // divider
    { Icon: RotateCcw, label: 'Refresh Data', onClick: handleRefresh,    color: '#66c0f4' },
    { Icon: Trash2,    label: 'Purge Cache',  onClick: handlePurgeCache, color: '#8f98a0' },
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
