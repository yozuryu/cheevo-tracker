import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Gamepad2, ChevronRight, Search, X, ArrowLeft } from 'lucide-react';
import { parseTitle, getMediaUrl } from '../profile/utils/helpers.js';
import { TILDE_TAG_COLORS } from '../profile/utils/constants.js';
import { getCredentials, clearCredentials, fetchConsoles, fetchConsoleGames } from '../profile/utils/ra-api.js';
import { Topbar, Footer } from '../assets/ui.js';

function handleAuthError() {
  clearCredentials();
  window.location.replace('../');
}

// ── Grouping maps ─────────────────────────────────────────────────────────────
// Both maps are ID-based using the known console list.
// Any ID not present falls back to 'Other' automatically.

const PUBLISHER_MAP = {
  // Nintendo
  2: 'Nintendo', 3: 'Nintendo', 4: 'Nintendo', 5: 'Nintendo', 6: 'Nintendo',
  7: 'Nintendo', 16: 'Nintendo', 18: 'Nintendo', 19: 'Nintendo', 20: 'Nintendo',
  24: 'Nintendo', 28: 'Nintendo', 60: 'Nintendo', 62: 'Nintendo', 78: 'Nintendo', 81: 'Nintendo',
  // Sony
  12: 'Sony', 21: 'Sony', 41: 'Sony',
  // Sega
  1: 'Sega', 9: 'Sega', 10: 'Sega', 11: 'Sega', 15: 'Sega',
  33: 'Sega', 39: 'Sega', 40: 'Sega', 68: 'Sega',
  // Atari
  13: 'Atari', 17: 'Atari', 25: 'Atari', 36: 'Atari', 50: 'Atari', 51: 'Atari', 77: 'Atari',
  // SNK
  14: 'SNK', 56: 'SNK',
  // NEC
  8: 'NEC', 47: 'NEC', 49: 'NEC', 67: 'NEC', 76: 'NEC',
  // Microsoft
  22: 'Microsoft',
  // Bandai
  53: 'Bandai',
  // Mattel
  45: 'Mattel',
  // Coleco
  44: 'Coleco',
};

const PUBLISHER_ORDER = [
  'Atari', 'Bandai', 'Coleco', 'Mattel', 'Microsoft',
  'NEC', 'Nintendo', 'Sega', 'SNK', 'Sony', 'Other',
];

const ERA_MAP = {
  // Pre-8-Bit (before ~1983)
  23: 'Pre-8-Bit', 25: 'Pre-8-Bit', 44: 'Pre-8-Bit', 45: 'Pre-8-Bit',
  46: 'Pre-8-Bit', 50: 'Pre-8-Bit', 54: 'Pre-8-Bit', 57: 'Pre-8-Bit',
  73: 'Pre-8-Bit', 74: 'Pre-8-Bit', 75: 'Pre-8-Bit',
  // 8-Bit (~1983–1990)
  4: '8-Bit', 7: '8-Bit', 11: '8-Bit', 13: '8-Bit', 15: '8-Bit',
  33: '8-Bit', 51: '8-Bit', 55: '8-Bit', 63: '8-Bit', 68: '8-Bit', 69: '8-Bit', 81: '8-Bit',
  // 16-Bit (~1990–1996)
  1: '16-Bit', 3: '16-Bit', 8: '16-Bit', 9: '16-Bit', 10: '16-Bit', 76: '16-Bit',
  // 32 / 64-Bit (~1993–2002)
  2: '32 / 64-Bit', 6: '32 / 64-Bit', 12: '32 / 64-Bit', 14: '32 / 64-Bit',
  17: '32 / 64-Bit', 28: '32 / 64-Bit', 39: '32 / 64-Bit', 43: '32 / 64-Bit',
  49: '32 / 64-Bit', 53: '32 / 64-Bit', 56: '32 / 64-Bit', 77: '32 / 64-Bit',
  // 6th Gen (~1998–2006)
  5: '6th Gen', 16: '6th Gen', 21: '6th Gen', 22: '6th Gen',
  24: '6th Gen', 40: '6th Gen', 42: '6th Gen', 61: '6th Gen',
  // 7th Gen (~2004–2013)
  18: '7th Gen', 19: '7th Gen', 41: '7th Gen', 70: '7th Gen', 78: '7th Gen',
  // 8th Gen+ (~2011–)
  20: '8th Gen+', 62: '8th Gen+',
  // Computer
  26: 'Computer', 29: 'Computer', 30: 'Computer', 31: 'Computer', 32: 'Computer',
  34: 'Computer', 35: 'Computer', 36: 'Computer', 37: 'Computer', 38: 'Computer',
  47: 'Computer', 48: 'Computer', 52: 'Computer', 58: 'Computer', 59: 'Computer',
  64: 'Computer', 65: 'Computer', 66: 'Computer', 67: 'Computer', 79: 'Computer',
  // Arcade
  27: 'Arcade',
};

