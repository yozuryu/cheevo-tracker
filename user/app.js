import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, BarChart2, Star, Trophy, Clock, ChevronDown, Medal } from 'lucide-react';
import { MEDIA_URL, SITE_URL, TILDE_TAG_COLORS } from '../profile/utils/constants.js';
import { getMediaUrl, formatDate, formatTimeAgo, parseTitle } from '../profile/utils/helpers.js';
import { getCredentials, clearCredentials, getUserSummary, getUserAwards, getUserCompletionProgress } from '../profile/utils/ra-api.js';
import { Topbar, Footer } from '../assets/ui.js';

function handleAuthError() {
  clearCredentials();
  window.location.replace('../');
}

const renderTildeTags = (tags) => {
  if (!tags || tags.length === 0) return null;
  return tags.map(tag => {
    const style = TILDE_TAG_COLORS[tag] || TILDE_TAG_COLORS['Prototype'];
    return (
      <span key={tag} style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '1px 4px', borderRadius: '2px', border: `1px solid ${style.border}`, background: style.bg, color: style.color, flexShrink: 0 }}>{tag}</span>
    );
  });
};

// ── Shared section header ─────────────────────────────────────────────────────

const SectionHeader = ({ accentColor, icon: Icon, label }) => (
  <h2 className="text-[13px] text-white tracking-wide uppercase font-medium border-b border-[#2a475e] pb-1.5 flex items-center gap-2 mb-3">
    <span className="w-[3px] h-[14px] rounded-[1px] shrink-0" style={{ background: accentColor }} />
    <Icon size={15} style={{ color: accentColor }} /> {label}
  </h2>
);

// ── Stat row (dotted) ─────────────────────────────────────────────────────────

const StatRow = ({ label, value, dim }) => (
  <div className="flex items-end text-[11px] py-[3px] group hover:bg-[#202d39]/40 rounded-sm px-1 transition-colors">
    <span className="text-[#8f98a0] font-medium leading-tight whitespace-nowrap">{label}</span>
    <div className="flex-1 border-b-[1.5px] border-dotted border-[#323f4c] mx-2 relative top-[-4px] opacity-60 group-hover:border-[#546270]" />
    <span className={`${dim ? 'text-[#546270] italic' : 'text-[#c6d4df]'} font-medium whitespace-nowrap leading-tight text-right`}>{value}</span>
  </div>
);

// ── Game Award sidebar card (collapsible + tooltips) ──────────────────────────

