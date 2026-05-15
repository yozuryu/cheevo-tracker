import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Search, X, RefreshCw, Database, Loader2, Gamepad2, ChevronRight,
} from 'lucide-react';
import { parseTitle, getMediaUrl } from '../profile/utils/helpers.js';
import { TILDE_TAG_COLORS } from '../profile/utils/constants.js';
import {
  getCredentials, clearCredentials,
  fetchConsoles, fetchConsoleGames,
  getAllGamesStore, markAllGamesFullFetch,
} from '../profile/utils/ra-api.js';
import { Topbar, Footer } from '../assets/ui.js';

function handleAuthError() {
  clearCredentials();
  window.location.replace('../');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function relativeTime(ts) {
  if (!ts) return null;
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SearchApp() {
  const creds = getCredentials();
  const [store, setStore]           = useState(() => getAllGamesStore());
  const [query, setQuery]           = useState('');
  const [fetchStatus, setFetchStatus] = useState('idle'); // 'idle' | 'fetching' | 'error'
  const [progress, setProgress]     = useState(null);    // { done, total, current }
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 50;
  const cancelRef = useRef(false);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (!creds) { handleAuthError(); return; }
    inputRef.current?.focus();
  }, []);

  // Reset to page 1 whenever query changes
  useEffect(() => { setPage(1); }, [query]);

  const { items: results, total: resultTotal, totalPages } = useMemo(() => {
    if (!store?.games?.length || !query.trim()) return { items: null, total: 0, totalPages: 1 };
    const q = query.toLowerCase();
    const all = store.games.filter(g => g.title.toLowerCase().includes(q));
    const tp = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    const safePage = Math.min(page, tp);
    return { items: all.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), total: all.length, totalPages: tp };
  }, [store, query, page]);

  const indexedConsoles = store ? Object.keys(store.consolesFetched || {}).length : 0;
  const totalGames      = store?.games?.length || 0;
  const pct = progress?.total > 0 ? Math.round(progress.done / progress.total * 100) : 0;

  async function startFetch(forceRefresh) {
    if (!creds) { handleAuthError(); return; }
    cancelRef.current = false;
    setFetchStatus('fetching');
    setProgress({ done: 0, total: 0, current: 'Loading console list…' });

    try {
      const consoles = await fetchConsoles(creds.username, creds.apiKey);
      setProgress({ done: 0, total: consoles.length, current: consoles[0]?.name || '' });

      for (let i = 0; i < consoles.length; i++) {
        if (cancelRef.current) { setFetchStatus('idle'); setProgress(null); return; }
        const c = consoles[i];
        setProgress({ done: i, total: consoles.length, current: c.name });
        await fetchConsoleGames(creds.username, creds.apiKey, c.id, forceRefresh);
        setStore(getAllGamesStore());
        if (i < consoles.length - 1) await sleep(1000);
      }

      markAllGamesFullFetch();
      setStore(getAllGamesStore());
      setFetchStatus('idle');
      setProgress(null);
    } catch (e) {
      if (e?.message === 'AUTH_ERROR') handleAuthError();
      else setFetchStatus('error');
    }
  }

  const hasSomeData = store && totalGames > 0;

  return (
    <div className="min-h-screen bg-[#171a21] flex flex-col">
      <Topbar crumbs={[{ label: 'Cheevo Tracker', href: '../profile/' }, { label: 'Search' }]} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 pt-8 pb-16 md:pt-5 md:pb-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-[3px] h-[14px] bg-[#66c0f4] rounded-[1px] shrink-0" />
            <span className="text-[13px] text-white tracking-wide uppercase font-medium">Search Games</span>
          </div>
          {hasSomeData && fetchStatus !== 'fetching' && (
            <button type="button" onClick={() => startFetch(true)}
              className="ml-auto flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#546270] hover:text-[#66c0f4] transition-colors">
              <RefreshCw size={11} />
              Refresh All
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#546270]" />
          <input
            ref={inputRef}
            type="text"
            placeholder={hasSomeData ? `Search ${totalGames.toLocaleString()} games…` : 'Search games…'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={!hasSomeData || fetchStatus === 'fetching'}
            className="w-full bg-[#1b2838] border border-[#2a475e] focus:border-[#66c0f4] outline-none text-[12px] text-[#c6d4df] placeholder-[#546270] pl-9 pr-8 py-2.5 rounded-[3px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#546270] hover:text-[#c6d4df] transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status / fetch controls */}
        {fetchStatus === 'fetching' ? (
          <div className="mb-4 p-3 bg-[#1b2838] border border-[#2a475e] rounded-[3px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Loader2 size={13} className="text-[#66c0f4] animate-spin shrink-0" />
                <span className="text-[11px] text-[#c6d4df] truncate">{progress?.current || 'Fetching…'}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {progress?.total > 0 && (
                  <span className="text-[10px] text-[#546270]">{progress.done}/{progress.total}</span>
                )}
                <button type="button" onClick={() => { cancelRef.current = true; }}
                  className="text-[9px] font-semibold uppercase tracking-wider text-[#546270] hover:text-[#e55b5b] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
            {progress?.total > 0 && (
              <div className="h-[3px] bg-[#131a22] rounded-full overflow-hidden">
                <div className="h-full bg-[#66c0f4] rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        ) : fetchStatus === 'error' ? (
          <div className="mb-4 p-3 bg-[#1b2838] border border-[#8b4049] rounded-[3px] flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#e55b5b]">Fetch failed — check your connection and try again.</span>
            <button type="button" onClick={() => setFetchStatus('idle')}
              className="text-[#546270] hover:text-[#c6d4df] transition-colors shrink-0">
              <X size={13} />
            </button>
          </div>
        ) : hasSomeData ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4 px-1">
            <span className="text-[10px] text-[#546270]">
              <span className="text-[#8f98a0]">{totalGames.toLocaleString()}</span> games
              <span className="mx-1.5 text-[#2a475e]">·</span>
              <span className="text-[#8f98a0]">{indexedConsoles}</span> consoles indexed
            </span>
            {store.lastFullFetch ? (
              <span className="text-[10px] text-[#546270]">
                <span className="text-[#2a475e] mr-1.5">·</span>
                last updated {relativeTime(store.lastFullFetch)}
              </span>
            ) : (
              <>
                <span className="text-[#2a475e]">·</span>
                <button type="button" onClick={() => startFetch(false)}
                  className="text-[10px] text-[#66c0f4] hover:text-white transition-colors">
                  fetch remaining consoles
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="mb-4 p-6 bg-[#1b2838] border border-[#2a475e] rounded-[3px] flex flex-col items-center gap-3 text-center">
            <Database size={28} color="#2a475e" />
            <div>
              <p className="text-[12px] text-[#c6d4df] font-medium">No game data indexed yet</p>
              <p className="text-[10px] text-[#546270] mt-1">
                Fetch all console game lists to enable search.<br />
                Takes about 1–2 minutes at 1 request per second.
              </p>
            </div>
            <button type="button" onClick={() => startFetch(false)}
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider px-4 py-2 rounded-[3px] border border-[#66c0f4] text-[#66c0f4] hover:bg-[#66c0f4] hover:text-[#101214] transition-colors">
              <Database size={12} />
              Fetch All Consoles
            </button>
          </div>
        )}

        {/* Results */}
        {results !== null ? (
          results.length === 0 ? (
            <div className="text-[11px] text-[#546270] py-8 text-center">
              No games matching "{query}"
            </div>
          ) : (
            <>
              <p className="text-[10px] text-[#546270] mb-2 px-1">
                <span className="text-[#c6d4df]">{resultTotal.toLocaleString()}</span> result{resultTotal !== 1 ? 's' : ''}
                {totalPages > 1 && <span className="text-[#546270]"> — page {Math.min(page, totalPages)} of {totalPages}</span>}
              </p>
              <div className="flex flex-col gap-[2px]">
                {results.map(g => {
                  const { baseTitle, tags, subsetName, isSubset } = parseTitle(g.title);
                  return (
                    <a key={g.id} href={`../game/?id=${g.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 bg-[#1b2838] hover:bg-[#202d39] active:bg-[#202d39] rounded-[2px] transition-colors group">
                      {g.imageIcon
                        ? <img src={getMediaUrl(g.imageIcon)} alt={baseTitle}
                            className="w-8 h-8 rounded-[2px] border border-[#101214] object-cover shrink-0 bg-[#131a22]"
                            onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                        : <span className="w-8 h-8 rounded-[2px] border border-[#101214] bg-[#131a22] flex items-center justify-center shrink-0">
                            <Gamepad2 size={14} color="#546270" />
                          </span>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12px] font-medium text-[#c6d4df] group-hover:text-white transition-colors leading-snug">{baseTitle}</span>
                          {isSubset && (
                            <span className="text-[7px] font-bold uppercase tracking-[0.07em] px-1 py-[1px] rounded-[2px] border border-[rgba(229,177,67,0.3)] bg-[rgba(229,177,67,0.1)] text-[#c8a84b] shrink-0">Subset</span>
                          )}
                          {tags.map(tag => {
                            const tc = TILDE_TAG_COLORS[tag] || TILDE_TAG_COLORS['Prototype'];
                            return (
                              <span key={tag} style={{
                                fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                                padding: '1px 4px', borderRadius: '2px',
                                border: `1px solid ${tc.border}`, background: tc.bg, color: tc.color,
                              }}>{tag}</span>
                            );
                          })}
                        </div>
                        {isSubset && subsetName && (
                          <span className="text-[9px] text-[#c8a84b] block truncate">{subsetName}</span>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-[#66c0f4]">{g.consoleName}</span>
                          {g.numAchievements > 0 && (
                            <>
                              <span className="text-[#2a475e] text-[9px]">·</span>
                              <span className="text-[9px] text-[#546270]">
                                <span className="text-[#8f98a0]">{g.numAchievements}</span> ach
                                <span className="text-[#2a475e] mx-1">·</span>
                                <span className="text-[#e5b143]">{(g.points || 0).toLocaleString()}</span> pts
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={12} color="#2a475e" className="shrink-0" />
                    </a>
                  );
                })}
              </div>

              {/* Pagination nav */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 px-1 pb-4 md:pb-0">
                  <button type="button"
                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                    disabled={page <= 1}
                    className="text-[9px] font-semibold uppercase tracking-wider px-2.5 py-[4px] rounded-[2px] border border-[#323f4c] bg-[#101214] text-[#8f98a0] hover:text-[#c6d4df] hover:border-[#546270] transition-colors disabled:opacity-30 disabled:pointer-events-none">
                    ← Prev
                  </button>
                  <span className="text-[9px] text-[#546270]">
                    Page <span className="text-[#c6d4df]">{Math.min(page, totalPages)}</span> of <span className="text-[#c6d4df]">{totalPages}</span>
                  </span>
                  <button type="button"
                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                    disabled={page >= totalPages}
                    className="text-[9px] font-semibold uppercase tracking-wider px-2.5 py-[4px] rounded-[2px] border border-[#323f4c] bg-[#101214] text-[#8f98a0] hover:text-[#c6d4df] hover:border-[#546270] transition-colors disabled:opacity-30 disabled:pointer-events-none">
                    Next →
                  </button>
                </div>
              )}
            </>
          )
        ) : hasSomeData && !query.trim() ? (
          <div className="text-center py-10 text-[#546270] text-[11px]">
            Type to search across {totalGames.toLocaleString()} games
          </div>
        ) : null}
      </main>

      <Footer label="Cheevo Tracker · Search" />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<SearchApp />);