const ERA_ORDER = [
  'Pre-8-Bit', '8-Bit', '16-Bit', '32 / 64-Bit',
  '6th Gen', '7th Gen', '8th Gen+', 'Computer', 'Arcade', 'Other',
];

function getPublisher(id) { return PUBLISHER_MAP[id] || 'Other'; }
function getEra(id)       { return ERA_MAP[id]       || 'Other'; }

// Groups an array of consoles into [{ name, consoles }] in defined order.
function groupConsoles(consoles, grouping) {
  if (grouping === 'none') return null;

  const map = {};
  for (const c of consoles) {
    const key = grouping === 'publisher' ? getPublisher(c.id) : getEra(c.id);
    if (!map[key]) map[key] = [];
    map[key].push(c);
  }

  const order = grouping === 'publisher' ? PUBLISHER_ORDER : ERA_ORDER;
  const sorted = [];
  for (const key of order) {
    if (map[key]) sorted.push({ name: key, consoles: map[key] });
  }
  // Safety net: anything not in the order list
  for (const key of Object.keys(map)) {
    if (!order.includes(key)) sorted.push({ name: key, consoles: map[key] });
  }
  return sorted;
}

// ── Console List ──────────────────────────────────────────────────────────────

function ConsoleCard({ console: c, onClick }) {
  const [imgError, setImgError] = useState(false);
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-3 p-3 bg-[#1b2838] hover:bg-[#202d39] active:bg-[#202d39] border border-[#2a475e] rounded-[3px] text-left transition-colors w-full group">
      <span className="w-8 h-8 rounded-[3px] bg-[#131a22] border border-[#101214] flex items-center justify-center shrink-0 overflow-hidden">
        {c.iconUrl && !imgError
          ? <img src={c.iconUrl} alt={c.name} className="w-6 h-6 object-contain"
              onError={() => setImgError(true)} />
          : <Gamepad2 size={14} color="#546270" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[12px] font-medium text-[#c6d4df] group-hover:text-white transition-colors leading-snug truncate">{c.name}</span>
        {!c.active && <span className="text-[9px] text-[#546270] uppercase tracking-wider">Inactive</span>}
      </span>
      <ChevronRight size={12} color="#2a475e" className="shrink-0" />
    </button>
  );
}

function ConsoleListView({ onSelect }) {
  const creds = getCredentials();
  const [consoles, setConsoles] = useState(null);
  const [grouping, setGrouping] = useState(() => {
    const g = new URLSearchParams(window.location.search).get('group');
    return g === 'era' ? 'era' : 'publisher';
  });
  const [error, setError] = useState(null);

  function switchGrouping(val) {
    setGrouping(val);
    const sp = new URLSearchParams(window.location.search);
    sp.set('group', val);
    history.replaceState(null, '', '?' + sp.toString());
  }

  useEffect(() => {
    if (!creds) { handleAuthError(); return; }
    fetchConsoles(creds.username, creds.apiKey)
      .then(setConsoles)
      .catch(e => {
        if (e.message === 'AUTH_ERROR') handleAuthError();
        else setError('Failed to load consoles.');
      });
  }, []);

  const grouped = useMemo(() => consoles ? groupConsoles(consoles, grouping) : null, [consoles, grouping]);

  const grid = (list) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {list.map(c => (
        <ConsoleCard key={c.id} console={c} onClick={() => onSelect(c.id)} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#171a21] flex flex-col">
      <Topbar crumbs={[{ label: 'Cheevo Tracker', href: '../profile/' }, { label: 'Consoles' }]} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 pt-8 pb-5 md:pt-5">
        {/* Header + group controls */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
            <span className="text-[13px] text-white tracking-wide uppercase font-medium">Consoles</span>
            {consoles && <span className="text-[10px] text-[#546270]"><span className="text-[#66c0f4]">{consoles.length}</span> systems</span>}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[9px] text-[#546270] uppercase tracking-wider">Group</span>
            {[
              { value: 'publisher', label: 'Publisher' },
              { value: 'era',       label: 'Gen'       },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => switchGrouping(opt.value)}
                className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-[3px] rounded-[2px] border transition-colors ${
                  grouping === opt.value
                    ? 'bg-[#1b2838] text-[#c6d4df] border-[#2a475e]'
                    : 'bg-[#101214] text-[#546270] border-[#323f4c] hover:text-[#c6d4df] hover:border-[#546270]'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="text-[11px] text-[#546270] py-8 text-center">{error}</div>
        ) : consoles === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[...Array(18)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#1b2838] border border-[#2a475e] rounded-[3px]">
                <div className="shimmer w-8 h-8 rounded-[3px] shrink-0" />
                <div className="shimmer h-3 flex-1 rounded" />
              </div>
            ))}
          </div>
        ) : grouped ? (
          <div className="flex flex-col gap-6">
            {grouped.map(group => (
              <div key={group.name}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-[3px] h-[12px] bg-[#2a475e] rounded-[1px] shrink-0" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c6d4df]">{group.name}</span>
                  <span className="text-[9px] text-[#66c0f4]">{group.consoles.length}</span>
                </div>
                {grid(group.consoles)}
              </div>
            ))}
          </div>
        ) : (
          grid(consoles)
        )}
      </main>

      <Footer label="Cheevo Tracker · Consoles" />
    </div>
  );
}

// ── Game List ─────────────────────────────────────────────────────────────────

function GameListView({ consoleId, consoleName, onBack }) {
  const creds = getCredentials();
  const [games, setGames]       = useState(null);
  const [search, setSearch]     = useState('');
  const [achFilter, setAchFilter] = useState(() => {
    const f = new URLSearchParams(window.location.search).get('ach');
    return ['all', 'with', 'without'].includes(f) ? f : 'with';
  });
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!creds) { handleAuthError(); return; }
    setGames(null);
    setSearch('');
    fetchConsoleGames(creds.username, creds.apiKey, consoleId)
      .then(setGames)
      .catch(e => {
        if (e.message === 'AUTH_ERROR') handleAuthError();
        else setError('Failed to load games.');
      });
  }, [consoleId]);

  const filtered = useMemo(() => {
    if (!games) return [];
    let result = games;
    if (achFilter === 'with')    result = result.filter(g => g.numAchievements > 0);
    if (achFilter === 'without') result = result.filter(g => g.numAchievements === 0);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g => g.title.toLowerCase().includes(q));
    }
    return result;
  }, [games, search, achFilter]);

  return (
    <div className="min-h-screen bg-[#171a21] flex flex-col">
      <Topbar crumbs={[
        { label: 'Cheevo Tracker', href: '../profile/' },
        { label: consoleName || null },
      ]} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 pt-8 pb-5 md:pt-5">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-4">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 text-[11px] text-[#546270] hover:text-[#c6d4df] transition-colors shrink-0">
            <ArrowLeft size={13} />
            <span className="hidden md:inline">Consoles</span>
          </button>
          <span className="text-[#2a475e] select-none">·</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-[3px] h-[14px] bg-[#e5b143] rounded-[1px] shrink-0" />
            <span className="text-[13px] text-white tracking-wide uppercase font-medium truncate">{consoleName}</span>
            {games && <span className="text-[10px] text-[#546270] shrink-0"><span className="text-[#66c0f4]">{games.length}</span> games</span>}
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col gap-2 mb-3">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#546270]" />
            <input
              type="text"
              placeholder="Search games…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1b2838] border border-[#2a475e] focus:border-[#66c0f4] outline-none text-[11px] text-[#c6d4df] placeholder-[#546270] pl-7 pr-7 py-2 rounded-[3px] transition-colors"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#546270] hover:text-[#c6d4df] transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[9px] text-[#546270] uppercase tracking-wider shrink-0">Achievements</span>
            {[
              { value: 'all',     label: 'All'     },
              { value: 'with',    label: 'With'    },
              { value: 'without', label: 'Without' },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => {
                setAchFilter(opt.value);
                const sp = new URLSearchParams(window.location.search);
                sp.set('ach', opt.value);
                history.replaceState(null, '', '?' + sp.toString());
              }}
                className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-[3px] rounded-[2px] border shrink-0 transition-colors ${
                  achFilter === opt.value
                    ? 'bg-[#1b2838] text-[#c6d4df] border-[#2a475e]'
                    : 'bg-[#101214] text-[#546270] border-[#323f4c] hover:text-[#c6d4df] hover:border-[#546270]'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Game list */}
        {error ? (
          <div className="text-[11px] text-[#546270] py-8 text-center">{error}</div>
        ) : games === null ? (
          <div className="flex flex-col gap-[2px]">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#1b2838] rounded-[2px]">
                <div className="shimmer w-8 h-8 rounded-[2px] shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="shimmer h-3 w-2/3 rounded" />
                  <div className="shimmer h-2 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-[11px] text-[#546270] py-8 text-center">
            {search ? `No games matching "${search}"` : 'No games found.'}
          </div>
        ) : (
          <div className="flex flex-col gap-[2px]">
            {filtered.map(g => {
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
                          }}>
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                    {isSubset && subsetName && (
                      <span className="text-[9px] text-[#c8a84b] truncate block">{subsetName}</span>
                    )}
                    {g.numAchievements > 0 && (
                      <span className="text-[9px] text-[#546270] flex items-center gap-1">
                        <span className="text-[#66c0f4]">{g.numAchievements}</span> achievements
                        <span className="text-[#2a475e]">·</span>
                        <span className="text-[#e5b143]">{g.points.toLocaleString()}</span> pts
                      </span>
                    )}
                  </div>
                  <ChevronRight size={12} color="#2a475e" className="shrink-0" />
                </a>
              );
            })}
          </div>
        )}

        {games && search && filtered.length > 0 && (
          <p className="text-[10px] text-[#546270] mt-2 px-1">
            <span className="text-[#66c0f4]">{filtered.length}</span> of <span className="text-[#66c0f4]">{games.length}</span> games
          </p>
        )}
      </main>

      <Footer label={`Cheevo Tracker · ${consoleName || 'Games'}`} />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function ConsoleApp() {
  const params = new URLSearchParams(window.location.search);
  const [consoleId,   setConsoleId]   = useState(params.get('id') ? Number(params.get('id')) : null);
  const [consoles,    setConsoles]    = useState(null);

  const creds = getCredentials();

  useEffect(() => {
    if (!creds) { handleAuthError(); return; }
    fetchConsoles(creds.username, creds.apiKey).then(setConsoles).catch(() => {});
  }, []);

  useEffect(() => {
    function onPop() {
      const p = new URLSearchParams(window.location.search);
      const id = p.get('id');
      window.scrollTo(0, 0);
      setConsoleId(id ? Number(id) : null);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const consoleName = consoles?.find(c => c.id === consoleId)?.name || null;

  function selectConsole(id) {
    const sp = new URLSearchParams(window.location.search); // preserve group param
    sp.set('id', id);
    sp.delete('ach'); // reset ach filter for new console
    history.pushState(null, '', '?' + sp.toString());
    window.scrollTo(0, 0);
    setConsoleId(id);
  }

  function goBack() {
    const sp = new URLSearchParams(window.location.search); // preserve group param
    sp.delete('id');
    sp.delete('ach');
    const qs = sp.toString();
    history.pushState(null, '', qs ? '?' + qs : window.location.pathname);
    window.scrollTo(0, 0);
    setConsoleId(null);
  }

  if (consoleId) {
    return <GameListView consoleId={consoleId} consoleName={consoleName} onBack={goBack} />;
  }
  return <ConsoleListView onSelect={selectConsole} />;
}

createRoot(document.getElementById('root')).render(<ConsoleApp />);
