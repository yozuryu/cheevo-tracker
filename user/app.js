import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, BarChart2, Award, Star, Flame } from 'lucide-react';
import { MEDIA_URL, SITE_URL } from '../profile/utils/constants.js';
import { getMediaUrl, formatDate, formatTimeAgo, parseTitle } from '../profile/utils/helpers.js';
import { getCredentials, clearCredentials, getUserSummary, getUserAwards } from '../profile/utils/ra-api.js';
import { Topbar, Footer } from '../assets/ui.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function handleAuthError() {
  clearCredentials();
  window.location.replace('../');
}

// ── App ───────────────────────────────────────────────────────────────────────

function UserApp() {
  const params     = new URLSearchParams(window.location.search);
  const targetUser = params.get('u');

  const [summary, setSummary] = useState(null);
  const [awards,  setAwards]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const creds = getCredentials();

  useEffect(() => {
    if (!creds) { handleAuthError(); return; }
    if (!targetUser) { setError('No username provided.'); setLoading(false); return; }

    (async () => {
      try {
        const [sum, aw] = await Promise.all([
          getUserSummary(creds.username, creds.apiKey, { u: targetUser, g: 10, a: 5 }),
          getUserAwards(creds.username, creds.apiKey, { u: targetUser }),
        ]);
        setSummary(sum);
        setAwards(aw);
        document.title = `Cheevo Tracker · ${sum.user || targetUser}`;
      } catch (e) {
        if (e.message === 'AUTH_ERROR') handleAuthError();
        else setError('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [targetUser]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171a21] flex flex-col font-sans">
        <Topbar crumbs={[{ label: 'Cheevo Tracker', href: '../profile/' }, { label: null }]} />
        <header className="bg-[#1b2838] border-b border-[#2a475e] px-4 md:px-8 pt-8 pb-5 md:pt-5 shadow-md">
          <div className="max-w-5xl mx-auto flex items-center gap-5">
            <div className="shimmer w-20 h-20 md:w-24 md:h-24 rounded-[2px] shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="shimmer h-6 w-40 rounded" />
              <div className="shimmer h-3 w-24 rounded" />
              <div className="shimmer h-3 w-64 rounded" />
              <div className="flex gap-2 mt-1">
                <div className="shimmer h-5 w-20 rounded" />
                <div className="shimmer h-5 w-28 rounded" />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 flex-1 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
            <div className="flex flex-col gap-3">
              <div className="shimmer h-4 w-32 rounded mb-1" />
              {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-14 rounded" />)}
            </div>
            <div className="flex flex-col gap-4">
              <div className="shimmer h-40 rounded" />
              <div className="shimmer h-32 rounded" />
              <div className="shimmer h-32 rounded" />
            </div>
          </div>
        </main>
        <Footer label="cheevo-tracker · retroachievements.org" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-[#171a21] flex flex-col font-sans">
        <Topbar crumbs={[{ label: 'Cheevo Tracker', href: '../profile/' }, { label: targetUser || 'User' }]} />
        <div className="flex-1 flex items-center justify-center text-[#8f98a0] text-sm">{error}</div>
        <Footer label="cheevo-tracker · retroachievements.org" />
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const recentlyPlayed = summary.recentlyPlayed || [];

  // recentAchievements: raw PascalCase { gameIdStr: { achIdStr: { ID, Title, ... } } }
  const recentAchievements = [];
  for (const [, gameAchs] of Object.entries(summary.recentAchievements || {})) {
    for (const ach of Object.values(gameAchs)) {
      recentAchievements.push(ach);
    }
  }
  recentAchievements.sort((a, b) => (b.DateAwarded || '').localeCompare(a.DateAwarded || ''));

  const siteAwards = (awards?.visibleUserAwards || []).filter(a => a.awardType === 'AchievementSiteAward');
  const gameAwards = (awards?.visibleUserAwards || []).filter(a =>
    a.awardType === 'Mastery/Completion' || a.awardType === 'GameBeaten');

  const masteryCount  = (awards?.masteryAwardsCount  || 0) + (awards?.completionAwardsCount    || 0);
  const beatenHcCount = awards?.beatenHardcoreAwardsCount || 0;
  const beatenScCount = awards?.beatenSoftcoreAwardsCount || 0;

  const topPct = summary.rank && summary.totalRanked
    ? ((summary.rank / summary.totalRanked) * 100).toFixed(1) + '%'
    : null;

  const statusDotColor = summary.status === 'Online'  ? '#57cbde'
                       : summary.status === 'Playing' ? '#6bcf7f'
                       : '#546270';

  const stats = [
    { label: 'Hardcore Points', value: (summary.totalPoints        || 0).toLocaleString(), color: '#e5b143' },
    { label: 'True Points',     value: (summary.totalTruePoints    || 0).toLocaleString(), color: '#e5b143' },
    { label: 'Softcore Points', value: (summary.totalSoftcorePoints|| 0).toLocaleString(), color: '#8f98a0' },
    { label: 'Global Rank',     value: summary.rank ? `#${Number(summary.rank).toLocaleString()}` : '—', color: '#c6d4df' },
    summary.softcoreRank ? { label: 'Softcore Rank', value: `#${Number(summary.softcoreRank).toLocaleString()}`, color: '#8f98a0' } : null,
    { label: 'Mastered',        value: masteryCount.toLocaleString(),  color: '#e5b143' },
    { label: 'Beaten (HC)',     value: beatenHcCount.toLocaleString(), color: '#8f98a0' },
    beatenScCount > 0 ? { label: 'Beaten (SC)', value: beatenScCount.toLocaleString(), color: '#546270' } : null,
  ].filter(Boolean);

  // ── Page ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#171a21] flex flex-col font-sans selection:bg-[#66c0f4] selection:text-[#171a21]">
      <Topbar crumbs={[
        { label: 'Cheevo Tracker', href: '../profile/' },
        { label: summary.user || targetUser },
      ]} />

      {/* ── Header ── */}
      <header className="bg-[#1b2838] border-b border-[#2a475e] px-4 md:px-8 pt-8 pb-5 md:pt-5 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-5">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2px] border border-[#4c9be8] shadow-[0_2px_12px_rgba(0,0,0,0.5)] overflow-hidden bg-[#101214]">
              <img
                src={getMediaUrl(summary.userPic)}
                alt={summary.user}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.style.opacity = '0'; }}
              />
            </div>
            <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-[#1b2838]"
              style={{ background: statusDotColor }} />
          </div>

          {/* Meta */}
          <div className="flex-1 flex flex-col gap-1.5 text-center md:text-left">

            {/* Name row */}
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <h1 className="text-2xl md:text-[26px] text-white font-medium tracking-wide leading-none">
                {summary.user}
              </h1>
              <a href={`${SITE_URL}/user/${summary.user}`} target="_blank" rel="noreferrer"
                title="View on RetroAchievements"
                className="hover:opacity-80 transition-opacity bg-[#101214] p-1 rounded-[2px] border border-[#323f4c] flex items-center justify-center shrink-0">
                <img
                  src="https://static.retroachievements.org/assets/images/favicon.webp"
                  onError={e => { e.target.onerror = null; e.target.src = "https://avatars.githubusercontent.com/u/49842581?s=32&v=4"; }}
                  alt="RA"
                  className="w-3.5 h-3.5 object-contain"
                />
              </a>
            </div>

            {/* Rank */}
            {summary.rank && (
              <div className="text-[11px] text-[#66c0f4]">
                Rank <span className="text-[#e5b143] font-bold">#{Number(summary.rank).toLocaleString()}</span>
                {topPct && (
                  <span> · Top <span className="text-[#e5b143] font-bold">{topPct}</span></span>
                )}
              </div>
            )}

            {/* Motto */}
            {summary.motto && (
              <p className="text-[12px] text-[#8f98a0] italic border-l-2 border-[#2a475e] pl-2 leading-snug">
                "{summary.motto}"
              </p>
            )}

            {/* Pills */}
            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mt-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.07em] px-2 py-[3px] rounded-[2px] border border-[#323f4c] bg-[#101214] text-[#546270]">
                <span className="text-[#e5b143]">{(summary.totalPoints || 0).toLocaleString()}</span> pts
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.07em] px-2 py-[3px] rounded-[2px] border border-[#323f4c] bg-[#101214] text-[#546270]">
                Member since <span className="text-[#c6d4df]">{formatDate(summary.memberSince)}</span>
              </span>
              {summary.richPresenceMsg && (
                <span className="text-[9px] italic px-2 py-[3px] rounded-[2px] border border-[#323f4c] bg-[#101214] text-[#8f98a0] max-w-[280px] truncate">
                  {summary.richPresenceMsg}
                </span>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-6">

            {/* Recently Played */}
            {recentlyPlayed.length > 0 && (
              <div>
                <h2 className="text-[13px] text-white tracking-wide uppercase font-medium border-b border-[#2a475e] pb-1.5 flex items-center gap-2 mb-3">
                  <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                  <Activity size={15} className="text-[#66c0f4]" /> Recently Played
                </h2>
                <div className="flex flex-col gap-[2px]">
                  {recentlyPlayed.map(g => {
                    const total  = g.numPossibleAchievements || 0;
                    const earned = g.numAchieved || 0;
                    const pct    = total > 0 ? Math.round((earned / total) * 100) : 0;
                    const parsed = parseTitle(g.title);
                    return (
                      <a key={g.gameId} href={`../game/?id=${g.gameId}`}
                        className="flex items-center gap-3 px-2.5 py-2 bg-[#1b2838] hover:bg-[#202d39] rounded-[2px] border border-transparent hover:border-[#2a475e] transition-colors">
                        <img
                          src={getMediaUrl(g.imageIcon)}
                          alt={g.title}
                          className="w-10 h-10 rounded-[2px] border border-[#101214] object-cover shrink-0 bg-[#131a22]"
                          onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-[12px] font-medium text-[#c6d4df] hover:text-[#66c0f4] transition-colors truncate">{parsed.baseTitle}</span>
                            <span className="text-[9px] text-[#8f98a0] shrink-0">{g.consoleName}</span>
                          </div>
                          {total > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-[2px] bg-[#2a475e] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, background: pct === 100 ? '#e5b143' : '#66c0f4' }} />
                              </div>
                              <span className="text-[9px] shrink-0">
                                <span style={{ color: pct === 100 ? '#e5b143' : '#66c0f4' }}>{earned}</span>
                                <span className="text-[#546270]">/{total}</span>
                              </span>
                            </div>
                          )}
                        </div>
                        {g.lastPlayed && (
                          <span className="text-[9px] text-[#546270] shrink-0">{formatTimeAgo(g.lastPlayed)}</span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div>
                <h2 className="text-[13px] text-white tracking-wide uppercase font-medium border-b border-[#2a475e] pb-1.5 flex items-center gap-2 mb-3">
                  <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
                  <Star size={15} className="text-[#e5b143]" /> Recent Achievements
                </h2>
                <div className="flex flex-col gap-[2px]">
                  {recentAchievements.map((a, i) => {
                    const hc = a.HardcoreAchieved === 1 || a.HardcoreAchieved === '1';
                    return (
                      <a key={`${a.ID || i}`} href={`../achievement/?id=${a.ID}`}
                        className={`flex items-center gap-3 px-2.5 py-2 bg-[#1b2838] hover:bg-[#202d39] border-l-[3px] rounded-[2px] transition-colors ${hc ? 'border-l-[#e5b143]' : 'border-l-[#8f98a0]'}`}>
                        <img
                          src={`${MEDIA_URL}/Badge/${a.BadgeName || '00001'}.png`}
                          alt={a.Title}
                          className="w-9 h-9 rounded-[2px] border border-[#101214] object-cover shrink-0 bg-[#131a22]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-[#e5b143] hover:text-[#f0c96a] transition-colors truncate">{a.Title}</div>
                          <div className="text-[9px] text-[#8f98a0] truncate">{a.GameTitle}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {hc && (
                            <span className="flex items-center gap-0.5 text-[8px] font-bold px-1 py-[1px] rounded-sm"
                              style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)' }}>
                              <Flame size={7} /> HC
                            </span>
                          )}
                          {a.DateAwarded && (
                            <span className="text-[9px] text-[#546270]">{formatTimeAgo(a.DateAwarded)}</span>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {recentlyPlayed.length === 0 && recentAchievements.length === 0 && (
              <div className="text-center py-16 text-[#546270] text-[11px]">No recent activity.</div>
            )}

          </div>

          {/* ── Right sidebar ── */}
          <div className="flex flex-col gap-5">

            {/* Stats */}
            <div className="bg-[#1b2838] border border-[#2a475e] rounded-[3px] shadow-sm h-fit">
              <div className="p-2.5 bg-[#172333] border-b border-[#2a475e] rounded-t-[2px] flex items-center gap-2">
                <span className="w-[2px] h-[12px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                <span className="text-[11px] uppercase tracking-wide font-semibold text-[#c6d4df] flex items-center gap-2">
                  <BarChart2 size={13} className="text-[#66c0f4]" /> Stats
                </span>
              </div>
              <div className="p-3 flex flex-col">
                {stats.map((s, i) => (
                  <div key={i} className="flex items-end text-[11px] py-[3px] group hover:bg-[#202d39]/40 rounded-sm px-1 transition-colors">
                    <span className="text-[#8f98a0] font-medium leading-tight whitespace-nowrap">{s.label}</span>
                    <div className="flex-1 border-b-[1.5px] border-dotted border-[#323f4c] mx-2 relative top-[-4px] opacity-60 group-hover:border-[#546270]" />
                    <span className="font-medium whitespace-nowrap leading-tight text-right" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Site Awards */}
            <div className="bg-[#1b2838] border border-[#2a475e] rounded-[3px] shadow-sm h-fit">
              <div className="p-2.5 bg-[#172333] border-b border-[#2a475e] rounded-t-[2px] flex items-center gap-2">
                <span className="w-[2px] h-[12px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                <span className="text-[11px] uppercase tracking-wide font-semibold text-[#c6d4df] flex items-center gap-2">
                  <Award size={13} className="text-[#66c0f4]" /> Site Awards
                </span>
              </div>
              <div className="p-3 grid grid-cols-5 gap-2 min-h-[60px] overflow-hidden">
                {siteAwards.length > 0 ? siteAwards.map((a, i) => (
                  a.imageIcon ? (
                    <img key={i} src={getMediaUrl(a.imageIcon)} title={a.title} alt={a.title}
                      className="w-full aspect-square rounded-[2px] border border-[#101214] opacity-80 hover:opacity-100 transition-opacity cursor-help bg-black" />
                  ) : (
                    <div key={i} title={a.title}
                      className="w-full aspect-square rounded-[2px] border border-[#101214] bg-[#202d39] flex items-center justify-center">
                      <Award size={16} className="text-[#546270]" />
                    </div>
                  )
                )) : (
                  <div className="col-span-full text-center text-[#546270] text-[10px] py-2">No site awards yet.</div>
                )}
              </div>
            </div>

            {/* Game Awards */}
            <div className="bg-[#1b2838] border border-[#2a475e] rounded-[3px] shadow-sm h-fit">
              <div className="p-2.5 bg-[#172333] border-b border-[#2a475e] rounded-t-[2px] flex items-center gap-2">
                <span className="w-[2px] h-[12px] bg-[#e5b143] rounded-[1px] shrink-0" />
                <span className="text-[11px] uppercase tracking-wide font-semibold text-[#c6d4df] flex items-center gap-2">
                  <Star size={13} className="text-[#e5b143]" /> Game Awards
                </span>
              </div>
              <div className="p-3 grid grid-cols-5 gap-2 min-h-[60px] overflow-hidden">
                {gameAwards.length > 0 ? gameAwards.map((a, i) => {
                  const parsed    = parseTitle(a.title);
                  const isMastery = a.awardType === 'Mastery/Completion';
                  return (
                    <div key={i} className="relative group cursor-help">
                      <img
                        src={getMediaUrl(a.imageIcon)}
                        alt={a.title}
                        className={`w-full aspect-square rounded-[2px] border transition-all duration-200 bg-black relative z-10 group-hover:scale-110 ${
                          isMastery
                            ? 'border-2 border-[#e5b143]'
                            : 'border border-[#e5b143]/30 group-hover:border-[#e5b143]/80'
                        }`}
                      />
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[200px] bg-[#1b2838] border border-[#2a475e] rounded-[2px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] shadow-xl pointer-events-none overflow-hidden">
                        <div className="h-[2px] bg-gradient-to-r from-[#e5b143] to-[#e5b143]/20" />
                        <div className="flex items-center gap-2 px-2.5 py-2 border-b border-[#2a475e] bg-[#172333]">
                          <img src={getMediaUrl(a.imageIcon)} alt=""
                            className="w-8 h-8 rounded-[2px] border border-[#e5b143]/30 bg-black shrink-0" />
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[11px] text-white font-semibold leading-tight">{parsed.baseTitle}</span>
                            {parsed.isSubset && <span className="text-[9px] text-[#c8a84b] truncate">{parsed.subsetName}</span>}
                          </div>
                        </div>
                        <div className="px-2.5 py-2 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-[#546270] uppercase tracking-[0.08em]">Console</span>
                            <span className="text-[9px] text-[#66c0f4] font-medium">{a.consoleName}</span>
                          </div>
                          <div className="h-px bg-[#2a475e]" />
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-[#546270] uppercase tracking-[0.08em]">Award</span>
                            {isMastery
                              ? <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded-[2px] bg-[#e5b143] text-[#101214]">Mastered</span>
                              : <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded-[2px] bg-[#546270] text-white border border-[#c6d4df]/20">Beaten</span>
                            }
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-[#546270] uppercase tracking-[0.08em]">Earned</span>
                            <span className="text-[9px] text-[#c6d4df]">{formatDate(a.awardedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full text-center text-[#546270] text-[10px] py-2">No game awards yet.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer label="cheevo-tracker · retroachievements.org" />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<UserApp />);
