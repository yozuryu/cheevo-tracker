import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Crown, AlertTriangle, Lock, Flame, Feather } from 'lucide-react';
import { MEDIA_URL, SITE_URL } from '../profile/utils/constants.js';
import { parseTitle, formatDate, formatTimeAgo } from '../profile/utils/helpers.js';
import { getCredentials, clearCredentials, getAchievementUnlocks, getGameInfoAndUserProgress } from '../profile/utils/ra-api.js';
import { Topbar, Footer } from '../assets/ui.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  progression:   { label: 'Progression',  Icon: Trophy,        color: '#e5b143' },
  win_condition: { label: 'Win Condition', Icon: Crown,         color: '#ff6b6b' },
  missable:      { label: 'Missable',      Icon: AlertTriangle, color: '#ff9800' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function handleAuthError() {
  clearCredentials();
  window.location.replace('../');
}

// ── Main app ──────────────────────────────────────────────────────────────────

function AchievementApp() {
  const params = new URLSearchParams(window.location.search);
  const achId  = params.get('id');

  const [achData, setAchData]         = useState(null);
  const [userGame, setUserGame]       = useState(null);   // null = loading, false = unavailable
  const [unlocks, setUnlocks]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);

  const creds = getCredentials();

  useEffect(() => {
    if (!creds) { handleAuthError(); return; }
    if (!achId) { setError('No achievement ID provided.'); setLoading(false); return; }

    (async () => {
      try {
        const data = await getAchievementUnlocks(creds.username, creds.apiKey, { a: achId, c: 50 });
        setAchData(data);
        setUnlocks(data.unlocks);
        document.title = `Cheevo Tracker · ${data.achievement?.title || 'Achievement'}`;

        if (data.game?.id) {
          const gameData = await getGameInfoAndUserProgress(
            creds.username, creds.apiKey,
            { u: creds.username, g: data.game.id }
          ).catch(() => null);
          setUserGame(gameData || false);
        } else {
          setUserGame(false);
        }
      } catch (e) {
        if (e.message === 'AUTH_ERROR') handleAuthError();
        else setError('Failed to load achievement.');
      } finally {
        setLoading(false);
      }
    })();
  }, [achId]);

  async function loadMoreUnlocks() {
    if (!creds || !achId || loadingMore) return;
    setLoadingMore(true);
    try {
      const more = await getAchievementUnlocks(creds.username, creds.apiKey,
        { a: achId, c: 50, o: unlocks.length });
      setUnlocks(prev => [...prev, ...more.unlocks]);
    } catch {}
    setLoadingMore(false);
  }

  // Derive this achievement's user data from the game progress response
  const userAch = userGame
    ? (userGame.achievements[String(achId)] ||
       Object.values(userGame.achievements).find(a => String(a.id) === String(achId)) ||
       null)
    : null;

  const ach      = achData?.achievement;
  const typeConf = ach?.type ? TYPE_CONFIG[ach.type] : null;
  const ratio    = ach?.trueRatio && ach?.points ? ach.trueRatio / ach.points : null;
  const hcPct    = achData?.totalPlayers > 0
    ? Math.min(100, (achData.unlocksHardcoreCount / achData.totalPlayers) * 100).toFixed(1)
    : null;
  const anyPct   = achData?.totalPlayers > 0
    ? Math.min(100, (achData.unlocksCount / achData.totalPlayers) * 100).toFixed(1)
    : null;
  const hasMore  = achData && unlocks.length < achData.unlocksCount;
  const gameName = achData?.game?.title ? parseTitle(achData.game.title).baseTitle : null;

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171a21] flex flex-col">
        <Topbar crumbs={[{ label: 'Cheevo Tracker', href: '../profile/' }, { label: 'Game' }, { label: 'Achievement' }]} />
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-8 pt-8 pb-5">
          <div className="flex gap-4 mb-6">
            <div className="shimmer w-24 h-24 rounded-[3px] shrink-0" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="shimmer h-5 w-3/4 rounded" />
              <div className="shimmer h-3 w-full rounded" />
              <div className="shimmer h-3 w-2/3 rounded" />
              <div className="shimmer h-3 w-1/3 rounded mt-1" />
            </div>
          </div>
          <div className="shimmer h-12 rounded mb-4" />
          <div className="shimmer h-14 rounded mb-4" />
          <div className="shimmer h-4 w-40 rounded mb-3" />
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="shimmer h-9 rounded mb-1" />
          ))}
        </div>
        <Footer label="cheevo-tracker · retroachievements.org" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-[#171a21] flex flex-col">
        <Topbar crumbs={[{ label: 'Cheevo Tracker', href: '../profile/' }, { label: 'Game' }, { label: 'Achievement' }]} />
        <div className="flex-1 flex items-center justify-center text-[#8f98a0] text-sm">{error}</div>
        <Footer label="cheevo-tracker · retroachievements.org" />
      </div>
    );
  }

  // ── Page ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#171a21] flex flex-col">
      <Topbar crumbs={[
        { label: 'Cheevo Tracker', href: '../profile/' },
        { label: 'Game' },
        ...(gameName && achData?.game?.id
          ? [{ label: gameName, href: `../game/?id=${achData.game.id}` }]
          : []),
        { label: ach?.title || 'Achievement' },
      ]} />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-8 pt-8 pb-10">

        {/* Hero ──────────────────────────────────────────────────────────────── */}
        <div className="flex gap-4 mb-5">

          {/* Badge */}
          <div className="relative shrink-0 w-24 h-24 rounded-[3px] border border-[#101214] overflow-hidden bg-black">
            <img
              src={`${MEDIA_URL}/Badge/${userAch?.badgeName || ach?.badgeName || '00001'}.png`}
              alt={ach?.title}
              className={`w-full h-full object-cover ${!userAch?.dateEarned ? 'grayscale brightness-40' : ''}`}
            />
            {!userAch?.dateEarned && (
              <Lock size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <h1 className={`text-[17px] font-semibold leading-tight ${userAch?.dateEarned ? 'text-[#e5b143]' : 'text-[#c6d4df]'}`}>
                {ach?.title}
              </h1>
              {typeConf && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.07em] px-1.5 py-[2px] rounded-[2px] shrink-0 mt-[3px]"
                  style={{ color: typeConf.color, background: `${typeConf.color}18`, border: `1px solid ${typeConf.color}44` }}>
                  <typeConf.Icon size={9} /> {typeConf.label}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8f98a0] leading-snug mb-2">{ach?.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-bold text-[#66c0f4] bg-[#101214] border border-[#323f4c] px-1.5 py-[1px] rounded-sm">
                {ach?.points} pts
              </span>
              {ratio > 1 && (
                <span className="text-[9px]"
                  style={{ color: ratio >= 30 ? '#ff6b6b' : ratio >= 20 ? '#e5b143' : ratio >= 10 ? '#66c0f4' : '#8f98a0' }}>
                  ×{ratio.toFixed(1)}
                </span>
              )}
              {ach?.author && (
                <span className="text-[9px] text-[#546270]">by {ach.author}</span>
              )}
              {ach?.dateCreated && (
                <span className="text-[9px] text-[#546270]">· added {formatDate(ach.dateCreated)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip ───────────────────────────────────────────────────────── */}
        {achData && (
          <div className="grid grid-cols-3 gap-0 bg-[#1b2838] border border-[#2a475e] rounded-[3px] mb-5 overflow-hidden">
            {[
              { label: 'Hardcore',      value: achData.unlocksHardcoreCount, pct: hcPct,  color: '#ff6b6b', Icon: Flame   },
              { label: 'Softcore',      value: achData.unlocksCount,         pct: anyPct, color: '#8f98a0', Icon: Feather },
              { label: 'Total Players', value: achData.totalPlayers,         pct: null,   color: '#546270', Icon: null    },
            ].map((stat, i) => (
              <div key={stat.label} className={`px-3 py-2.5 text-center ${i < 2 ? 'border-r border-[#2a475e]' : ''}`}>
                <div className="text-[13px] font-semibold mb-0.5" style={{ color: stat.color }}>
                  {stat.value.toLocaleString()}
                  {stat.pct !== null && <span className="text-[9px] ml-1 opacity-70">{stat.pct}%</span>}
                </div>
                <div className="text-[9px] text-[#546270] uppercase tracking-[0.07em] flex items-center justify-center gap-1">
                  {stat.Icon && <stat.Icon size={8} />}
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Your Status ───────────────────────────────────────────────────────── */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
            <span className="text-[13px] text-white tracking-wide uppercase font-medium">Your Status</span>
          </div>

          {userGame === null ? (
            <div className="shimmer h-[52px] rounded-[3px]" />
          ) : !userAch || !userAch.dateEarned ? (
            <div className="flex items-center gap-3 p-3 bg-[#1b2838] border border-[#2a475e] rounded-[3px]">
              <Lock size={16} className="text-[#546270] shrink-0" />
              <span className="text-[12px] text-[#546270]">Not yet unlocked</span>
            </div>
          ) : (
            <div className={`flex items-center gap-3 p-3 bg-[#1b2838] border rounded-[3px] border-l-[3px] ${
              userAch.dateEarnedHardcore
                ? 'border-[#2a475e] border-l-[#e5b143]'
                : 'border-[#2a475e] border-l-[#8f98a0]'
            }`}>
              <img
                src={`${MEDIA_URL}/Badge/${userAch?.badgeName || ach?.badgeName || '00001'}.png`}
                alt={ach?.title}
                className="w-8 h-8 rounded-[2px] border border-[#101214] object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white font-medium mb-0.5">
                  {userAch.dateEarnedHardcore ? 'Unlocked — Hardcore' : 'Unlocked — Softcore'}
                </div>
                <div className="text-[10px] text-[#66c0f4]">{formatDate(userAch.dateEarned)}</div>
              </div>
              {userAch.dateEarnedHardcore && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-[#e5b143] bg-[#e5b14318] border border-[#e5b14344] px-1.5 py-[2px] rounded-sm shrink-0">
                  <Flame size={8} /> HC
                </span>
              )}
            </div>
          )}
        </div>

        {/* Recent Unlocks ────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
            <span className="text-[13px] text-white tracking-wide uppercase font-medium">Recent Unlocks</span>
            {achData && (
              <span className="ml-auto text-[10px] text-[#546270]">
                {achData.unlocksCount.toLocaleString()} total
              </span>
            )}
          </div>

          <div className="flex flex-col gap-[2px]">
            {unlocks.length === 0 ? (
              <div className="text-[11px] text-[#546270] py-4 text-center">No unlocks recorded.</div>
            ) : unlocks.map((u, i) => (
              <div key={`${u.user}-${i}`}
                className="flex items-center gap-2.5 px-2.5 py-2 bg-[#1b2838] hover:bg-[#202d39] rounded-[2px] transition-colors">
                <img
                  src={`${MEDIA_URL}/UserPic/${u.user}.png`}
                  alt={u.user}
                  className="w-7 h-7 rounded-full border border-[#101214] shrink-0 object-cover bg-[#131a22]"
                  onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
                />
                <a href={`${SITE_URL}/user/${u.user}`} target="_blank" rel="noreferrer"
                  className="text-[11px] font-medium text-[#e5b143] hover:underline truncate flex-1 min-w-0">
                  {u.user}
                </a>
                {u.hardcoreMode && (
                  <span className="flex items-center gap-0.5 text-[8px] font-bold text-[#e5b143] bg-[#e5b14318] border border-[#e5b14344] px-1 py-[1px] rounded-sm shrink-0">
                    <Flame size={7} /> HC
                  </span>
                )}
                <span className="text-[9px] text-[#546270] shrink-0">{formatTimeAgo(u.dateAwarded, new Date().toISOString())}</span>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={loadMoreUnlocks}
              disabled={loadingMore}
              className="mt-2 w-full py-2 text-[11px] text-[#66c0f4] bg-[#1b2838] hover:bg-[#202d39] border border-[#2a475e] rounded-[3px] transition-colors disabled:opacity-50">
              {loadingMore
                ? 'Loading…'
                : `Load more (${(achData.unlocksCount - unlocks.length).toLocaleString()} remaining)`}
            </button>
          )}
        </div>

      </div>

      <Footer label="cheevo-tracker · retroachievements.org" />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<AchievementApp />);
