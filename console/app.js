import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Gamepad2, ChevronRight, Search, X, ArrowLeft } from 'lucide-react';
import { parseTitle, getMediaUrl } from '../profile/utils/helpers.js';
import { getCredentials, clearCredentials, fetchConsoles, fetchConsoleGames } from '../profile/utils/ra-api.js';
import { Topbar, Footer } from '../assets/ui.js';

function handleAuthError() {
  clearCredentials();
  window.location.replace('../');
}

// ── Grouping maps ─────────────────────────────────────────────────────────────

// Publisher detection by console name — keyword-based so new consoles auto-categorise.
function getPublisher(name) {
  const n = name.toLowerCase();
  if (/nintendo|famicom|\bnes\b|\bsnes\b|game boy|gameboy|gamecube|\bwii\b|nintendo 64|\bn64\b|virtual boy|pokemon mini|game & watch|nintendo ds|\b3ds\b/.test(n)) return 'Nintendo';
  if (/playstation|\bpsp\b|ps vita|\bvita\b/.test(n)) return 'Sony';
  if (/\bsega\b|mega drive|genesis|master system|game gear|\bsaturn\b|dreamcast|sg-1000|sega cd|sega 32x/.test(n)) return 'Sega';
  if (/\batari\b|\bjaguar\b|\blynx\b/.test(n)) return 'Atari';
  if (/neo.?geo|\bsnk\b/.test(n)) return 'SNK';
  if (/pc engine|turbografx|\bpc-fx\b|\bpc-88\b|\bpc-98\b|pc-8000/.test(n)) return 'NEC';
  if (/\bxbox\b/.test(n)) return 'Microsoft';
  if (/wonderswan/.test(n)) return 'Bandai';
  if (/intellivision/.test(n)) return 'Mattel';
  if (/colecovision|coleco/.test(n)) return 'Coleco';
  if (/\barcade\b/.test(n)) return 'Arcade';
  return 'Other';
}

const PUBLISHER_ORDER = [
  'Atari', 'Bandai', 'Coleco', 'Mattel', 'Microsoft',
  'NEC', 'Nintendo', 'Sega', 'SNK', 'Sony', 'Arcade', 'Other',
];

// Era detection by console ID — hardcoded for known systems; unknown IDs fall to 'Other'.
const ERA_MAP = {
  // Pre-8-Bit (before ~1983)
  25: 'Pre-8-Bit', 23: 'Pre-8-Bit', 45: 'Pre-8-Bit',
  44: 'Pre-8-Bit', 46: 'Pre-8-Bit', 72: 'Pre-8-Bit',
  // 8-Bit (~1983–1990)
  7: '8-Bit', 51: '8-Bit', 11: '8-Bit', 33: '8-Bit',
  101: '8-Bit', 4: '8-Bit', 13: '8-Bit',
  // 16-Bit (~1990–1996)
  3: '16-Bit', 1: '16-Bit', 8: '16-Bit', 103: '16-Bit',
  9: '16-Bit', 10: '16-Bit', 16: '16-Bit',
  // 32 / 64-Bit (~1994–2002)
  12: '32 / 64-Bit', 39: '32 / 64-Bit', 2: '32 / 64-Bit',
  15: '32 / 64-Bit', 18: '32 / 64-Bit', 43: '32 / 64-Bit',
  14: '32 / 64-Bit', 49: '32 / 64-Bit', 28: '32 / 64-Bit',
  6: '32 / 64-Bit', 63: '32 / 64-Bit',
  // 6th Gen (~1998–2006)
  40: '6th Gen', 21: '6th Gen', 17: '6th Gen', 22: '6th Gen',
  5: '6th Gen', 56: '6th Gen', 57: '6th Gen', 75: '6th Gen', 24: '6th Gen',
  // 7th Gen (~2004–2013)
  99: '7th Gen', 80: '7th Gen', 69: '7th Gen', 41: '7th Gen', 73: '7th Gen',
  // 8th Gen+ (~2011–)
  87: '8th Gen+', 104: '8th Gen+',
  // Computer
  26: 'Computer', 38: 'Computer', 29: 'Computer', 37: 'Computer', 47: 'Computer',
  // Arcade
  27: 'Arcade',
};

