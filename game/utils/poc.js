// Professor Oak Challenge — parsing helpers for RA's POC subset achievement sets.
//
// POC subsets are authored by different community members with different wording,
// so achievement text is matched against multiple known phrasings. Grouping into
// checkpoints relies only on achievement ID order + the "N pokemon caught" targets
// embedded in each checkpoint-clear achievement — never on hardcoded species lists,
// so this keeps working if RA authors add/reorder achievements.

// Each POC subset is its own RA game ID with its own achievement set — the tab
// shows up when browsing the SUBSET's page directly (e.g. game/?id=22862),
// not the parent game's page. `parentId` is only used for a link back to the
// base game; `siblings` (other subsets under the same parent) power the
// version switcher.
export const POC_GAMES = {
  '7212': { // Pokémon HeartGold Version | Pokémon SoulSilver Version
    subsets: [
      { id: 22862, label: 'HeartGold', version: 'heartgold' },
      { id: 22693, label: 'SoulSilver', version: 'soulsilver' },
    ],
  },
  '724': { // Pokémon Red Version | Pokémon Blue Version
    subsets: [
      { id: 16084, label: 'Red', version: 'red' },
      { id: 29295, label: 'Blue', version: 'blue' },
    ],
  },
  '723': { // Pokémon Yellow Version: Special Pikachu Edition
    subsets: [
      { id: 22851, label: 'Yellow', version: 'yellow' },
    ],
  },
};

// Looks up POC info for the game currently being viewed. Returns null if this
// game ID isn't a known POC subset.
export function findPocSubset(gameId) {
  for (const [parentId, group] of Object.entries(POC_GAMES)) {
    const subset = group.subsets.find(s => String(s.id) === String(gameId));
    if (subset) return { parentId, ...subset, siblings: group.subsets.filter(s => s.id !== subset.id) };
  }
  return null;
}