const GameAwardCard = ({ awards }) => {
  const [expanded, setExpanded] = useState(false);
  const collapseLimit = window.innerWidth >= 640 ? 20 : 10; // 4 rows desktop / 2 rows mobile (5 cols)
  const visible = expanded ? awards : awards.slice(0, collapseLimit);
  const hasMore = awards.length > collapseLimit;

  return (
    <div className="bg-[#1b2838] border border-[#2a475e] rounded-[3px] shadow-sm h-fit">
      <div className="p-2.5 bg-[#172333] border-b border-[#2a475e] rounded-t-[2px] flex items-center gap-2">
        <span className="w-[2px] h-[12px] bg-[#e5b143] rounded-[1px] shrink-0" />
        <span className="text-[11px] uppercase tracking-wide font-semibold text-[#c6d4df] flex items-center gap-2">
          <Star size={13} className="text-[#e5b143]" /> Game Awards
        </span>
        {awards.length > 0 && (
          <span className="ml-auto text-[9px] text-[#546270]">{awards.length}</span>
        )}
      </div>
      {awards.length === 0 ? (
        <div className="p-3 text-center text-[#546270] text-[10px] py-4">No game awards yet.</div>
      ) : (
        <>
          <div className="p-3 grid grid-cols-5 gap-2">
            {visible.map((a, i) => {
              const parsed = parseTitle(a.title || '');
              const isMastery = a.awardType === 'Mastery/Completion';
              return (
                <div key={i} className="relative group cursor-help">
                  <img
                    src={getMediaUrl(a.imageIcon)}
                    alt={a.title}
                    className={`w-full aspect-square rounded-[2px] border transition-all duration-200 bg-black relative z-10 group-hover:scale-110 ${
                      isMastery ? 'border-2 border-[#e5b143]' : 'border border-[#e5b143]/30 group-hover:border-[#e5b143]/80'
                    }`}
                  />
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
            })}
          </div>
          {hasMore && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-center gap-1 py-1.5 border-t border-[#1e2d3a] text-[10px] text-[#546270] hover:text-[#8f98a0] transition-colors"
            >
              <ChevronDown size={11} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
              {expanded ? 'Show less' : `${awards.length - collapseLimit} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
};

// ── Progress tab game row ─────────────────────────────────────────────────────

const ProgressGameRow = ({ game }) => {
  const pct = game.maxPossible > 0 ? (game.numAwardedHardcore / game.maxPossible) * 100 : 0;
  const isMastered = game.highestAwardKind === 'mastered';
  const isBeatenHc = game.highestAwardKind === 'beaten-hardcore';
  const isBeaten = isMastered || isBeatenHc || game.highestAwardKind === 'beaten-softcore';
  const parsed = parseTitle(game.title);
  const stripeColor = isMastered ? 'border-l-[#e5b143]' : isBeaten ? 'border-l-[#8f98a0]'
    : game.numAwardedHardcore > 0 ? 'border-l-[#66c0f4]'
    : game.numAwarded > 0 ? 'border-l-[#546270]' : 'border-l-[#323f4c]';

  return (
    <a href={`../game/?id=${game.gameId}`}
      className={`flex items-center gap-3 px-2.5 py-2 bg-[#1b2838] hover:bg-[#202d39] border-l-[3px] rounded-[3px] border border-transparent hover:border-[#323f4c] transition-colors ${stripeColor}`}>
      <img src={getMediaUrl(game.imageIcon)} alt={game.title}
        className="w-10 h-10 rounded-[2px] border border-[#101214] object-cover shrink-0 bg-[#131a22]"
        onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[12px] font-medium text-[#c6d4df] hover:text-[#66c0f4] transition-colors truncate">{parsed.baseTitle}</span>
          <span className="text-[9px] text-[#8f98a0] shrink-0">{game.consoleName}</span>
        </div>
        {game.maxPossible > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-[3px] bg-[#101214] rounded-full overflow-hidden">
              {pct > 0 && (
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: isMastered ? '#e5b143' : '#66c0f4' }} />
              )}
            </div>
            <span className="text-[9px] shrink-0">
              <span style={{ color: isMastered ? '#e5b143' : '#66c0f4' }}>{game.numAwardedHardcore}</span>
              <span className="text-[#546270]">/{game.maxPossible}</span>
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isMastered && (
          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded-[2px] bg-[#e5b143] text-[#101214] flex items-center gap-0.5">
            <Trophy size={8} /> Mastered
          </span>
        )}
        {isBeaten && !isMastered && (
          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded-[2px] bg-[#546270] text-white border border-[#c6d4df]/20 flex items-center gap-0.5">
            <Medal size={8} /> Beaten
          </span>
        )}
        {game.maxPossible > 0 && (
          <span className="text-[9px] text-[#546270] w-10 text-right">{pct.toFixed(0)}%</span>
        )}
      </div>
    </a>
  );
};

// ── App ───────────────────────────────────────────────────────────────────────

function UserApp() {
  const params     = new URLSearchParams(window.location.search);
  const targetUser = params.get('u');
  const initialTab = params.get('tab') || 'recent';

  const [summary,           setSummary]           = useState(null);
  const [awards,            setAwards]            = useState(null);
  const [completion,        setCompletion]        = useState(null);
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [activeTab,         setActiveTab]         = useState(initialTab);
  const [showMastered,      setShowMastered]      = useState(true);
  const [progressSearch,    setProgressSearch]    = useState('');

  const creds = getCredentials();

  const setTab = (tab) => {
    setActiveTab(tab);
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  };

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

  // Lazy-load completion progress when Progress tab is first opened
  useEffect(() => {
    if (activeTab !== 'progress' || completion !== null || loadingCompletion) return;
    if (!creds || !targetUser) return;

    setLoadingCompletion(true);
    getUserCompletionProgress(creds.username, creds.apiKey, { u: targetUser })
      .then(data => setCompletion(data))
      .catch(e => {
        if (e.message === 'AUTH_ERROR') handleAuthError();
        else setCompletion([]);
      })
      .finally(() => setLoadingCompletion(false));
  }, [activeTab]);

  // ── Derived data (hooks must run before any early returns) ───────────────────

  const recentlyPlayed = summary?.recentlyPlayed || [];
  const mostRecentGame = recentlyPlayed[0] || null;

  const recentAchievements = useMemo(() => {
    const list = [];
    for (const [gameIdStr, gameAchs] of Object.entries(summary?.recentAchievements || {})) {
      const gameId = parseInt(gameIdStr, 10);
      const gameInfo = (summary?.recentlyPlayed || []).find(g => g.gameId === gameId);
      for (const ach of Object.values(gameAchs)) {
        list.push({ ...ach, _gameId: gameId, _gameInfo: gameInfo || null });
      }
    }
    return list.sort((a, b) => (b.DateAwarded || '').localeCompare(a.DateAwarded || ''));
  }, [summary?.recentAchievements, summary?.recentlyPlayed]);

  const mostRecentAch = recentAchievements[0] || null;

  const rawGameAwards = (awards?.visibleUserAwards || []).filter(a =>
    a.awardType === 'Mastery/Completion' || a.awardType === 'Game Beaten');

  const gameAwards = useMemo(() => {
    const byGame = new Map();
    for (const a of rawGameAwards) {
      const key = a.awardData;
      const existing = byGame.get(key);
      if (!existing || a.awardType === 'Mastery/Completion') byGame.set(key, a);
    }
    return [...byGame.values()].sort((a, b) => {
      const order = { 'Mastery/Completion': 0, 'Game Beaten': 1 };
      return (order[a.awardType] ?? 2) - (order[b.awardType] ?? 2);
    });
  }, [awards]);

  const progressGames = useMemo(() => {
    if (!completion) return [];
    return completion
      .filter(g => {
        if (g.numAwarded === 0) return false;
        if (!showMastered && g.highestAwardKind === 'mastered') return false;
        if (progressSearch) {
          if (!(g.title || '').toLowerCase().includes(progressSearch.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const pA = a.maxPossible > 0 ? a.numAwardedHardcore / a.maxPossible : 0;
        const pB = b.maxPossible > 0 ? b.numAwardedHardcore / b.maxPossible : 0;
        return pB - pA;
      });
  }, [completion, showMastered, progressSearch]);

  // ── Loading skeleton ────────────────────────────────────────────────────────

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
            <div className="flex flex-col gap-4">
              <div className="shimmer h-4 w-20 rounded" />
              <div className="grid grid-cols-2 gap-x-8">
                {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-4 rounded mb-2" />)}
              </div>
              <div className="shimmer h-px w-full rounded mt-2" />
              {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-14 rounded" />)}
            </div>
            <div className="flex flex-col gap-4">
              <div className="shimmer h-40 rounded" />
              <div className="shimmer h-40 rounded" />
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

  // ── Non-hook derived values (after early returns, summary/awards guaranteed non-null) ──

  const topPct = summary?.rank && summary?.totalRanked
    ? ((summary.rank / summary.totalRanked) * 100).toFixed(1) + '%'
    : null;

  const statusDotColor = summary?.status === 'Online'  ? '#57cbde'
                       : summary?.status === 'Playing' ? '#6bcf7f'
                       : '#546270';

  const retroRatio = (summary?.totalPoints || 0) > 0
    ? ((summary.totalTruePoints || 0) / (summary.totalPoints || 1)).toFixed(2) : '0.00';

  const memberSinceMs = summary?.memberSince ? new Date(summary.memberSince).getTime() : null;
  const weeksSince = memberSinceMs ? Math.max(1, (Date.now() - memberSinceMs) / (7 * 24 * 60 * 60 * 1000)) : 1;
  const avgPointsPerWeek = summary?.totalPoints ? Math.round(summary.totalPoints / weeksSince) : 0;

  const totalUnlocked = completion ? completion.reduce((acc, g) => acc + g.numAwarded, 0) : null;
  const totalHardcoreUnlocked = completion ? completion.reduce((acc, g) => acc + g.numAwardedHardcore, 0) : null;

  const beatenCount = (awards?.visibleUserAwards || []).filter(a =>
    a.awardType === 'Mastery/Completion' || a.awardType === 'Game Beaten').length;

  const startedGames = completion ? completion.filter(g => g.numAwarded > 0 && g.maxPossible > 0) : null;
  const startedGamesCount = startedGames ? startedGames.length : 0;
  const startedGamesBeatenPct = startedGames && startedGamesCount > 0
    ? ((beatenCount / startedGamesCount) * 100).toFixed(2) + '%' : null;
  const avgCompletion = startedGames && startedGamesCount > 0
    ? (startedGames.reduce((acc, g) => acc + (g.numAwarded / g.maxPossible) * 100, 0) / startedGamesCount).toFixed(2) + '%'
    : null;

  const statsLeft = [
    { label: 'Points', value: `${(summary?.totalPoints || 0).toLocaleString()} (${(summary?.totalTruePoints || 0).toLocaleString()})` },
    { label: 'Site rank', value: summary?.rank ? `#${Number(summary.rank).toLocaleString()} of ${summary.totalRanked?.toLocaleString() || '?'}` : 'requires points', dim: !summary?.rank },
    { label: 'Achievements unlocked', value: totalUnlocked !== null ? totalUnlocked.toLocaleString() : '—', dim: totalUnlocked === null },
    { label: 'RetroRatio', value: retroRatio },
    { label: 'Points earned in the last 7 days', value: '—', dim: true },
    { label: 'Points earned in the last 30 days', value: '—', dim: true },
    { label: 'Average points per week', value: avgPointsPerWeek.toLocaleString() },
  ];

  const statsRight = [
    { label: 'Points (softcore)', value: (summary?.totalSoftcorePoints || 0).toLocaleString() },
    { label: 'Softcore rank', value: summary?.softcoreRank ? `#${Number(summary.softcoreRank).toLocaleString()}` : 'requires 250 points', dim: !summary?.softcoreRank },
    { label: 'Achievements unlocked (softcore)', value: totalUnlocked !== null && totalHardcoreUnlocked !== null ? (totalUnlocked - totalHardcoreUnlocked).toLocaleString() : '—', dim: totalUnlocked === null },
    { label: 'Started games beaten', value: startedGamesBeatenPct || '—', dim: !startedGamesBeatenPct },
    { label: 'Total games beaten', value: beatenCount.toString() },
    { label: 'Average completion', value: avgCompletion || '—', dim: !avgCompletion },
  ];

  // ── Tab button ───────────────────────────────────────────────────────────────

  const TabBtn = ({ tab, icon: Icon, label }) => (
    <button
      onClick={() => setTab(tab)}
      className={`flex items-center gap-1.5 pb-2.5 px-0.5 text-[13px] uppercase tracking-wide font-medium transition-colors relative whitespace-nowrap ${
        activeTab === tab ? 'text-white' : 'text-[#546270] hover:text-[#c6d4df]'
      }`}
    >
      <Icon size={14} />
      {label}
      {activeTab === tab && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#66c0f4] rounded-t-sm" />}
    </button>
  );

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
              <img src={getMediaUrl(summary.userPic)} alt={summary.user}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.style.opacity = '0'; }} />
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
                  alt="RA" className="w-3.5 h-3.5 object-contain" />
              </a>
            </div>

            {/* Rank */}
            {summary.rank && (
              <div className="text-[11px] text-[#66c0f4]">
                Rank <span className="text-[#e5b143] font-bold">#{Number(summary.rank).toLocaleString()}</span>
                {topPct && <span> · Top <span className="text-[#e5b143] font-bold">{topPct}</span></span>}
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
                <span className="text-[#c6d4df]">{totalUnlocked !== null ? totalUnlocked.toLocaleString() : '—'}</span> achievements
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.07em] px-2 py-[3px] rounded-[2px] border border-[#323f4c] bg-[#101214] text-[#546270]">
                Member since <span className="text-[#c6d4df]">{formatDate(summary.memberSince)}</span>
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-6">

            {/* Most Recently Played */}
            {mostRecentGame && (() => {
              const { baseTitle, isSubset, subsetName, tags } = parseTitle(mostRecentGame.title);
              return (
                <div>
                  <SectionHeader accentColor="#66c0f4" icon={Activity} label="Most Recently Played" />
                  <div className="bg-[#1b2838]/80 border border-[#323f4c] border-l-[3px] border-l-[#66c0f4] rounded-[3px] p-3 flex gap-4 hover:bg-[#202d39] transition-colors shadow-sm">
                    <a href={`../game/?id=${mostRecentGame.gameId}`}
                      className="w-14 h-14 shrink-0 rounded-[2px] overflow-hidden border border-[#101214] bg-black block hover:scale-105 transition-transform">
                      <img src={getMediaUrl(mostRecentGame.imageIcon)} alt={mostRecentGame.title} className="w-full h-full object-cover" />
                    </a>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <a href={`../game/?id=${mostRecentGame.gameId}`}
                          className="text-[#c6d4df] hover:text-[#66c0f4] font-medium text-[14px] truncate leading-tight transition-colors">
                          {baseTitle}
                        </a>
                        {isSubset && <span className="text-[7px] font-bold uppercase tracking-[0.07em] px-1.5 py-[1px] rounded-[2px] border border-[#c8a84b]/40 bg-[#c8a84b]/10 text-[#c8a84b] shrink-0">Subset</span>}
                        {renderTildeTags(tags)}
                      </div>
                      {isSubset && subsetName && <div className="text-[10px] text-[#c8a84b] mb-0.5 truncate">{subsetName}</div>}
                      <div className="text-[10px] mb-1 flex items-center gap-1.5">
                        <span className="text-[#66c0f4]">{mostRecentGame.consoleName}</span>
                        {mostRecentGame.lastPlayed && <>
                          <span className="text-[#546270]">·</span>
                          <span className="text-[#8f98a0]">{formatTimeAgo(mostRecentGame.lastPlayed)}</span>
                        </>}
                      </div>
                      {summary.richPresenceMsg && (
                        <p className="text-[#c6d4df] text-[11px] leading-snug italic border-l-2 border-[#323f4c] pl-2 mt-1">{summary.richPresenceMsg}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Most Recently Unlocked Achievement */}
            {mostRecentAch && (() => {
              const gameInfo = mostRecentAch._gameInfo;
              const gameTitle = mostRecentAch.GameTitle || gameInfo?.title || '';
              const gameId = mostRecentAch._gameId;
              const gameIcon = gameInfo?.imageIcon ? getMediaUrl(gameInfo.imageIcon) : null;
              const { baseTitle: gameBaseTitle, tags: gameTags } = parseTitle(gameTitle);
              const points = mostRecentAch.Points || 0;
              const trueRatio = mostRecentAch.TrueRatio || 0;
              const ratio = points > 0 && trueRatio > 0 ? trueRatio / points : 0;
              const ratioColor = ratio >= 30 ? '#ff6b6b' : ratio >= 20 ? '#e5b143' : ratio >= 10 ? '#66c0f4' : '#8f98a0';
              return (
                <div>
                  <SectionHeader accentColor="#e5b143" icon={Trophy} label="Most Recently Unlocked" />
                  <div className="bg-[#1b2838]/80 border border-[#323f4c] border-l-[3px] border-l-[#e5b143] rounded-[3px] p-3 flex gap-3 hover:bg-[#202d39] transition-colors shadow-sm">
                    <a href={`../achievement/?id=${mostRecentAch.ID}`}
                      className="shrink-0 w-12 h-12 rounded-[2px] overflow-hidden border border-[#101214] bg-black block hover:scale-105 transition-transform">
                      <img src={`${MEDIA_URL}/Badge/${mostRecentAch.BadgeName || '00001'}.png`} alt={mostRecentAch.Title}
                        className="w-full h-full object-cover" />
                    </a>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <a href={`../achievement/?id=${mostRecentAch.ID}`}
                          className="text-[13px] font-medium text-[#e5b143] hover:text-[#f0c96a] transition-colors truncate leading-tight">
                          {mostRecentAch.Title}
                        </a>
                        {points > 0 && (
                          <span className="text-[9px] font-bold text-[#66c0f4] bg-[#101214] border border-[#323f4c] px-1.5 py-[1px] rounded-sm shrink-0">
                            {points} pts
                          </span>
                        )}
                        {ratio > 0 && points > 0 && (
                          <span className="text-[9px] font-bold shrink-0" style={{ color: ratioColor }}>×{ratio.toFixed(1)}</span>
                        )}
                      </div>
                      {mostRecentAch.Description && (
                        <p className="text-[10px] text-[#8f98a0] leading-snug mb-1 truncate">{mostRecentAch.Description}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] min-w-0">
                        {gameId ? (
                          <a href={`../game/?id=${gameId}`} className="flex items-center gap-1 group min-w-0 shrink truncate">
                            {gameIcon && <img src={gameIcon} className="w-3.5 h-3.5 rounded-[1px] border border-[#101214] shrink-0" alt="" />}
                            <span className="text-[#66c0f4] group-hover:text-[#c6d4df] transition-colors truncate">{gameBaseTitle || gameTitle}</span>
                            {renderTildeTags(gameTags)}
                          </a>
                        ) : gameTitle ? (
                          <span className="text-[#66c0f4] truncate">{gameBaseTitle || gameTitle}</span>
                        ) : null}
                        {gameInfo?.consoleName && <>
                          <span className="text-[#546270] shrink-0">·</span>
                          <span className="text-[#8f98a0] shrink-0 whitespace-nowrap">{gameInfo.consoleName}</span>
                        </>}
                        {mostRecentAch.DateAwarded && <>
                          <span className="text-[#546270] shrink-0">·</span>
                          <span className="text-[#546270] shrink-0 whitespace-nowrap">{formatTimeAgo(mostRecentAch.DateAwarded)}</span>
                        </>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Stats — 2-column dotted grid */}
            <div>
              <h2 className="text-[13px] text-white tracking-wide uppercase font-medium border-b border-[#2a475e] pb-1.5 flex items-center gap-2 mb-2">
                <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                <BarChart2 size={15} className="text-[#66c0f4]" /> User Stats
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 md:gap-x-8 px-1">
                <div className="flex flex-col">
                  {statsLeft.map((s, i) => <StatRow key={i} {...s} />)}
                </div>
                <div className="flex flex-col">
                  {statsRight.map((s, i) => <StatRow key={i} {...s} />)}
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-6 border-b border-[#2a475e] -mb-2">
              <TabBtn tab="recent"   icon={Activity}  label="Recent"   />
              <TabBtn tab="progress" icon={BarChart2}  label="Progress" />
            </div>

            {/* ── Recent tab ── */}
            {activeTab === 'recent' && (
              <div className="flex flex-col gap-6">

                {/* Recently Played list (skip first — shown in card above) */}
                {recentlyPlayed.length > 1 && (
                  <div>
                    <SectionHeader accentColor="#66c0f4" icon={Clock} label="Recently Played" />
                    <div className="flex flex-col gap-[2px]">
                      {recentlyPlayed.slice(1).map(g => {
                        const total  = g.numPossibleAchievements || 0;
                        const earned = g.numAchieved || 0;
                        const pct    = total > 0 ? Math.round((earned / total) * 100) : 0;
                        return (
                          <a key={g.gameId} href={`../game/?id=${g.gameId}`}
                            className="flex items-center gap-3 px-2.5 py-2 bg-[#1b2838] hover:bg-[#202d39] rounded-[3px] border border-transparent hover:border-[#323f4c] transition-colors">
                            <img src={getMediaUrl(g.imageIcon)} alt={g.title}
                              className="w-9 h-9 rounded-[2px] border border-[#101214] object-cover shrink-0 bg-[#131a22]"
                              onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-0.5">
                                <span className="text-[12px] font-medium text-[#c6d4df] hover:text-[#66c0f4] transition-colors truncate">
                                  {parseTitle(g.title).baseTitle}
                                </span>
                                <span className="text-[9px] text-[#8f98a0] shrink-0">{g.consoleName}</span>
                              </div>
                              {total > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-[2px] bg-[#2a475e] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? '#e5b143' : '#66c0f4' }} />
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

                {/* Recent Achievements list (skip first — shown above) */}
                {recentAchievements.length > 1 && (
                  <div>
                    <SectionHeader accentColor="#e5b143" icon={Star} label="Recent Achievements" />
                    <div className="flex flex-col gap-[2px]">
                      {recentAchievements.slice(1).map((a, i) => {
                        const hc = a.HardcoreAchieved === 1 || a.HardcoreAchieved === '1';
                        return (
                          <a key={`${a.ID || i}`} href={`../achievement/?id=${a.ID}`}
                            className={`flex items-center gap-3 px-2.5 py-2 bg-[#1b2838] hover:bg-[#202d39] border-l-[3px] rounded-[3px] border border-transparent hover:border-[#323f4c] transition-colors ${hc ? 'border-l-[#e5b143]' : 'border-l-[#8f98a0]'}`}>
                            <img src={`${MEDIA_URL}/Badge/${a.BadgeName || '00001'}.png`} alt={a.Title}
                              className="w-9 h-9 rounded-[2px] border border-[#101214] object-cover shrink-0 bg-[#131a22]" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-medium text-[#e5b143] hover:text-[#f0c96a] transition-colors truncate">{a.Title}</div>
                              <div className="text-[9px] text-[#8f98a0] truncate">{a.GameTitle}</div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {hc && (
                                <span className="text-[8px] font-bold px-1 py-[1px] rounded-sm"
                                  style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)' }}>
                                  HC
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

                {recentlyPlayed.length <= 1 && recentAchievements.length <= 1 && (
                  <div className="text-center py-10 text-[#546270] text-[11px]">No more recent activity.</div>
                )}
              </div>
            )}

            {/* ── Progress tab ── */}
            {activeTab === 'progress' && (
              <div className="flex flex-col gap-4">

                {/* Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Search games…"
                    value={progressSearch}
                    onChange={e => setProgressSearch(e.target.value)}
                    className="flex-1 min-w-[140px] text-[11px] bg-[#1b2838] border border-[#2a475e] rounded-[2px] px-2.5 py-1.5 text-[#c6d4df] placeholder-[#546270] outline-none focus:border-[#66c0f4] transition-colors"
                  />
                  <button
                    onClick={() => setShowMastered(v => !v)}
                    className={`text-[10px] font-semibold uppercase tracking-[0.07em] px-2.5 py-1.5 rounded-[2px] border transition-colors whitespace-nowrap ${
                      showMastered
                        ? 'bg-[#1b2838] border-[#2a475e] text-[#8f98a0] hover:border-[#546270]'
                        : 'bg-[rgba(229,177,67,0.1)] border-[rgba(229,177,67,0.3)] text-[#e5b143]'
                    }`}
                  >
                    {showMastered ? 'Hide Mastered' : 'Show Mastered'}
                  </button>
                </div>

                {loadingCompletion ? (
                  <div className="flex flex-col gap-[2px]">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-2.5 py-2 bg-[#1b2838] rounded-[3px]">
                        <div className="shimmer w-10 h-10 rounded-[2px] shrink-0" />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="shimmer h-3 w-3/4 rounded" />
                          <div className="shimmer h-2 w-1/3 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : progressGames.length === 0 ? (
                  <div className="text-center py-16 text-[#546270] text-[11px]">
                    {completion === null ? '' : progressSearch ? 'No games match your search.' : 'No games in progress.'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-[2px]">
                    {progressGames.map(g => <ProgressGameRow key={g.gameId} game={g} />)}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ── Right sidebar ── */}
          <div className="flex flex-col gap-5">
            <GameAwardCard awards={gameAwards} />
          </div>

        </div>
      </main>

      <Footer label="cheevo-tracker · retroachievements.org" />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<UserApp />);