const ERA_ORDER = [
  'Pre-8-Bit', '8-Bit', '16-Bit', '32 / 64-Bit',
  '6th Gen', '7th Gen', '8th Gen+', 'Computer', 'Arcade', 'Other',
];

function getEra(id) {
  return ERA_MAP[id] || 'Other';
}

// Groups an array of consoles into { groupName: [consoles] } preserving defined order.
function groupConsoles(consoles, grouping) {
  if (grouping === 'none') return null;

  const map = {};
  for (const c of consoles) {
    const key = grouping === 'publisher' ? getPublisher(c.name) : getEra(c.id);
    if (!map[key]) map[key] = [];
    map[key].push(c);
  }

  const order = grouping === 'publisher' ? PUBLISHER_ORDER : ERA_ORDER;
  const sorted = [];
  for (const key of order) {
    if (map[key]) sorted.push({ name: key, consoles: map[key] });
  }
  // Anything not in the order list (shouldn't happen with 'Other' fallback, but just in case)
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
  const [grouping, setGrouping] = useState('none');
  const [error, setError]       = useState(null);

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
        <ConsoleCard key={c.id} console={c} onClick={() => onSelect(c.id, c.name)} />
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
            {consoles && <span className="text-[10px] text-[#546270]">{consoles.length} systems</span>}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[9px] text-[#546270] uppercase tracking-wider">Group</span>
            {[
              { value: 'none',      label: 'Default'   },
              { value: 'publisher', label: 'Publisher'  },
              { value: 'era',       label: 'Era'        },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => setGrouping(opt.value)}
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
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8f98a0]">{group.name}</span>
                  <span className="text-[9px] text-[#546270]">{group.consoles.length}</span>
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
  const [games, setGames]   = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError]   = useState(null);

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
    if (!search) return games;
    const q = search.toLowerCase();
    return games.filter(g => g.title.toLowerCase().includes(q));
  }, [games, search]);

  return (
    <div className="min-h-screen bg-[#171a21] flex flex-col">
      <Topbar crumbs={[
        { label: 'Cheevo Tracker', href: '../profile/' },
        { label: 'Consoles', href: '../console/' },
        { label: consoleName || 'Games' },
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
            {games && <span className="text-[10px] text-[#546270] shrink-0">{games.length} games</span>}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
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
              const { baseTitle, tagLabel } = parseTitle(g.title);
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
                      {tagLabel && (
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-[1px] rounded-[2px] border shrink-0"
                          style={{ color: '#8f98a0', borderColor: '#323f4c', background: '#101214' }}>
                          {tagLabel}
                        </span>
                      )}
                    </div>
                    {g.numAchievements > 0 && (
                      <span className="text-[9px] text-[#546270]">{g.numAchievements} achievements · {g.points.toLocaleString()} pts</span>
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
            {filtered.length} of {games.length} games
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
  const [consoleName, setConsoleName] = useState(params.get('name') || null);

  useEffect(() => {
    function onPop() {
      const p = new URLSearchParams(window.location.search);
      const id = p.get('id');
      setConsoleId(id ? Number(id) : null);
      setConsoleName(p.get('name') || null);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function selectConsole(id, name) {
    const sp = new URLSearchParams();
    sp.set('id', id);
    sp.set('name', name);
    history.pushState(null, '', '?' + sp.toString());
    setConsoleId(id);
    setConsoleName(name);
  }

  function goBack() {
    history.pushState(null, '', window.location.pathname);
    setConsoleId(null);
    setConsoleName(null);
  }

  if (consoleId) {
    return <GameListView consoleId={consoleId} consoleName={consoleName} onBack={goBack} />;
  }
  return <ConsoleListView onSelect={selectConsole} />;
}

createRoot(document.getElementById('root')).render(<ConsoleApp />);
