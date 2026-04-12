import React from 'react';

/**
 * Shared UI components — Topbar and Footer.
 * Must use React.createElement (no JSX) — this file is loaded by the native
 * ES module loader, not transpiled by Babel standalone.
 *
 * Topbar props:
 *   crumbs  — array of { label, href? }. First is root; last is current page.
 *   right   — optional element rendered on the far right (e.g. logout button).
 *
 * Footer props:
 *   label   — string or element for the left-side text.
 *   right   — optional element rendered on the far right.
 */

export function Topbar({ crumbs = [], right }) {
  const items = crumbs.flatMap((crumb, i) => {
    const sep = i > 0
      ? React.createElement('span', { key: `sep-${i}`, className: 'text-[#2a475e]' }, '›')
      : null;
    const el = crumb.href
      ? React.createElement('a', {
          key: `crumb-${i}`,
          href: crumb.href,
          className: 'text-[#546270] font-bold tracking-[0.15em] uppercase hover:text-[#8f98a0] transition-colors',
        }, crumb.label)
      : React.createElement('span', {
          key: `crumb-${i}`,
          className: i === 0 ? 'text-[#546270] font-bold tracking-[0.15em] uppercase' : 'text-[#c6d4df]',
        }, crumb.label);
    return sep ? [sep, el] : [el];
  });

  if (right) {
    items.push(React.createElement('div', { key: 'right', className: 'ml-auto' }, right));
  }

  return React.createElement(
    'div',
    { className: 'page-topbar sticky top-0 z-50 bg-[#131a22] border-b border-[#101214] px-4 md:px-8 py-1.5 flex items-center gap-2 text-[10px]' },
    ...items
  );
}

export function Footer({ label, right }) {
  return React.createElement(
    'footer',
    { className: 'bg-[#1b2838] border-t-2 border-[#2a475e] px-4 md:px-8 py-2.5 flex items-center gap-3 mt-auto' },
    React.createElement('div', { className: 'w-[3px] h-[18px] rounded-[1px] bg-[#66c0f4] opacity-50 shrink-0' }),
    React.createElement('div', { className: 'text-[10px] text-[#546270]' }, label),
    right ? React.createElement('div', { key: 'right', className: 'ml-auto shrink-0' }, right) : null
  );
}
