import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Crown, AlertTriangle, Lock, Flame, Feather, Gamepad2, Star, TrendingUp, User, Calendar, ExternalLink, Loader } from 'lucide-react';
import { MEDIA_URL, SITE_URL } from '../profile/utils/constants.js';
import { parseTitle, formatDate, formatTimeAgo, getMediaUrl } from '../profile/utils/helpers.js';
import { getCredentials, clearCredentials, getAchievementUnlocks, getGameInfoAndUserProgress, getComments } from '../profile/utils/ra-api.js';
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

  const VALID_TABS = ['unlocks', 'comments', 'changelog'];
  const initialTab = VALID_TABS.includes(params.get('tab')) ? params.get('tab') : 'unlocks';

  const [achData, setAchData]         = useState(null);
  const [userGame, setUserGame]       = useState(null);
  const [unlocks, setUnlocks]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);

  const [activeTab, setActiveTab]           = useState(initialTab);

  function switchTab(id) {
    setActiveTab(id);
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', id);
    history.replaceState(null, '', '?' + sp.toString());
  }
  const [comments, setComments]             = useState(null);
  const [commentsTotal, setCommentsTotal]   = useState(0);
  const [commentsOffset, setCommentsOffset] = useState(0);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);

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

  // ── Lazy-load comments when tab opens ────────────────────────────────────────
  useEffect(() => {
    if ((activeTab !== 'comments' && activeTab !== 'changelog') || comments !== null || !achId) return;
    if (!creds) { handleAuthError(); return; }
    getComments(creds.username, creds.apiKey, { i: achId, t: 2, c: 25 })
      .then(data => {
        setComments(data.results);
        setCommentsTotal(data.total);
        setCommentsOffset(25);
      })
      .catch(err => {
        if (err.message === 'AUTH_ERROR') handleAuthError();
        else setComments([]);
      });
  }, [activeTab, achId]);

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

  async function loadMoreComments() {
    if (!creds || loadingMoreComments) return;
    setLoadingMoreComments(true);
    try {
      const data = await getComments(creds.username, creds.apiKey,
        { i: achId, t: 2, c: 25, o: commentsOffset });
      setComments(prev => [...prev, ...data.results]);
      setCommentsOffset(o => o + 25);
    } catch {}
    setLoadingMoreComments(false);
  }

  // Derived values
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
  const hasMoreUnlocks  = achData && unlocks.length < achData.unlocksCount;
  const userComments    = comments ? comments.filter(c => c.user !== 'Server') : [];
  const changelogEntries = comments ? comments.filter(c => c.user === 'Server') : [];
  const gameId      = achData?.game?.id;
  const gameName    = achData?.game?.title ? parseTitle(achData.game.title).baseTitle : null;
  const consoleId   = achData?.console?.id   || achData?.achievement?.consoleId || null;
  const consoleName = achData?.console?.title || userGame?.consoleName || null;

  const badgeSrc = userAch?.badgeName
    ? `${MEDIA_URL}/Badge/${userAch.badgeName}.png`
    : ach?.badgeName
      ? `${MEDIA_URL}/Badge/${ach.badgeName}.png`
      : `${MEDIA_URL}/Badge/00001.png`;

  const heroBg = (() => {
    if (!userGame) return null;
    const isFallback = img => !img || img.includes('000002');
    return (!isFallback(userGame.imageIngame) ? userGame.imageIngame : null)
        || (!isFallback(userGame.imageTitle)  ? userGame.imageTitle  : null)
        || null;
  })();

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171a21] flex flex-col">
        <Topbar crumbs={[{ label: 'Cheevo Tracker', href: '../profile/' }, { label: null }, { label: null }, { label: null }]} />
        <div className="relative overflow-hidden bg-[#1b2838] border-b border-[#2a475e]">
          <div className="relative max-w-3xl mx-auto px-4 md:px-8 pt-8 pb-4 md:pt-5">
            <div className="shimmer h-4 w-40 rounded mb-4" />
            <div className="flex gap-4 items-start">
              <div className="shimmer w-16 h-16 md:w-28 md:h-28 rounded-[3px] shrink-0" />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="shimmer h-5 w-3/4 rounded" />
                <div className="shimmer h-3 w-full rounded" />
                <div className="shimmer h-3 w-2/3 rounded" />
                <div className="shimmer h-3 w-1/2 rounded mt-1" />
              </div>
            </div>
          </div>
          <div className="border-t border-[#101214] bg-[#131a22]/50">
            <div className="max-w-3xl mx-auto px-4 md:px-8 py-2.5 grid grid-flow-col auto-cols-fr">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex flex-col items-center gap-1 py-1">
                  <div className="shimmer h-4 w-12 rounded" />
                  <div className="shimmer h-2 w-10 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-6">
          <div className="shimmer h-[52px] rounded mb-5" />
          <div className="flex items-center gap-2 mb-4">
            <div className="shimmer h-7 w-32 rounded-sm" />
            <div className="shimmer h-7 w-24 rounded-sm" />
          </div>
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
        <Topbar crumbs={[{ label: 'Cheevo Tracker', href: '../profile/' }, { label: null }, { label: null }, { label: null }]} />
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
        ...(consoleId && consoleName
          ? [{ label: consoleName, href: `../console/?id=${consoleId}` }]
          : consoleName ? [{ label: consoleName }] : [{ label: null }]),
        ...(gameName && gameId
          ? [{ label: gameName, href: `../game/?id=${gameId}` }]
          : [{ label: null }]),
        { label: ach?.title || 'Achievement' },
      ]} />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[#1b2838] border-b border-[#2a475e]">
        {heroBg && (
          <div className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{ backgroundImage: `url(${getMediaUrl(heroBg)})` }} />
        )}
        <div className="relative max-w-3xl mx-auto px-4 md:px-8 pt-8 pb-4 md:pt-5">

          {/* Game info row */}
          {(gameName || consoleName) && (
            <div className="flex items-center gap-x-2 gap-y-1 flex-wrap mb-3 text-[10px]">
              {userGame && userGame.imageIcon && (
                <img src={getMediaUrl(userGame.imageIcon)} alt={gameName}
                  className="w-5 h-5 rounded-[2px] border border-[#101214] object-cover shrink-0 bg-[#131a22]" />
              )}
              {gameName && gameId && (
                <a href={`../game/?id=${gameId}`}
                  className="text-[#66c0f4] hover:text-[#c6d4df] transition-colors font-medium truncate max-w-[220px]">
                  {gameName}
                </a>
              )}
              {consoleName && <>
                <span className="text-[#2a475e] select-none">·</span>
                {consoleId
                  ? <a href={`../console/?id=${consoleId}`}
                      className="flex items-center gap-1 text-[#8f98a0] hover:text-[#c6d4df] transition-colors">
                      <Gamepad2 size={10} className="shrink-0" />{consoleName}
                    </a>
                  : <span className="flex items-center gap-1 text-[#8f98a0]">
                      <Gamepad2 size={10} className="shrink-0" />{consoleName}
                    </span>
                }
              </>}
            </div>
          )}

          {/* Badge + info */}
          <div className="flex gap-4 items-start">
            <div className="relative shrink-0 w-16 h-16 md:w-28 md:h-28 rounded-[3px] border border-[#101214] overflow-hidden bg-black">
              <img
                src={badgeSrc}
                alt={ach?.title}
                className={`w-full h-full object-cover ${!userAch?.dateEarned ? 'grayscale brightness-40' : ''}`}
              />
              {!userAch?.dateEarned && (
                <Lock size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40" />
              )}
            </div>

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

              <div className="flex items-center gap-2 flex-wrap text-[10px]">
                <span className="flex items-center gap-1 text-[#66c0f4]">
                  <Star size={10} className="shrink-0" />{ach?.points} pts
                </span>
                {ratio > 1 && <>
                  <span className="text-[#2a475e] select-none">·</span>
                  <span className="flex items-center gap-1"
                    style={{ color: ratio >= 30 ? '#ff6b6b' : ratio >= 20 ? '#e5b143' : ratio >= 10 ? '#66c0f4' : '#8f98a0' }}>
                    <TrendingUp size={10} className="shrink-0" />×{ratio.toFixed(1)}
                  </span>
                </>}
                {ach?.author && <>
                  <span className="text-[#2a475e] select-none">·</span>
                  <span className="flex items-center gap-1 text-[#8f98a0]">
                    <User size={10} className="shrink-0" />{ach.author}
                  </span>
                </>}
                {ach?.dateCreated && <>
                  <span className="text-[#2a475e] select-none">·</span>
                  <span className="flex items-center gap-1 text-[#8f98a0]">
                    <Calendar size={10} className="shrink-0" />{formatDate(ach.dateCreated)}
                  </span>
                </>}
                {achId && <>
                  <span className="text-[#2a475e] select-none">·</span>
                  <a href={`${SITE_URL}/achievement/${achId}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-[#546270] hover:text-[#66c0f4] transition-colors">
                    <ExternalLink size={10} className="shrink-0" />RA
                  </a>
                </>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {achData && (
          <div className="relative border-t border-[#101214] bg-[#131a22]/50">
            <div className="max-w-3xl mx-auto px-2 md:px-8 py-2.5 grid grid-flow-col auto-cols-fr">
              {[
                { label: 'Hardcore',      value: achData.unlocksHardcoreCount, pct: hcPct,  color: '#ff6b6b', Icon: Flame   },
                { label: 'Softcore',      value: achData.unlocksCount,         pct: anyPct, color: '#8f98a0', Icon: Feather },
                { label: 'Total Players', value: achData.totalPlayers,         pct: null,   color: '#546270', Icon: null    },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center py-1 px-2 min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[12px] md:text-[14px] font-bold" style={{ color: s.color }}>
                      {s.value.toLocaleString()}
                    </span>
                    {s.pct !== null && (
                      <span className="text-[9px] md:text-[10px] text-[#546270]">{s.pct}%</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[8px] md:text-[9px] text-[#546270] uppercase tracking-[0.07em]">
                    {s.Icon && <s.Icon size={8} />}
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-6">

        {/* Your Status — always visible */}
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
              <img src={badgeSrc} alt={ach?.title}
                className="w-8 h-8 rounded-[2px] border border-[#101214] object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-[#546270] uppercase tracking-[0.07em] mb-0.5">Unlocked at</div>
                <div className="text-[11px] text-[#66c0f4] font-medium">{formatDate(userAch.dateEarned)}</div>
              </div>
              {userAch.dateEarnedHardcore && (
                <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-[2px] rounded-sm shrink-0"
                  style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)' }}>
                  <Flame size={8} /> Hardcore
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="sticky top-0 md:top-[26px] z-30 bg-[#171a21] -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-1 border-b border-[#2a475e]">
          <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'unlocks',   label: 'Recent Unlocks', count: achData?.unlocksCount },
            { id: 'comments',  label: 'Comments',        count: null },
            { id: 'changelog', label: 'Changelog',       count: null },
          ].map(t => (
            <button key={t.id} type="button" onClick={() => switchTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider border transition-colors shrink-0 ${
                activeTab === t.id
                  ? 'bg-[#1b2838] text-[#c6d4df] border-[#66c0f4]'
                  : 'text-[#546270] border-[#323f4c] hover:text-[#8f98a0] hover:border-[#546270]'
              }`}>
              {t.label}
              {t.count != null && (
                <span className={`text-[9px] font-normal ${activeTab === t.id ? 'text-[#546270]' : 'text-[#323f4c]'}`}>
                  {t.count.toLocaleString()}
                </span>
              )}
            </button>
          ))}
          </div>
        </div>

        {/* ── Recent Unlocks tab ── */}
        {activeTab === 'unlocks' && (
          <div>
            <div className="flex flex-col gap-[2px]">
              {unlocks.length === 0 ? (
                <div className="text-[11px] text-[#546270] py-8 text-center">No unlocks recorded.</div>
              ) : unlocks.map((u, i) => (
                <div key={`${u.user}-${i}`}
                  className={`flex items-center gap-2.5 px-2.5 py-2 bg-[#1b2838] hover:bg-[#202d39] border-l-[3px] transition-colors ${
                    u.hardcoreMode ? 'border-l-[#e5b143]' : 'border-l-[#546270]'
                  }`}>
                  <img
                    src={u.userPic ? getMediaUrl(u.userPic) : `${MEDIA_URL}/UserPic/${u.user}.png`}
                    alt={u.user}
                    className="w-7 h-7 rounded-full border border-[#101214] shrink-0 object-cover bg-[#131a22]"
                    onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
                  />
                  <a href={`../profile/?u=${u.user}`}
                    className="text-[11px] font-medium text-[#e5b143] hover:text-[#f0c96a] transition-colors truncate flex-1 min-w-0">
                    {u.user}
                  </a>
                  {u.hardcoreMode && (
                    <span className="flex items-center gap-0.5 text-[8px] font-bold px-1 py-[1px] rounded-sm shrink-0"
                      style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)' }}>
                      <Flame size={7} /> Hardcore
                    </span>
                  )}
                  <span className="text-[9px] text-[#546270] shrink-0">{formatTimeAgo(u.dateAwarded, new Date().toISOString())}</span>
                </div>
              ))}
            </div>

            {hasMoreUnlocks && (
              <button onClick={loadMoreUnlocks} disabled={loadingMore}
                className="mt-3 w-full py-2 text-[11px] text-[#66c0f4] bg-[#1b2838] hover:bg-[#202d39] border border-[#2a475e] rounded-[3px] transition-colors disabled:opacity-50">
                {loadingMore ? 'Loading…' : `Load more (${(achData.unlocksCount - unlocks.length).toLocaleString()} remaining)`}
              </button>
            )}
          </div>
        )}

        {/* ── Comments tab ── */}
        {activeTab === 'comments' && (
          <div>
            {comments === null ? (
              <div className="flex flex-col gap-[2px]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 py-2.5 border-b border-[#1b2838]">
                    <div className="shimmer w-7 h-7 rounded-full shrink-0 mt-0.5" />
                    <div className="flex-1 flex flex-col gap-1.5 pt-0.5">
                      <div className="flex gap-2">
                        <div className="shimmer h-2.5 w-20 rounded" />
                        <div className="shimmer h-2.5 w-14 rounded" />
                      </div>
                      <div className="shimmer h-2 w-full rounded" />
                      <div className="shimmer h-2 w-3/4 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : userComments.length === 0 ? (
              <div className="text-[11px] text-[#546270] py-8 text-center">No comments yet.</div>
            ) : (
              <div className="flex flex-col">
                {userComments.map((c, i) => (
                  <div key={`${c.ulid || c.user}-${i}`} className="flex gap-3 py-2.5 border-b border-[#1b2838]">
                    <a href={`../profile/?u=${c.user}`} className="shrink-0 mt-0.5">
                      <img
                        src={c.userPic ? getMediaUrl(c.userPic) : `${MEDIA_URL}/UserPic/${c.user}.png`}
                        alt={c.user}
                        className="w-7 h-7 rounded-full border border-[#2a475e] bg-[#131a22] object-cover"
                      />
                    </a>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <a href={`../profile/?u=${c.user}`}
                          className="text-[11px] font-medium text-[#e5b143] hover:text-[#f0c96a] transition-colors shrink-0">{c.user}</a>
                        <span className="text-[9px] text-[#546270]">{formatTimeAgo(c.submitted)}</span>
                      </div>
                      <p className="text-[11px] text-[#c6d4df] leading-snug break-words">{c.commentText}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {comments !== null && comments.length < commentsTotal && (
              <div className="mt-4 flex justify-center">
                <button type="button" onClick={loadMoreComments} disabled={loadingMoreComments}
                  className="flex items-center gap-2 text-[11px] text-[#66c0f4] border border-[#66c0f4]/40 bg-[#66c0f4]/10 hover:bg-[#66c0f4]/20 px-4 py-1.5 rounded-full transition-colors disabled:opacity-50">
                  {loadingMoreComments
                    ? <><Loader size={12} className="animate-spin" /> Loading…</>
                    : <>Load more ({commentsTotal - comments.length} remaining)</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Changelog tab ── */}
        {activeTab === 'changelog' && (
          <div>
            {comments === null ? (
              <div className="relative pl-6">
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-[#2a475e] rounded-full opacity-40" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="relative flex flex-col gap-1.5 py-2.5">
                    <div className="absolute left-[-21px] top-[13px] w-2.5 h-2.5 rounded-full border-2 border-[#2a475e] bg-[#171a21] opacity-40" />
                    <div className="shimmer h-2.5 w-3/4 rounded" />
                    <div className="shimmer h-2 w-20 rounded" />
                  </div>
                ))}
              </div>
            ) : changelogEntries.length === 0 ? (
              <div className="text-[11px] text-[#546270] py-8 text-center">No changelog entries.</div>
            ) : (
              <div className="relative pl-6">
                {/* vertical line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-[#2a475e] rounded-full" />
                {changelogEntries.map((c, i) => (
                  <div key={`cl-${i}`} className="relative flex flex-col gap-0.5 py-2.5">
                    {/* dot marker */}
                    <div className="absolute left-[-21px] top-[13px] w-2.5 h-2.5 rounded-full border-2 border-[#66c0f4] bg-[#171a21] shrink-0" />
                    <p className="text-[11px] text-[#c6d4df] leading-snug break-words">
                      {(() => {
                        const spaceIdx = c.commentText.indexOf(' ');
                        if (spaceIdx === -1) return <span className="text-[#e5b143]">{c.commentText}</span>;
                        return <><span className="text-[#e5b143]">{c.commentText.slice(0, spaceIdx)}</span>{c.commentText.slice(spaceIdx)}</>;
                      })()}
                    </p>
                    <span className="text-[9px] text-[#66c0f4]">{formatTimeAgo(c.submitted)}</span>
                  </div>
                ))}
              </div>
            )}

            {comments !== null && comments.length < commentsTotal && (
              <div className="mt-4 flex justify-center">
                <button type="button" onClick={loadMoreComments} disabled={loadingMoreComments}
                  className="flex items-center gap-2 text-[11px] text-[#66c0f4] border border-[#66c0f4]/40 bg-[#66c0f4]/10 hover:bg-[#66c0f4]/20 px-4 py-1.5 rounded-full transition-colors disabled:opacity-50">
                  {loadingMoreComments
                    ? <><Loader size={12} className="animate-spin" /> Loading…</>
                    : <>Load more ({commentsTotal - comments.length} remaining)</>}
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      <Footer label="cheevo-tracker · retroachievements.org" />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<AchievementApp />);
