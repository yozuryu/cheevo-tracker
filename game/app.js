import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Crown, Medal, Lock, ExternalLink, AlertCircle, AlertTriangle, Flame, Feather, Gamepad2, Tag, Code, Calendar, BookOpen, MessageSquare, Loader } from 'lucide-react';
import { MEDIA_URL, SITE_URL, TILDE_TAG_COLORS } from '../profile/utils/constants.js';
import { getMediaUrl, parseTitle, formatDate, formatTimeAgo } from '../profile/utils/helpers.js';
import { getCredentials, clearCredentials, getGameInfoAndUserProgress, getGameHashes, getGameProgression, getGameExtended, getActiveClaims, getGameRankAndScore, getComments, getGameLeaderboards, getUserGameLeaderboards, getLeaderboardEntries, getGame } from '../profile/utils/ra-api.js';
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

function AchievementRow({ ach, totalPlayersCasual, totalPlayersHardcore, extAch }) {
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
        : 'border-l-[#323f4c] bg-[#1b2838] opacity-60'
    }`}>

      {/* Badge */}
      <a href={`../achievement/?id=${ach.id}`}
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
          <a href={`../achievement/?id=${ach.id}`}
            className={`text-[12px] font-medium tracking-wide leading-tight transition-colors ${unlocked ? 'text-[#e5b143] hover:text-[#f0c96a]' : 'text-[#8f98a0] hover:text-[#c6d4df]'}`}>
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

        <p className="text-[10px] text-[#8f98a0] leading-snug mb-1">{ach.description}</p>
        {extAch?.author && (
          <p className="text-[9px] text-[#546270] mb-1">by {extAch.author}{extAch.dateCreated ? ` · added ${formatDate(extAch.dateCreated)}` : ''}</p>
        )}

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
  const [tab, setTab]           = useState(() => {
    const t = params.get('tab');
    return ['achievements', 'details', 'leaderboards', 'community', 'hashes'].includes(t) ? t : 'achievements';
  });
  const [filter, setFilter]     = useState('all');          // all | unlocked | locked
  const [sort, setSort]         = useState('order');        // order | points | date
  const [hashes, setHashes]     = useState(null);
  const [loadingHashes, setLoadingHashes] = useState(false);
  const [gameProgression, setGameProgression] = useState(null);
  const [gameExtended, setGameExtended]       = useState(null);
  const [activeClaims, setActiveClaims]         = useState([]);
  const [loadingInfoExtra, setLoadingInfoExtra] = useState(false);
  const [communityMasters, setCommunityMasters] = useState(null);
  const [communityComments, setCommunityComments] = useState(null);
  const [commentsTotal, setCommentsTotal]       = useState(0);
  const [commentsOffset, setCommentsOffset]     = useState(0);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [leaderboards, setLeaderboards]         = useState(null);
  const [topScorers, setTopScorers]             = useState(null);
  const [userLbMap, setUserLbMap]               = useState({});
  const [boardEntries, setBoardEntries]         = useState({});
  const [expandedBoardId, setExpandedBoardId]   = useState(null);
  const [loadingLeaderboards, setLoadingLeaderboards] = useState(false);
  const [loadingBoardId, setLoadingBoardId]     = useState(null);
  const [parentGame, setParentGame]             = useState(null);

  const creds = getCredentials();

  useEffect(() => {
    if (!creds) { handleAuthError(); return; }
    if (!gameId) { setError('No game ID provided.'); setLoading(false); return; }

    Promise.all([
      getGameInfoAndUserProgress(creds.username, creds.apiKey, { u: creds.username, g: gameId }),
      getGameExtended(creds.username, creds.apiKey, { i: gameId }),
      getActiveClaims(creds.username, creds.apiKey),
    ])
      .then(([data, ext, claims]) => {
        if (!data) { setError('Game not found.'); return; }
        setGame(data);
        setGameExtended(ext);
        setActiveClaims(claims.filter(c => String(c.gameId) === String(gameId)));
        document.title = `Cheevo Tracker · ${data.title}`;
        if (data.parentGameId) {
          getGame(creds.username, creds.apiKey, { i: data.parentGameId })
            .then(pg => setParentGame(pg))
            .catch(() => {});
        }
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

  useEffect(() => {
    if (tab !== 'community' || communityMasters !== null || loadingCommunity || !gameId || !creds) return;
    setLoadingCommunity(true);
    Promise.all([
      getGameRankAndScore(creds.username, creds.apiKey, { g: gameId, t: 1 }),
      getComments(creds.username, creds.apiKey, { i: gameId, t: 1, c: 25 }),
    ])
      .then(([masters, comments]) => {
        setCommunityMasters(masters);
        setCommunityComments(comments.results);
        setCommentsTotal(comments.total);
        setCommentsOffset(25);
      })
      .catch(err => { if (err.message === 'AUTH_ERROR') handleAuthError(); })
      .finally(() => setLoadingCommunity(false));
  }, [tab, gameId]);

  async function loadMoreComments() {
    if (!creds || loadingMoreComments) return;
    setLoadingMoreComments(true);
    try {
      const data = await getComments(creds.username, creds.apiKey, { i: gameId, t: 1, c: 25, o: commentsOffset });
      setCommunityComments(prev => [...prev, ...data.results]);
      setCommentsOffset(prev => prev + 25);
    } catch (err) {
      if (err.message === 'AUTH_ERROR') handleAuthError();
    } finally {
      setLoadingMoreComments(false);
    }
  }

  useEffect(() => {
    if (tab !== 'leaderboards' || leaderboards !== null || loadingLeaderboards || !gameId || !creds) return;
    setLoadingLeaderboards(true);
    Promise.all([
      getGameLeaderboards(creds.username, creds.apiKey, { i: gameId }),
      getUserGameLeaderboards(creds.username, creds.apiKey, { i: gameId, u: creds.username }).catch(() => ({ results: [] })),
      getGameRankAndScore(creds.username, creds.apiKey, { g: gameId, t: 0 }),
    ])
      .then(([lbs, userLbs, scorers]) => {
        setLeaderboards(lbs.results);
        setTopScorers(scorers);
        const map = {};
        for (const lb of userLbs.results) {
          if (lb.userEntry) map[lb.id] = lb.userEntry;
        }
        setUserLbMap(map);
      })
      .catch(err => { if (err.message === 'AUTH_ERROR') handleAuthError(); })
      .finally(() => setLoadingLeaderboards(false));
  }, [tab, gameId]);

  async function toggleBoard(boardId) {
    if (expandedBoardId === boardId) { setExpandedBoardId(null); return; }
    setExpandedBoardId(boardId);
    if (boardEntries[boardId] !== undefined) return;
    setLoadingBoardId(boardId);
    try {
      const data = await getLeaderboardEntries(creds.username, creds.apiKey, { i: boardId, c: 25 });
      setBoardEntries(prev => ({ ...prev, [boardId]: data.results }));
    } catch (err) {
      if (err.message === 'AUTH_ERROR') handleAuthError();
      else setBoardEntries(prev => ({ ...prev, [boardId]: [] }));
    } finally {
      setLoadingBoardId(null);
    }
  }

  useEffect(() => {
    if (tab !== 'details' || gameProgression !== null || loadingInfoExtra || !gameId || !creds) return;
    setLoadingInfoExtra(true);
    getGameProgression(creds.username, creds.apiKey, { i: gameId })
      .then(prog => setGameProgression(prog))
      .catch(err => { if (err.message === 'AUTH_ERROR') handleAuthError(); })
      .finally(() => setLoadingInfoExtra(false));
  }, [tab, gameId]);

  function switchTab(id) {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', id);
    history.replaceState(null, '', url.toString());
  }

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
    ...(game?.consoleId
      ? [{ label: game.consoleName, href: `../console/?id=${game.consoleId}` }]
      : [{ label: null }]),
    { label: loading ? null : (parsed?.baseTitle || game?.title || null) },
  ];

  return (
    <div className="min-h-screen bg-[#171a21] flex flex-col [overflow-x:clip]">
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
            {(() => {
              const isFallback = img => !img || img.includes('000002');
              const heroBg = (!isFallback(game.imageIngame) ? game.imageIngame : null)
                          || (!isFallback(game.imageTitle)  ? game.imageTitle  : null)
                          || parentGame?.imageIngame || parentGame?.imageTitle;
              return heroBg ? (
                <div className="absolute inset-0 bg-cover bg-center opacity-15"
                  style={{ backgroundImage: `url(${getMediaUrl(heroBg)})` }} />
              ) : null;
            })()}
            <div className="relative max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-4 md:pt-5">
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
                    {parsed?.tags?.map(tag => {
                      const tc = TILDE_TAG_COLORS[tag] || TILDE_TAG_COLORS['Prototype'];
                      return (
                        <span key={tag} className="shrink-0 mt-1" style={{
                          fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                          padding: '2px 6px', borderRadius: '2px',
                          border: `1px solid ${tc.border}`, background: tc.bg, color: tc.color,
                        }}>
                          {tag}
                        </span>
                      );
                    })}
                    {activeClaims.length > 0 && (
                      <span className="text-[8px] font-bold uppercase tracking-[0.07em] px-1.5 py-[2px] rounded-[2px] border shrink-0 mt-1"
                        style={{ color: '#e5b143', borderColor: 'rgba(229,177,67,0.3)', background: 'rgba(229,177,67,0.1)' }}>
                        In Dev
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

                  {parsed?.isSubset && parentGame && (
                    <div className="flex items-center gap-1.5 mb-2 bg-black/40 backdrop-blur-sm rounded-[3px] px-1.5 py-[3px] w-fit">
                      <img src={getMediaUrl(parentGame.imageIcon)} alt={parentGame.title}
                        className="w-4 h-4 rounded-[2px] border border-[#101214] object-cover shrink-0 bg-black" />
                      <span className="text-[10px] text-[#8f98a0]">Subset of</span>
                      <a href={`?id=${game.parentGameId}`}
                        className="text-[10px] text-[#c6d4df] hover:text-white transition-colors truncate max-w-[200px]">
                        {parseTitle(parentGame.title).baseTitle}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap text-[10px] mb-3">
                    <span className="flex items-center gap-1 text-[#66c0f4]"><Gamepad2 size={10} className="shrink-0" />{game.consoleName}</span>
                    {game.developer && <>
                      <span className="text-[#546270] select-none">·</span>
                      <span className="flex items-center gap-1 text-[#8f98a0]"><Code size={10} className="shrink-0 text-[#546270]" />{game.developer}</span>
                    </>}
                    <span className="text-[#546270] select-none">·</span>
                    <a href={`${SITE_URL}/game/${gameId}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#546270] hover:text-[#66c0f4] transition-colors"><ExternalLink size={10} className="shrink-0" />RA</a>
                  </div>

                  {/* Completion bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#101214] h-[5px] rounded-full overflow-hidden">
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

            {/* ── Stats strip ── */}
            <div className="relative border-t border-[#101214] bg-[#131a22]/50">
              <div className="max-w-4xl mx-auto px-2 md:px-8 py-2.5 grid grid-flow-col auto-cols-fr">
                {[
                  { label: 'Cheevos',  value: `${unlockedCount}`, sub: `/ ${achList.length}`,                         color: '#66c0f4' },
                  { label: 'Points',   value: earnedPoints.toLocaleString(), sub: `/ ${totalPoints.toLocaleString()}`, color: '#e5b143' },
                  { label: 'Hardcore', value: game.numAwardedToUserHardcore.toString(),                                color: '#e5b143' },
                  playtime ? { label: 'Playtime', value: playtime,                                                     color: '#8f98a0' }
                           : { label: 'Players',  value: game.numDistinctPlayersCasual.toLocaleString(),               color: '#546270' },
                  playtime ? { label: 'Players',  value: game.numDistinctPlayersCasual.toLocaleString(),               color: '#546270' } : null,
                ].filter(Boolean).map((s, i) => (
                  <div key={i} className="flex flex-col items-center py-1 px-2 min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[12px] md:text-[14px] font-bold" style={{ color: s.color }}>{s.value}</span>
                      {s.sub && <span className="text-[9px] md:text-[10px] text-[#546270]">{s.sub}</span>}
                    </div>
                    <span className="text-[8px] md:text-[9px] text-[#546270] uppercase tracking-[0.07em] whitespace-nowrap">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Claims banner ── */}
          {activeClaims.length > 0 && (
            <div className="border-b border-[#2a475e] bg-[rgba(229,177,67,0.06)]">
              <div className="max-w-4xl mx-auto px-4 md:px-8 py-2 flex items-center gap-2.5">
                <AlertTriangle size={13} className="shrink-0" style={{ color: '#e5b143' }} />
                <span className="text-[11px] text-[#8f98a0] leading-snug">
                  Achievement set actively claimed by{' '}
                  {activeClaims.map((c, i, arr) => (
                    <span key={c.user}>
                      <a href={`../user/?u=${c.user}`}
                        className="transition-colors hover:text-[#f0c96a]" style={{ color: '#e5b143' }}>{c.user}</a>
                      {i < arr.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {' '}— set may still be changing
                </span>
              </div>
            </div>
          )}

          {/* ── Tab bar ── */}
          <div className="bg-[#131a22] border-b border-[#2a475e] sticky top-0 md:top-[26px] z-40">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-2.5 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {[
                { id: 'achievements',  label: 'Achievements'  },
                { id: 'details',       label: 'Info'          },
                { id: 'leaderboards',  label: 'Leaderboards'  },
                { id: 'community',     label: 'Community'     },
                { id: 'hashes',        label: 'Hashes'        },
              ].map(t => (
                <button key={t.id} type="button" onClick={() => switchTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider border transition-colors shrink-0 ${
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
                  <div className="py-10 text-center text-[11px] text-[#546270]">
                    {achList.length === 0 ? 'This game has no achievements yet.' : 'No achievements match this filter.'}
                  </div>
                ) : (
                  filteredSorted.map(ach => (
                    <AchievementRow
                      key={ach.id}
                      ach={ach}
                      totalPlayersCasual={game.numDistinctPlayersCasual}
                      totalPlayersHardcore={game.numDistinctPlayersHardcore}
                      extAch={gameExtended?.achievements?.[ach.id]}
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
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#2a475e]">
                    <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                    <span className="text-[13px] text-white tracking-wide uppercase font-medium">Media</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { src: game.imageBoxArt  && !game.imageBoxArt.includes('000002')  ? game.imageBoxArt  : parentGame?.imageBoxArt,  label: 'Box Art'      },
                      { src: game.imageTitle   && !game.imageTitle.includes('000002')   ? game.imageTitle   : parentGame?.imageTitle,   label: 'Title Screen' },
                      { src: game.imageIngame  && !game.imageIngame.includes('000002')  ? game.imageIngame  : parentGame?.imageIngame,  label: 'In-Game'      },
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

              {/* Time to Beat */}
              {loadingInfoExtra && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#2a475e]">
                    <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
                    <span className="text-[13px] text-white tracking-wide uppercase font-medium">Time to Beat</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="shimmer h-14 rounded-[2px]" />
                    ))}
                  </div>
                </div>
              )}
              {gameProgression && [
                { label: 'Beat (Casual)', value: gameProgression.medianTimeToBeat },
                { label: 'Beat (HC)',     value: gameProgression.medianTimeToBeatHardcore },
                { label: 'Complete',      value: gameProgression.medianTimeToComplete },
                { label: 'Master',        value: gameProgression.medianTimeToMaster },
              ].some(c => c.value) && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#2a475e]">
                    <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
                    <span className="text-[13px] text-white tracking-wide uppercase font-medium">Time to Beat</span>
                    <span className="text-[9px] text-[#546270] ml-1">median</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: 'Beat (Casual)', value: gameProgression.medianTimeToBeat },
                      { label: 'Beat (HC)',     value: gameProgression.medianTimeToBeatHardcore },
                      { label: 'Complete',      value: gameProgression.medianTimeToComplete },
                      { label: 'Master',        value: gameProgression.medianTimeToMaster },
                    ].filter(c => c.value).map(c => (
                      <div key={c.label} className="bg-[#1b2838] border border-[#2a475e] rounded-[2px] flex flex-col items-center py-2.5 px-2">
                        <span className="text-[14px] font-bold text-[#e5b143]">{fmtPlaytime(c.value)}</span>
                        <span className="text-[8px] uppercase tracking-[0.07em] text-[#546270] mt-0.5">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="mb-5">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#2a475e]">
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
                    gameExtended?.updated
                      ? { label: 'Updated', value: formatDate(gameExtended.updated), icon: <Calendar size={11} /> }
                      : null,
                  ].filter(Boolean).filter(r => r.value).map(r => (
                    <div key={r.label} className="flex items-center gap-3 px-3 py-2">
                      <span className="text-[#546270] shrink-0">{r.icon}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#546270] w-20 shrink-0">{r.label}</span>
                      <span className="text-[11px] text-[#c6d4df] break-words min-w-0">{r.value}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Links */}
              {(game.guideUrl || game.forumTopicId) && (
                <div>
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#2a475e]">
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

          {/* ── Leaderboards tab ── */}
          {tab === 'leaderboards' && (
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-4">

              {loadingLeaderboards && (
                <div className="flex items-center gap-2 py-8 justify-center text-[#546270] text-[11px]">
                  <Loader size={14} className="animate-spin" /> Loading leaderboards…
                </div>
              )}

              {leaderboards && leaderboards.length === 0 && (
                <div className="py-8 text-center text-[11px] text-[#546270]">No leaderboards for this game.</div>
              )}

              {leaderboards && leaderboards.length > 0 && (
                <div className="flex flex-col md:flex-row gap-5 md:items-start">

                  {/* Top Scorers */}
                  {topScorers && topScorers.length > 0 && (
                    <div className="w-full md:w-[200px] md:shrink-0">
                      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#2a475e]">
                        <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
                        <span className="text-[13px] text-white tracking-wide uppercase font-medium">Top Scorers</span>
                      </div>
                      <div className="bg-[#1b2838] border border-[#2a475e] rounded-[2px] divide-y divide-[#2a475e] overflow-y-auto max-h-[220px]">
                        {topScorers.map((s, i) => (
                          <div key={s.ulid || s.user} className="flex items-center gap-3 px-3 py-2">
                            <span className="text-[10px] font-bold w-5 text-right shrink-0"
                              style={{ color: i === 0 ? '#e5b143' : i === 1 ? '#8f98a0' : i === 2 ? '#cd7f32' : '#546270' }}>
                              #{i + 1}
                            </span>
                            <img src={s.userPic ? getMediaUrl(s.userPic) : `${MEDIA_URL}/UserPic/${s.user}.png`} alt={s.user}
                              className="w-6 h-6 rounded-full border border-[#2a475e] bg-[#131a22] object-cover shrink-0" />
                            <a href={`../user/?u=${s.user}`}
                              className="flex-1 text-[11px] font-medium transition-colors hover:text-white truncate"
                              style={{ color: s.user === creds?.username ? '#57cbde' : '#c6d4df' }}>
                              {s.user}
                            </a>
                            <span className="text-[11px] font-bold text-[#e5b143] shrink-0">{s.totalScore.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Board list */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#2a475e]">
                      <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                      <span className="text-[13px] text-white tracking-wide uppercase font-medium">Boards</span>
                      <span className="text-[11px] text-[#546270]">({leaderboards.length})</span>
                    </div>
                  <div className="flex flex-col gap-1.5">
                    {leaderboards.map(lb => {
                      const fmtColor = lb.format === 'SCORE' ? '#e5b143' : ['TIME', 'TIMESECS', 'MILLISECS'].includes(lb.format) ? '#66c0f4' : '#8f98a0';
                      const userEntry = userLbMap[lb.id];
                      const isExpanded = expandedBoardId === lb.id;
                      const entries = boardEntries[lb.id];
                      const isLoadingThis = loadingBoardId === lb.id;

                      return (
                        <div key={lb.id} className="bg-[#1b2838] border border-[#2a475e] rounded-[2px] overflow-hidden">
                          {/* Collapsed header — clickable */}
                          <button type="button" onClick={() => toggleBoard(lb.id)}
                            className="w-full text-left px-3 py-2.5 hover:bg-[#202d39] transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-[12px] font-medium text-[#c6d4df] leading-snug">{lb.title}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-[2px] rounded-sm border"
                                  style={{ color: fmtColor, borderColor: `${fmtColor}40`, background: `${fmtColor}14` }}>
                                  {({ SCORE: 'Score', TIME: 'Time', TIMESECS: 'Time (s)', MILLISECS: 'Time (ms)', VALUE: 'Value' })[lb.format] ?? lb.format}
                                </span>
                                <span className="text-[#546270]" style={{ fontSize: 10 }}>{isExpanded ? '▲' : '▼'}</span>
                              </div>
                            </div>
                            {lb.description && (
                              <p className="text-[10px] text-[#546270] leading-snug mb-1.5">{lb.description}</p>
                            )}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              {userEntry ? (
                                <span className="text-[9px] px-1.5 py-[2px] rounded-sm border"
                                  style={{ color: '#57cbde', borderColor: 'rgba(87,203,222,0.3)', background: 'rgba(87,203,222,0.08)' }}>
                                  Your Entry: #{userEntry.rank} · {userEntry.formattedScore}
                                </span>
                              ) : <span />}
                              {lb.topEntry && (
                                <span className="text-[9px] text-[#546270]">
                                  👑 {lb.topEntry.user} · {lb.topEntry.formattedScore}
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Expanded entries */}
                          {isExpanded && (
                            <div className="border-t border-[#2a475e]">
                              {isLoadingThis && (
                                <div className="flex items-center gap-2 py-4 justify-center text-[#546270] text-[11px]">
                                  <Loader size={12} className="animate-spin" /> Loading…
                                </div>
                              )}
                              {entries && entries.length === 0 && (
                                <div className="py-4 text-center text-[11px] text-[#546270]">No entries yet.</div>
                              )}
                              {entries && entries.length > 0 && (
                                <div className="divide-y divide-[#2a475e]">
                                  {entries.map(e => {
                                    const isMe = e.user === creds?.username;
                                    return (
                                      <div key={e.ulid || e.user}
                                        className={`flex items-center gap-3 px-3 py-2 border-l-[3px] ${isMe ? 'bg-[#202d39]' : ''}`}
                                        style={{ borderLeftColor: isMe ? '#57cbde' : 'transparent' }}>
                                        <span className="text-[10px] font-bold w-5 text-right shrink-0 text-[#546270]">#{e.rank}</span>
                                        <img src={e.userPic ? getMediaUrl(e.userPic) : `${MEDIA_URL}/UserPic/${e.user}.png`} alt={e.user}
                                          className="w-6 h-6 rounded-full border border-[#2a475e] bg-[#131a22] object-cover shrink-0" />
                                        <a href={`../user/?u=${e.user}`}
                                          className="flex-1 text-[11px] transition-colors hover:text-white"
                                          style={{ color: isMe ? '#57cbde' : '#c6d4df' }}>
                                          {e.user}
                                        </a>
                                        <span className="text-[11px] font-bold text-[#e5b143]">{e.formattedScore}</span>
                                        <span className="text-[9px] text-[#546270] shrink-0">{formatDate(e.dateSubmitted)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Community tab ── */}
          {tab === 'community' && (
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-4">

              {/* Loading skeleton */}
              {loadingCommunity && (
                <div className="flex flex-col gap-4">
                  <div className="shimmer h-5 w-32 rounded mb-1" />
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="shimmer w-7 h-7 rounded-full shrink-0" />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="shimmer h-2.5 w-24 rounded" />
                        <div className="shimmer h-2 w-40 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingCommunity && communityMasters !== null && (
                <div className="flex flex-col md:flex-row gap-5 md:items-start">

                  {/* Recent Masters — fixed width, scrollable */}
                  {communityMasters.length > 0 && (
                    <div className="w-full md:w-[200px] md:shrink-0">
                      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#2a475e]">
                        <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
                        <span className="text-[13px] text-white tracking-wide uppercase font-medium">Recent Masters</span>
                      </div>
                      <div className="flex flex-col divide-y divide-[#1b2838] overflow-y-auto max-h-[220px]">
                        {communityMasters.map(m => (
                          <div key={m.ulid || m.user} className="flex items-center gap-2 py-2">
                            <a href={`../user/?u=${m.user}`} className="shrink-0">
                              <img
                                src={m.userPic ? getMediaUrl(m.userPic) : `${MEDIA_URL}/UserPic/${m.user}.png`}
                                alt={m.user}
                                className="w-6 h-6 rounded-full border border-[#2a475e] bg-[#131a22] object-cover"
                              />
                            </a>
                            <div className="flex-1 min-w-0">
                              <a href={`../user/?u=${m.user}`}
                                className="block text-[11px] font-medium text-[#e5b143] hover:text-[#f0c96a] transition-colors truncate">{m.user}</a>
                              <span className="text-[9px] text-[#546270]">{formatTimeAgo(m.lastAward)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#2a475e]">
                      <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
                      <span className="text-[13px] text-white tracking-wide uppercase font-medium">Comments</span>
                      {commentsTotal > 0 && <span className="text-[11px] text-[#546270]">({commentsTotal})</span>}
                    </div>

                    {communityComments.length === 0 && (
                      <div className="py-8 text-center text-[11px] text-[#546270]">No comments yet.</div>
                    )}

                    {communityComments.length > 0 && (
                      <div className="flex flex-col">
                        {communityComments.map((c, i) => (
                          <div key={`${c.ulid || c.user}-${i}`} className="flex gap-3 py-2.5 border-b border-[#1b2838]">
                            <a href={`../user/?u=${c.user}`} className="shrink-0 mt-0.5">
                              <img
                                src={c.userPic ? getMediaUrl(c.userPic) : `${MEDIA_URL}/UserPic/${c.user}.png`}
                                alt={c.user}
                                className="w-7 h-7 rounded-full border border-[#2a475e] bg-[#131a22] object-cover"
                              />
                            </a>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-1">
                                <a href={`../user/?u=${c.user}`}
                                  className="text-[11px] font-medium text-[#e5b143] hover:text-[#f0c96a] transition-colors shrink-0">{c.user}</a>
                                <span className="text-[9px] text-[#546270]">{formatTimeAgo(c.submitted)}</span>
                              </div>
                              <p className="text-[11px] text-[#c6d4df] leading-snug break-words">{c.commentText}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Load more */}
                    {communityComments.length < commentsTotal && (
                      <div className="mt-4 flex justify-center">
                        <button type="button" onClick={loadMoreComments} disabled={loadingMoreComments}
                          className="flex items-center gap-2 text-[11px] text-[#66c0f4] border border-[#66c0f4]/40 bg-[#66c0f4]/10 hover:bg-[#66c0f4]/20 px-4 py-1.5 rounded-full transition-colors disabled:opacity-50">
                          {loadingMoreComments
                            ? <><Loader size={12} className="animate-spin" /> Loading…</>
                            : <>Load more ({commentsTotal - communityComments.length} remaining)</>
                          }
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ── Hashes tab ── */}
          {tab === 'hashes' && (
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-4">
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#2a475e]">
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
                        <code className="text-[9px] text-[#546270] font-mono tracking-wider break-all">{h.md5}</code>
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
