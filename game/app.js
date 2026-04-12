import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Crown, Medal, Lock, ExternalLink, AlertCircle, AlertTriangle, Flame, Feather, Gamepad2, Tag, Code, Calendar, BookOpen, MessageSquare, Loader } from 'lucide-react';
import { MEDIA_URL, SITE_URL } from '../profile/utils/constants.js';
import { getMediaUrl, parseTitle, formatDate } from '../profile/utils/helpers.js';
import { getCredentials, clearCredentials, getGameInfoAndUserProgress, getGameHashes } from '../profile/utils/ra-api.js';
import { Topbar, Footer } from '../assets/ui.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  progression:   { label: 'Progression',  Icon: Trophy,        color: '#e5b143', tip: 'Required to complete the game' },
  win_condition: { label: 'Win Condition', Icon: Crown,         color: '#ff6b6b', tip: 'Triggers game completion'      },
  missable:      { label: 'Missable',      Icon: AlertTriangle, color: '#ff9800', tip: 'Can be permanently missed'     },
};

const AWARD_CONFIG = {
  'mastered':        { label: 'Mastered',    color: '#e5b143', Icon: Trophy },
  'completed':       { label: 'Completed',   color: '#e5b143', Icon: Trophy },
  'beaten-hardcore': { label: 'Beaten',      color: '#c6d4df', Icon: Medal  },
  'beaten-softcore': { label: 'Beaten (SC)', color: '#8f98a0', Icon: Medal  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function handleAuthError() {
  clearCredentials();
  window.location.replace('../');
}

function fmtPlaytime(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Achievement row ───────────────────────────────────────────────────────────

function AchievementRow({ ach, totalPlayersCasual, totalPlayersHardcore }) {
  const unlocked    = !!ach.dateEarned;
  const hardcore    = !!ach.dateEarnedHardcore;
  const typeConf    = ach.type ? TYPE_CONFIG[ach.type] : null;
  const ratio       = ach.trueRatio && ach.points ? ach.trueRatio / ach.points : null;
  const casualPct   = totalPlayersCasual   > 1 ? Math.min(100, (ach.numAwarded         / totalPlayersCasual)   * 100).toFixed(1) : null;
  const hardcorePct = totalPlayersHardcore > 1 ? Math.min(100, (ach.numAwardedHardcore / totalPlayersHardcore) * 100).toFixed(1) : null;

  return (
    <div className={`flex items-center gap-3 p-2 rounded-[2px] border border-transparent border-l-[3px] transition-colors ${
      unlocked
        ? hardcore
          ? 'border-l-[#e5b143] bg-[#202d39] hover:bg-[#253444]'
          : 'border-l-[#8f98a0] bg-[#202d39] hover:bg-[#253444]'
        : 'border-l-[#323f4c] bg-[#171a21] opacity-75'
    }`}>

      {/* Badge */}
      <a href={`${SITE_URL}/achievement/${ach.id}`} target="_blank" rel="noreferrer"
        className="relative shrink-0 w-10 h-10 rounded-[2px] border border-[#101214] overflow-hidden bg-black hover:scale-105 transition-transform block">
        <img
          src={`${MEDIA_URL}/Badge/${ach.badgeName || '00001'}.png`}
          alt={ach.title}
          className={`w-full h-full object-cover ${!unlocked ? 'grayscale brightness-40' : ''}`}
        />
        {!unlocked && <Lock size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50" />}
      </a>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <a href={`${SITE_URL}/achievement/${ach.id}`} target="_blank" rel="noreferrer"
            className={`text-[12px] font-medium tracking-wide leading-tight hover:underline ${unlocked ? 'text-[#e5b143]' : 'text-[#8f98a0]'}`}>
            {ach.title}
          </a>
          <span className="text-[9px] font-bold text-[#66c0f4] bg-[#101214] border border-[#323f4c] px-1.5 py-[1px] rounded-sm shrink-0">{ach.points} pts</span>
          {ratio > 1 && (
            <span className="text-[9px] shrink-0"
              style={{ color: ratio >= 30 ? '#ff6b6b' : ratio >= 20 ? '#e5b143' : ratio >= 10 ? '#66c0f4' : '#8f98a0' }}>
              ×{ratio.toFixed(1)}
            </span>
          )}
          {typeConf && (
            <span className="pop-wrap shrink-0">
              <typeConf.Icon size={11} style={{ color: typeConf.color }} strokeWidth={2} />
              <span className="pop-box">
                <div className="pop-name" style={{ color: typeConf.color }}>{typeConf.label}</div>
                <div className="pop-sub">{typeConf.tip}</div>
              </span>
            </span>
          )}
        </div>

        <p className="text-[10px] text-[#8f98a0] leading-snug mb-1.5">{ach.description}</p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="relative h-1.5 bg-[#101214] rounded-full overflow-hidden w-full max-w-[180px]">
              {casualPct !== null && <div className="absolute top-0 left-0 h-full bg-[#546270]" style={{ width: `${casualPct}%` }} />}
              {hardcorePct !== null && <div className="absolute top-0 left-0 h-full bg-[#ff6b6b]" style={{ width: `${hardcorePct}%` }} />}
            </div>
            <div className="flex gap-3 text-[8px] font-medium w-full max-w-[180px]">
              {hardcorePct !== null && <span className="flex items-center gap-0.5 text-[#ff6b6b]"><Flame size={8} />{hardcorePct}%</span>}
              {casualPct   !== null && <span className="flex items-center gap-0.5 text-[#546270]"><Feather size={8} />{casualPct}%</span>}
            </div>
          </div>
          {unlocked && (
            <p className="text-[9px] text-[#66c0f4] shrink-0">Unlocked: {formatDate(ach.dateEarned)}</p>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────

function GameApp() {
  const params  = new URLSearchParams(window.location.search);
  const gameId  = params.get('id');

  const [game, setGame]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [tab, setTab]           = useState('achievements'); // achievements | details | hashes
  const [filter, setFilter]     = useState('all');          // all | unlocked | locked
  const [sort, setSort]         = useState('order');        // order | points | date
  const [hashes, setHashes]     = useState(null);
  const [loadingHashes, setLoadingHashes] = useState(false);

  const creds = getCredentials();

  useEffect(() => {
    if (!creds) { handleAuthError(); return; }
    if (!gameId) { setError('No game ID provided.'); setLoading(false); return; }

    getGameInfoAndUserProgress(creds.username, creds.apiKey, { u: creds.username, g: gameId })
      .then(data => {
        if (!data) { setError('Game not found.'); return; }
        setGame(data);
        document.title = `Cheevo Tracker · ${data.title}`;
      })
      .catch(err => {
        if (err.message === 'AUTH_ERROR') handleAuthError();
        else setError('Failed to load game data.');
      })
      .finally(() => setLoading(false));
  }, [gameId]);

  useEffect(() => {
    if (tab !== 'hashes' || hashes !== null || loadingHashes || !gameId || !creds) return;
    setLoadingHashes(true);
    getGameHashes(creds.username, creds.apiKey, { i: gameId })
      .then(data => setHashes(data))
      .catch(err => { if (err.message === 'AUTH_ERROR') handleAuthError(); else setHashes([]); })
      .finally(() => setLoadingHashes(false));
  }, [tab, gameId]);

  const parsed   = useMemo(() => game ? parseTitle(game.title) : null, [game]);
  const achList  = useMemo(() => game ? Object.values(game.achievements) : [], [game]);

  const filteredSorted = useMemo(() => {
    let list = achList;
    if (filter === 'unlocked') list = list.filter(a => !!a.dateEarned);
    if (filter === 'locked')   list = list.filter(a => !a.dateEarned);
    return [...list].sort((a, b) => {
      if (sort === 'points') return b.points - a.points;
      if (sort === 'date') {
        if (a.dateEarned && b.dateEarned) return new Date(b.dateEarned) - new Date(a.dateEarned);
        if (a.dateEarned) return -1;
        if (b.dateEarned) return 1;
        return a.displayOrder - b.displayOrder;
      }
      return a.displayOrder - b.displayOrder;
    });
  }, [achList, filter, sort]);

  const unlockedCount   = useMemo(() => achList.filter(a => !!a.dateEarned).length, [achList]);
  const totalPoints     = useMemo(() => achList.reduce((s, a) => s + a.points, 0), [achList]);
  const earnedPoints    = useMemo(() => achList.filter(a => !!a.dateEarned).reduce((s, a) => s + a.points, 0), [achList]);
  const completionPct   = achList.length > 0 ? (unlockedCount / achList.length) * 100 : 0;
  const award           = game?.highestAwardKind ? AWARD_CONFIG[game.highestAwardKind] : null;
  const playtime        = game ? fmtPlaytime(game.userTotalPlaytime) : null;

  const crumbs = [
    { label: 'Cheevo Tracker', href: '../profile/' },
    { label: 'Game' },
    { label: loading ? 'Game Title' : (parsed?.baseTitle || game?.title || 'Game Title') },
  ];

  return (
    <div className="min-h-screen bg-[#171a21] flex flex-col">
      <Topbar crumbs={crumbs} />

      {loading && (
        <div className="flex-1 px-4 md:px-8 pt-6 max-w-4xl mx-auto w-full">
          <div className="shimmer h-40 rounded-[3px] mb-4" />
          <div className="flex gap-3 mb-4">
            {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-14 flex-1 rounded-[3px]" />)}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-[#1b2838]">
              <div className="shimmer w-12 h-12 rounded-[3px] shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="shimmer h-3 w-40 rounded" />
                <div className="shimmer h-2.5 w-64 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[#ff6b6b] text-[12px]">
            <AlertCircle size={16} /> {error}
          </div>
        </div>
      )}

      {game && !loading && (
        <>
          {/* ── Hero ── */}
          <div className="relative overflow-hidden bg-[#1b2838] border-b border-[#2a475e]">
            {/* Background */}
            {(game.imageIngame || game.imageTitle) && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url(${getMediaUrl(game.imageIngame || game.imageTitle)})` }}
              />
            )}
            <div className="relative max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-5 md:pt-5">
              <div className="flex gap-4 items-start">

                {/* Icon */}
                <img
                  src={getMediaUrl(game.imageIcon)}
                  alt={game.title}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-[3px] border border-[#101214] shrink-0 object-cover bg-[#131a22]"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <h1 className="text-[18px] md:text-[22px] font-semibold text-white leading-tight">
                      {parsed?.baseTitle || game.title}
                    </h1>
                    {parsed?.isSubset && (
                      <span className="text-[8px] font-bold uppercase tracking-[0.07em] px-1.5 py-[2px] rounded-[2px] border border-[rgba(229,177,67,0.3)] bg-[rgba(229,177,67,0.1)] text-[#c8a84b] shrink-0 mt-1">
                        Subset
                      </span>
                    )}
                    {award && (
                      <span
                        className="text-[8px] font-bold uppercase tracking-[0.07em] px-1.5 py-[2px] rounded-[2px] flex items-center gap-1 shrink-0 mt-1"
                        style={{ color: award.color, background: `${award.color}18`, border: `1px solid ${award.color}44` }}
                      >
                        <award.Icon size={9} /> {award.label}
                      </span>
                    )}
                  </div>

                  {parsed?.isSubset && parsed?.subsetName && (
                    <div className="text-[11px] text-[#c8a84b] mb-1">{parsed.subsetName}</div>
                  )}

                  <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[10px] mb-3">
                    <span className="flex items-center gap-1 text-[#66c0f4]"><Gamepad2 size={10} className="shrink-0" />{game.consoleName}</span>
                    {game.developer && <span className="flex items-center gap-1 text-[#8f98a0]"><Code size={10} className="shrink-0 text-[#546270]" />{game.developer}</span>}
                    <a href={`${SITE_URL}/game/${gameId}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#546270] hover:text-[#66c0f4] transition-colors"><ExternalLink size={10} className="shrink-0" />RA</a>
                  </div>

                  {/* Completion bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-xs bg-[#101214] h-[5px] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${completionPct}%`,
                          background: completionPct === 100 ? '#e5b143' : '#66c0f4',
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: completionPct === 100 ? '#e5b143' : '#66c0f4' }}>
                      {completionPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className="bg-[#131a22] border-b border-[#2a475e]">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-2 grid grid-flow-col auto-cols-fr md:flex md:gap-8">
              {[
                { label: 'Cheevos',  value: `${unlockedCount}`, sub: `/ ${achList.length}`,                         color: '#66c0f4' },
                { label: 'Points',   value: earnedPoints.toLocaleString(), sub: `/ ${totalPoints.toLocaleString()}`, color: '#e5b143' },
                { label: 'Hardcore', value: game.numAwardedToUserHardcore.toString(),                                color: '#e5b143' },
                playtime ? { label: 'Playtime', value: playtime,                                                     color: '#8f98a0' }
                         : { label: 'Players',  value: game.numDistinctPlayersCasual.toLocaleString(),               color: '#546270' },
                playtime ? { label: 'Players',  value: game.numDistinctPlayersCasual.toLocaleString(),               color: '#546270' } : null,
              ].filter(Boolean).map((s, i) => (
                <div key={i} className="flex flex-col items-center shrink-0 py-1 min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] md:text-[13px] font-bold" style={{ color: s.color }}>{s.value}</span>
                    {s.sub && <span className="text-[8px] md:text-[10px] text-[#546270]">{s.sub}</span>}
                  </div>
                  <span className="text-[8px] md:text-[9px] text-[#546270] uppercase tracking-[0.07em] whitespace-nowrap">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="bg-[#131a22] border-b border-[#2a475e] sticky top-0 md:top-[26px] z-40">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-2.5 flex items-center gap-2">
              {[
                { id: 'achievements', label: 'Achievements' },
                { id: 'details',      label: 'Details'      },
                { id: 'hashes',       label: 'Hashes'       },
              ].map(t => (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider border transition-colors ${
                    tab === t.id
                      ? 'bg-[#1b2838] text-[#c6d4df] border-[#66c0f4]'
                      : 'text-[#546270] border-[#323f4c] hover:text-[#8f98a0] hover:border-[#546270]'
                  }`}>
                  {t.label}
                  {t.id === 'achievements' && <span className={`text-[9px] font-normal ${tab === t.id ? 'text-[#546270]' : 'text-[#323f4c]'}`}>{achList.length}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* ── Achievements tab ── */}
          {tab === 'achievements' && (
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-4">
              {/* Controls */}
              <div className="flex flex-col mb-3 gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] uppercase tracking-wider text-[#546270] w-[44px] shrink-0">Status</span>
                  {[
                    { value: 'all',      label: 'All'      },
                    { value: 'unlocked', label: `Unlocked (${unlockedCount})` },
                    { value: 'locked',   label: `Locked (${achList.length - unlockedCount})` },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setFilter(opt.value)}
                      className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-[3px] rounded-sm border transition-colors ${
                        filter === opt.value
                          ? 'bg-[#66c0f4] text-[#101214] border-[#66c0f4]'
                          : 'bg-[#101214] text-[#8f98a0] border-[#323f4c] hover:text-[#c6d4df] hover:border-[#546270]'
                      }`}>{opt.label}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] uppercase tracking-wider text-[#546270] w-[44px] shrink-0">Sort</span>
                  {[
                    { value: 'order',  label: 'Default'  },
                    { value: 'points', label: 'Points'   },
                    { value: 'date',   label: 'Unlocked' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setSort(opt.value)}
                      className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-[3px] rounded-sm border transition-colors ${
                        sort === opt.value
                          ? 'bg-[#1b2838] text-[#c6d4df] border-[#2a475e]'
                          : 'bg-[#101214] text-[#546270] border-[#323f4c] hover:text-[#c6d4df] hover:border-[#546270]'
                      }`}>{opt.label}</button>
                  ))}
                  <span className="ml-auto text-[9px] text-[#546270]">{filteredSorted.length} / {achList.length}</span>
                </div>
              </div>
              {/* List */}
              <div className="flex flex-col gap-1.5">
                {filteredSorted.length === 0 ? (
                  <div className="py-10 text-center text-[11px] text-[#546270]">No achievements match this filter.</div>
                ) : (
                  filteredSorted.map(ach => (
                    <AchievementRow
                      key={ach.id}
                      ach={ach}
                      totalPlayersCasual={game.numDistinctPlayersCasual}
                      totalPlayersHardcore={game.numDistinctPlayersHardcore}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Details tab ── */}
          {tab === 'details' && (
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-4">

              {/* Media gallery */}
              {(game.imageBoxArt || game.imageTitle || game.imageIngame) && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                    <span className="text-[13px] text-white tracking-wide uppercase font-medium">Media</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { src: game.imageBoxArt,  label: 'Box Art'      },
                      { src: game.imageTitle,   label: 'Title Screen' },
                      { src: game.imageIngame,  label: 'In-Game'      },
                    ].filter(m => m.src).map(m => (
                      <div key={m.label} className="flex flex-col gap-1">
                        <a href={getMediaUrl(m.src)} target="_blank" rel="noreferrer"
                          className="block rounded-[2px] border border-[#2a475e] overflow-hidden hover:border-[#546270] transition-colors bg-[#131a22]">
                          <img src={getMediaUrl(m.src)} alt={m.label} className="w-full object-cover" />
                        </a>
                        <span className="text-[9px] text-[#546270] uppercase tracking-wider text-center">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                  <span className="text-[13px] text-white tracking-wide uppercase font-medium">Info</span>
                </div>
                <div className="bg-[#1b2838] border border-[#2a475e] rounded-[2px] divide-y divide-[#2a475e]">
                  {[
                    { label: 'Console',    value: game.consoleName,   icon: <Gamepad2 size={11} /> },
                    { label: 'Developer',  value: game.developer,     icon: <Code     size={11} /> },
                    { label: 'Publisher',  value: game.publisher,     icon: <BookOpen size={11} /> },
                    { label: 'Genre',      value: game.genre,         icon: <Tag      size={11} /> },
                    { label: 'Released',   value: game.released,      icon: <Calendar size={11} /> },
                  ].filter(r => r.value).map(r => (
                    <div key={r.label} className="flex items-center gap-3 px-3 py-2">
                      <span className="text-[#546270] shrink-0">{r.icon}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#546270] w-20 shrink-0">{r.label}</span>
                      <span className="text-[11px] text-[#c6d4df]">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              {(game.guideUrl || game.forumTopicId) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                    <span className="text-[13px] text-white tracking-wide uppercase font-medium">Links</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {game.guideUrl && (
                      <a href={game.guideUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-[#8f98a0] hover:text-[#66c0f4] border border-[#2a475e] hover:border-[#66c0f4] bg-[#131a22] px-3 py-1.5 rounded-[2px] transition-colors">
                        <BookOpen size={12} /> Game Guide
                      </a>
                    )}
                    {game.forumTopicId && (
                      <a href={`${SITE_URL}/viewtopic.php?t=${game.forumTopicId}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-[#8f98a0] hover:text-[#66c0f4] border border-[#2a475e] hover:border-[#66c0f4] bg-[#131a22] px-3 py-1.5 rounded-[2px] transition-colors">
                        <MessageSquare size={12} /> Forum Thread
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Hashes tab ── */}
          {tab === 'hashes' && (
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                <span className="text-[13px] text-white tracking-wide uppercase font-medium">Supported ROMs</span>
                {hashes && <span className="text-[11px] text-[#546270]">({hashes.length})</span>}
              </div>
              {loadingHashes && (
                <div className="flex items-center gap-2 py-8 justify-center text-[#546270] text-[11px]">
                  <Loader size={14} className="animate-spin" /> Loading hashes…
                </div>
              )}
              {hashes && hashes.length === 0 && (
                <div className="py-8 text-center text-[11px] text-[#546270]">No hashes found for this game.</div>
              )}
              {hashes && hashes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {hashes.map((h, i) => (
                    <div key={i} className="bg-[#1b2838] border border-[#2a475e] rounded-[2px] px-3 py-2.5 flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <span className="text-[11px] text-[#c6d4df] leading-snug break-all">{h.name || '—'}</span>
                        {h.patchUrl && (
                          <a href={h.patchUrl} target="_blank" rel="noreferrer"
                            className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-[#66c0f4] border border-[#66c0f4]/40 bg-[#66c0f4]/10 px-2 py-[2px] rounded-sm hover:bg-[#66c0f4]/20 transition-colors flex items-center gap-1">
                            <ExternalLink size={9} /> Patch
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-[9px] text-[#546270] font-mono tracking-wider">{h.md5}</code>
                        {h.labels.map(l => {
                          const lc = l.toLowerCase();
                          const color = lc === 'nointro' ? '#66c0f4' : lc === 'rapatches' ? '#e5b143' : lc === 'unverified' ? '#ff6b6b' : '#8f98a0';
                          return (
                            <span key={l} className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded-sm border"
                              style={{ color, borderColor: `${color}40`, background: `${color}14` }}>{l}</span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        .pop-wrap { position: relative; display: inline-flex; align-items: center; cursor: help; }
        .pop-wrap .pop-box {
          display: none; position: absolute;
          bottom: calc(100% + 7px); left: 50%; transform: translateX(-50%);
          background: #131a22; border: 1px solid #2a475e; border-radius: 2px;
          padding: 6px 8px; white-space: nowrap; z-index: 200;
          box-shadow: 0 4px 16px rgba(0,0,0,0.7); pointer-events: none;
          min-width: 110px;
        }
        .pop-wrap .pop-box::after {
          content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
          border: 4px solid transparent; border-top-color: #2a475e;
        }
        .pop-wrap:hover .pop-box { display: block; }
        .pop-name { font-size: 10px; color: #c6d4df; font-weight: 600; margin-bottom: 2px; }
        .pop-sub  { font-size: 9px; color: #546270; margin-bottom: 2px; }
      `}</style>

      <Footer
        label={game ? `${parsed?.baseTitle || game.title} · ${game.consoleName}` : 'Cheevo Tracker · Game'}
        right={game
          ? React.createElement('a', {
              href: `${SITE_URL}/game/${gameId}`,
              target: '_blank',
              rel: 'noreferrer',
              className: 'text-[10px] text-[#546270] hover:text-[#66c0f4] transition-colors flex items-center gap-1',
            }, 'retroachievements.org ↗')
          : null
        }
      />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<GameApp />);
