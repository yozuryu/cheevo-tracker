import React from 'react';
import { createRoot } from 'react-dom/client';
import { FileText, RotateCcw, LogOut, ChevronRight, Trash2, Star } from 'lucide-react';
import { Topbar, Footer } from '../assets/ui.js';

function getCredentials() {
  try { return JSON.parse(localStorage.getItem('raCredentials')); } catch { return null; }
}

function SettingsRow({ icon, iconBg, iconColor, label, description, onClick, href, labelColor, chevron = true }) {
  const inner = (
    <>
      <span
        className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0"
        style={{ background: iconBg || '#202d39' }}
      >
        {React.cloneElement(icon, { size: 16, color: iconColor, strokeWidth: 2 })}
      </span>
      <span className="flex flex-col gap-[2px] min-w-0 flex-1">
        <span className="text-[13px] font-semibold" style={{ color: labelColor || '#c6d4df' }}>{label}</span>
        {description && <span className="text-[10px] text-[#546270]">{description}</span>}
      </span>
      {chevron && <ChevronRight size={14} color="#2a475e" strokeWidth={2} className="shrink-0" />}
    </>
  );

  const cls = "flex items-center gap-[14px] w-full px-4 py-3.5 border-b border-[#202d39] last:border-b-0 active:bg-[#202d39] transition-colors text-left font-[inherit] no-underline";

  if (href) return <a href={href} className={cls}>{inner}</a>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function SettingsSection({ title, children }) {
  return (
    <div className="mb-4">
      {title && (
        <div className="px-4 pb-2 pt-1 flex items-center gap-2">
          <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8f98a0]">{title}</span>
        </div>
      )}
      <div className="bg-[#1b2838] border border-[#2a475e] rounded-[3px] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsApp() {
  const creds = getCredentials();

  function handleRefresh() {
    sessionStorage.clear();
    location.reload();
  }

  async function handlePurgeCache() {
    sessionStorage.clear();
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

  return (
    <div className="min-h-screen bg-[#171a21] flex flex-col">
      <Topbar crumbs={[{ label: 'Cheevo Tracker', href: '../profile/' }, { label: 'Settings' }]} />

      <div className="max-w-lg mx-auto w-full px-4 pt-8 pb-5 md:pt-5 flex-1">
        <SettingsSection title="General">
          <SettingsRow
            icon={<Star />}
            iconColor="#e5b143"
            label="Backlog"
            description="Games you want to play"
            href="../profile/?tab=backlog"
          />
          <SettingsRow
            icon={<FileText />}
            iconColor="#57cbde"
            label="Changelog"
            description="View recent updates and changes"
            href="../changelog/"
          />
          <SettingsRow
            icon={<RotateCcw />}
            iconColor="#66c0f4"
            label="Refresh Data"
            description="Clear cached API data and reload"
            onClick={handleRefresh}
          />
          <SettingsRow
            icon={<Trash2 />}
            iconColor="#8f98a0"
            label="Purge Cache"
            description="Delete all PWA asset caches and reload"
            onClick={handlePurgeCache}
          />
        </SettingsSection>

        <SettingsSection title="Account">
          {creds?.username && (
            <div className="flex items-center gap-[14px] px-4 py-3.5 border-b border-[#202d39]">
              <span className="w-8 h-8 rounded-[6px] bg-[#202d39] flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8f98a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <span className="flex flex-col gap-[2px] min-w-0 flex-1">
                <span className="text-[13px] font-semibold text-[#c6d4df]">{creds.username}</span>
                <span className="text-[10px] text-[#546270]">Signed in to RetroAchievements</span>
              </span>
            </div>
          )}
          <SettingsRow
            icon={<LogOut />}
            iconColor="#ff6b6b"
            label="Log Out"
            labelColor="#ff6b6b"
            description="Clear credentials and return to login"
            onClick={handleLogout}
            chevron={false}
          />
        </SettingsSection>
      </div>

      <Footer label="Cheevo Tracker · Settings" />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<SettingsApp />);