// A checkpoint-clear achievement always embeds the target Pokédex count
// somewhere in its description — the exact wording varies a lot by author.
const NUMERIC_TARGET_PATTERNS = [
  /(\d+)\s+pok[ée]mon\s+caught\b/i,                                    // "Defeat Falkner with 41 pokemon caught"
  /\ball\s+(\d+)\s*(?:other\s+)?(?:possible|available)\s*pok[ée]mon\b/i, // "while having all 43 available Pokemon" / "with all 122 possible Pokemon"
  /\ball\s+(\d+)\s*pok[ée]mon\s+(?:available|obtained|caught)\b/i,     // "with all 126 Pokemon available"
];
function extractTarget(description) {
  for (const p of NUMERIC_TARGET_PATTERNS) {
    const m = description.match(p);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

// A marker achievement occasionally ALSO names the species it catches (e.g. a
// legendary finale with no separate catch achievement of its own) — "Capture
// X ..." / "Obtain X ..." (but not "Obtain the X Badge...", which names a
// badge, not a species — excluded via the negative lookahead).
const MARKER_SPECIES_PATTERNS = [
  /^Capture (.+?)(?:\s+with\s+|\s+after\s+|\s+while\s+|$)/i,
  /^Obtain (?!the\b)(.+?)(?:\s+with\s+|\s+after\s+|\s+while\s+|$)/i,
];
function extractMarkerSpecies(description) {
  for (const p of MARKER_SPECIES_PATTERNS) {
    const m = description.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

const SPECIES_PATTERNS = [
  /^Register (.+?)(?: as obtained| in your)/i,                                                          // "Register Pidgey as obtained in your Pokédex before ..."
  /^Select (.+?) as your starter Pokemon/i,                                                              // "Select Charmander, Bulbasaur, or Squirtle as your starter Pokemon."
  /^Choose (?:either )?(.+?) as your prize/i,                                                            // "Choose either Hitmonlee or Hitmonchan as your prize"
  /^Obtain (?:your starter |either |one of the following:?\s*)?(.+?)(?:\s*\[.*?\])?(?:\s+before\s+|\s+after\s+|$)/i, // "Obtain Caterpie" / "Obtain your starter Pikachu before ..." / "Obtain one of the following Nidoking, ..."
];

// A handful of achievements never name a real species in either title or
// description text we can regex ("Choose your Eeveelution", SoulSilver's
// generic "Starter Evolved" label) — the title is the only signal, via an
// exact lookup as a last resort.
const KNOWN_CHOICE_GROUPS = {
  'Starter':         ['Chikorita', 'Cyndaquil', 'Totodile'],
  'Starter Evolved': ['Bayleef', 'Quilava', 'Croconaw'],
  'Starter Final':   ['Meganium', 'Typhlosion', 'Feraligatr'],
  'Kanto Starter':   ['Bulbasaur', 'Charmander', 'Squirtle'],
  'Kanto Evolved':   ['Ivysaur', 'Charmeleon', 'Wartortle'],
  'Kanto Final':     ['Venusaur', 'Charizard', 'Blastoise'],
  'Hoenn Starter':   ['Treecko', 'Torchic', 'Mudkip'],
  'Hoenn Evolved':   ['Grovyle', 'Combusken', 'Marshtomp'],
  'Hoenn Final':     ['Sceptile', 'Blaziken', 'Swampert'],
  'Eeveelution':     ['Vaporeon', 'Jolteon', 'Flareon'],
};

// "X, Y, or Z" / "X, Y or Z" / "X or Y" — handles both Oxford-comma and
// bare-comma multi-choice phrasing without leaving a stray "or " fragment.
const SPECIES_SPLIT_RE = /\s*,\s*(?:or\s+)?|\s+or\s+/i;
function splitSpeciesList(raw) {
  return raw.split(SPECIES_SPLIT_RE).map(s => s.trim()).filter(Boolean);
}

// Last-resort fallback: some authors put the real species names directly in
// the achievement TITLE with a generic description (e.g. Red's title
// "Charmander, Bulbasaur or Squirtle" / desc "Choose your starter"). Guards
// against false positives on ordinary Title Case achievement names.
function looksLikeSpeciesList(title) {
  if (!/,| or /i.test(title)) return false;
  const parts = splitSpeciesList(title);
  if (parts.length < 2 || parts.length > 3) return false;
  return parts.every(p => p.length <= 15 && /^[A-ZÉ][a-zé''.\- ♀♂]*$/.test(p));
}

export function classifyPocAchievement(ach) {
  const { title, description } = ach;
  const target = extractTarget(description);
  if (target !== null) {
    return { kind: 'marker', target, speciesName: extractMarkerSpecies(description) };
  }
  if (KNOWN_CHOICE_GROUPS[title]) {
    const names = KNOWN_CHOICE_GROUPS[title];
    return { kind: 'species', names, isChoice: names.length > 1 };
  }
  for (const p of SPECIES_PATTERNS) {
    const m = description.match(p);
    if (m) {
      const names = splitSpeciesList(m[1].trim());
      return { kind: 'species', names, isChoice: names.length > 1 };
    }
  }
  if (looksLikeSpeciesList(title)) {
    const names = splitSpeciesList(title);
    return { kind: 'species', names, isChoice: true };
  }
  return { kind: 'unknown' };
}

// Groups achievements into ordered checkpoints. A "marker" achievement (the gym/
// checkpoint-clear achievement) closes out every species-catch achievement that
// precedes it in ID order; anything after the last marker becomes a trailing
// "Finale" checkpoint (used by sets that don't gate the last legendary behind a marker).
export function buildPocCheckpoints(achievements) {
  const items = [...achievements].sort((a, b) => a.id - b.id);
  const classified = items.map(a => ({ ach: a, c: classifyPocAchievement(a) }));

  const markers = classified
    .filter(x => x.c.kind === 'marker')
    .map(x => ({ id: x.ach.id, markerAch: x.ach, leader: x.ach.title, target: x.c.target, speciesName: x.c.speciesName, entries: [] }));

  const trailing = [];
  for (const { ach, c } of classified) {
    if (c.kind !== 'species') continue;
    const marker = markers.find(m => m.id > ach.id);
    const entry = { ach, names: c.names, isChoice: c.isChoice };
    (marker ? marker.entries : trailing).push(entry);
  }
  // A "Capture X" marker also catches its own species — append it last since
  // it's cleared at/after every other catch for that checkpoint.
  for (const m of markers) {
    if (m.speciesName) m.entries.push({ ach: m.markerAch, names: [m.speciesName], isChoice: false });
  }

  const checkpoints = markers.map((m, i) => ({
    key: `cp-${i}`,
    leader: m.leader,
    title: m.markerAch.title,
    target: m.target,
    markerAch: m.markerAch,
    entries: m.entries,
  }));
  if (trailing.length) {
    checkpoints.push({
      key: 'cp-final',
      leader: 'Finale',
      title: 'Finale',
      target: null,
      markerAch: null,
      entries: trailing,
    });
  }
  return checkpoints;
}
