#!/usr/bin/env node
/**
 * Generates / updates game/data/poc-pokemon.json — the static reference data
 * (evolution method, wild locations, breeding info) backing the Professor Oak
 * Challenge tab on the game page.
 *
 * Dev script — not part of the app. No dependencies (uses global fetch, Node 18+).
 * See docs/poc-data-generation.md for the full walkthrough.
 *
 * Run:
 *   RA_USERNAME=you RA_API_KEY=yourkey node scripts/poc-data-gen.js \
 *     --subset 22862:heartgold --subset 22693:soulsilver
 *
 * Each --subset is RA_GAME_ID:POKEAPI_VERSION_SLUG. POKEAPI_VERSION_SLUG must
 * match a "version" name in PokeAPI (e.g. heartgold, soulsilver, emerald,
 * firered, platinum — see https://pokeapi.co/api/v2/version/).
 *
 * Options (env vars):
 *   RA_USERNAME, RA_API_KEY   RetroAchievements credentials (required)
 *
 * Options (flags):
 *   --subset ID:VERSION   repeatable, required
 *   --output PATH         default: game/data/poc-pokemon.json
 */

const fs   = require('fs');
const path = require('path');

const RA_API_BASE   = 'https://retroachievements.org/API';
const POKEAPI_BASE  = 'https://pokeapi.co/api/v2';

// ── Step 1: achievement text parsing ────────────────────────────────────────
// Mirrors the regexes in game/utils/poc.js. If a new subset uses wording that
// doesn't match any of these, add a pattern here AND to poc.js — they must
// stay in sync since poc.js does this same classification at runtime.

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
// exact lookup as a last resort. Must mirror game/utils/poc.js's
// KNOWN_CHOICE_GROUPS.
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

// Baby Pokémon that PokeAPI shows as having no wild encounters AND no
// evolves_from_species (they're the root of their family) — these are bred,
// some requiring a held Incense item. Extend as new baby species show up.
const BREEDING_FALLBACK = {
  'Cleffa':    'Breed a Clefairy or Clefable',
  'Igglybuff': 'Breed a Jigglypuff or Wigglytuff',
  'Pichu':     'Breed a Pikachu or Raichu',
  'Elekid':    'Breed an Electabuzz',
  'Magby':     'Breed a Magmar',
  'Smoochum':  'Breed a Jynx',
  'Wynaut':    'Breed a Wobbuffet',
  'Bonsly':    'Breed a Sudowoodo holding a Rock Incense',
  'Mime Jr.':  'Breed a Mr. Mime holding an Odd Incense',
  'Munchlax':  'Breed a Snorlax holding a Full Incense',
  'Happiny':   'Breed a Chansey holding a Luck Incense',
  'Mantyke':   'Breed a Mantine holding a Sea Incense',
};

// Known alternate spellings across differently-authored subsets / typos in
// achievement text -> canonical display name used as the JSON key.
const CANON_OVERRIDES = {
  'Nidoran♀': 'Nidoran-F', 'Nidoran F': 'Nidoran-F', 'NidoranF': 'Nidoran-F', 'Nidoran Female': 'Nidoran-F',
  'Nidoran♂': 'Nidoran-M', 'Nidoran M': 'Nidoran-M', 'NidoranM': 'Nidoran-M', 'Nidoran Male': 'Nidoran-M',
  'Mr Mime': 'Mr. Mime', 'Mr.Mime': 'Mr. Mime',
  'Mime Jr': 'Mime Jr.',
};
const SLUG_OVERRIDES = {
  'Nidoran-F': 'nidoran-f', 'Nidoran-M': 'nidoran-m',
  'Mr. Mime': 'mr-mime', 'Mime Jr.': 'mime-jr',
  "Farfetch'd": 'farfetchd', 'Ho-Oh': 'ho-oh',
};
// PokeAPI's /pokemon/{slug}/encounters needs the specific form slug for a few
// species whose "default" form isn't the bare species name.
const ENCOUNTER_SLUG_OVERRIDES = {
  wormadam: 'wormadam-plant',
};
function classify(ach) {
  const { Title: title, Description: desc } = ach;
  const target = extractTarget(desc);
  if (target !== null) {
    return { kind: 'marker', target, speciesName: extractMarkerSpecies(desc) };
  }
  if (KNOWN_CHOICE_GROUPS[title]) {
    return { kind: 'species', names: KNOWN_CHOICE_GROUPS[title] };
  }
  for (const p of SPECIES_PATTERNS) {
    const m = desc.match(p);
    if (m) return { kind: 'species', names: splitSpeciesList(m[1].trim()) };
  }
  if (looksLikeSpeciesList(title)) {
    return { kind: 'species', names: splitSpeciesList(title) };
  }
  return { kind: 'unknown' };
}

function slugify(name) {
  if (SLUG_OVERRIDES[name]) return SLUG_OVERRIDES[name];
  return name.toLowerCase().replace(/['.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function fetchJson(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'cheevo-tracker-poc-datagen/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === retries - 1) return { __error__: String(e), __url__: url };
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

async function fetchAll(urlsByKey, concurrency = 12) {
  const entries = Object.entries(urlsByKey);
  const out = {};
  let i = 0;
  async function worker() {
    while (i < entries.length) {
      const idx = i++;
      const [key, url] = entries[idx];
      out[key] = await fetchJson(url);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

// ── Step 2: distillation (evolution + locations) ────────────────────────────

const LOCATION_LABELS = {
  'national-park-area': 'National Park', 'ilex-forest-area': 'Ilex Forest',
  'viridian-forest-area': 'Viridian Forest', 'ruins-of-alph-outside': 'Ruins of Alph',
  'embedded-tower-groundon-room': 'Embedded Tower Groudon Room', // PokeAPI's own slug misspells Groudon
};
const METHOD_LABELS = {
  walk: 'grass', surf: 'surf', 'old-rod': 'old rod', 'good-rod': 'good rod',
  'super-rod': 'super rod', 'rock-smash': 'rock smash', headbutt: 'headbutt',
  'headbutt-low': 'headbutt', 'headbutt-high': 'headbutt', gift: 'gift',
  'only-one': 'gift', 'gift-egg': 'egg gift',
};

function humanizeLocation(slug) {
  if (LOCATION_LABELS[slug]) return LOCATION_LABELS[slug];
  const s = slug.replace(/-area$/, '');
  const m = s.match(/^(johto|kanto)-route-(\d+)(?:-(.+))?$/);
  if (m) {
    const prefix = m[1] === 'kanto' ? 'Kanto Route' : 'Route';
    return `${prefix} ${m[2]}` + (m[3] ? ` (${m[3].replace(/-/g, ' ')})` : '');
  }
  return titleCase(s.replace(/-/g, ' '));
}

function distillLocations(encounters, versionNames) {
  if (!Array.isArray(encounters)) return {};
  const byVersion = Object.fromEntries(versionNames.map(v => [v, {}]));
  for (const entry of encounters) {
    const area = entry.location_area.name;
    if (area.startsWith('unknown')) continue;
    for (const vd of entry.version_details || []) {
      const vname = vd.version.name;
      if (!(vname in byVersion)) continue;
      const methods = new Set((vd.encounter_details || []).map(ed => METHOD_LABELS[ed.method.name] || ed.method.name.replace(/-/g, ' ')));
      const label = humanizeLocation(area);
      if (!byVersion[vname][label]) byVersion[vname][label] = new Set();
      for (const m of methods) byVersion[vname][label].add(m);
    }
  }
  const result = {};
  for (const [vname, areas] of Object.entries(byVersion)) {
    const labels = Object.keys(areas);
    if (!labels.length) continue;
    result[vname] = labels
      .map(label => { const m = [...areas[label]].sort(); return m.length ? `${label} (${m.join('/')})` : label; })
      .slice(0, 6);
  }
  return result;
}

function fmtEvoDetail(d) {
  const trigger = d.trigger?.name;
  if (trigger === 'level-up') {
    let s;
    if (d.min_level) s = `Level ${d.min_level}`;
    else if (d.min_happiness) s = 'High friendship';
    else if (d.known_move_type) s = `Level up knowing a ${titleCase(d.known_move_type.name)}-type move`;
    else if (d.known_move) s = `Level up knowing ${titleCase(d.known_move.name.replace(/-/g, ' '))}`;
    else if (d.location) s = `Level up at ${titleCase(d.location.name.replace(/-/g, ' '))}`;
    else s = 'Level up';
    const extra = [];
    if (d.time_of_day) extra.push(d.time_of_day);
    if (d.min_beauty) extra.push('high beauty');
    if (d.relative_physical_stats != null) {
      extra.push(d.relative_physical_stats === 1 ? 'Atk>Def' : d.relative_physical_stats === -1 ? 'Atk<Def' : 'Atk=Def');
    }
    return s + (extra.length ? ` (${extra.join(', ')})` : '');
  }
  if (trigger === 'trade') {
    if (d.held_item) return `Trade holding ${titleCase(d.held_item.name.replace(/-/g, ' '))}`;
    if (d.trade_species) return `Trade for ${titleCase(d.trade_species.name.replace(/-/g, ' '))}`;
    return 'Trade';
  }
  if (trigger === 'use-item') return `Use a ${titleCase((d.item?.name || '').replace(/-/g, ' '))}`;
  if (trigger === 'shed') return 'Level up with a free party slot & spare Poké Ball';
  return trigger ? titleCase(trigger.replace(/-/g, ' ')) : 'Special method';
}
function titleCase(s) { return s.replace(/(^|[^a-zA-Z])([a-z])/g, (_, pre, c) => pre + c.toUpperCase()); }

function buildEvoMap(chainsRaw) {
  const childEvo = {}; // childSlug -> [{ from: parentSlug, details: [...] }]
  function walk(node) {
    const parent = node.species.name;
    for (const child of node.evolves_to || []) {
      const key = child.species.name;
      (childEvo[key] ||= []).push({ from: parent, details: child.evolution_details || [] });
      walk(child);
    }
  }
  for (const data of Object.values(chainsRaw)) {
    if (data && data.chain) walk(data.chain);
  }
  return childEvo;
}

// ── Orchestration ────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = { subsets: [], output: 'game/data/poc-pokemon.json' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--subset') out.subsets.push(argv[++i]);
    else if (argv[i] === '--output') out.output = argv[++i];
  }
  return out;
}

async function main() {
  const { subsets: subsetArgs, output } = parseArgs(process.argv.slice(2));
  if (!subsetArgs.length) {
    console.error('Usage: node scripts/poc-data-gen.js --subset ID:version [--subset ID:version ...] [--output path]');
    process.exit(1);
  }
  const { RA_USERNAME, RA_API_KEY } = process.env;
  if (!RA_USERNAME || !RA_API_KEY) {
    console.error('Set RA_USERNAME and RA_API_KEY (e.g. `set -a; source .env; set +a` first).');
    process.exit(1);
  }

  const subsets = subsetArgs.map(s => { const [id, version] = s.split(':'); return { id, version }; });
  const versionNames = subsets.map(s => s.version);

  console.error('Fetching RA achievement data...');
  const allRawNames = new Set();
  const unknowns = [];
  for (const { id } of subsets) {
    const url = `${RA_API_BASE}/API_GetGameExtended.php?i=${id}&z=${RA_USERNAME}&y=${RA_API_KEY}`;
    const data = await fetchJson(url);
    if (data.__error__) { console.error(`  game ${id}: FAILED — ${data.__error__}`); continue; }
    const achievements = Object.values(data.Achievements);
    let speciesCount = 0;
    for (const a of [...achievements].sort((x, y) => x.ID - y.ID)) {
      const c = classify(a);
      if (c.kind === 'species') { c.names.forEach(n => allRawNames.add(n)); speciesCount++; }
      else if (c.kind === 'marker' && c.speciesName) { allRawNames.add(c.speciesName); speciesCount++; }
      else if (c.kind === 'unknown') unknowns.push([a.Title, a.Description]);
    }
    console.error(`  game ${id}: ${achievements.length} achievements, ${speciesCount} species entries`);
  }

  if (unknowns.length) {
    console.error(`\n⚠ ${unknowns.length} achievements did not match any known pattern — add a regex to `
      + `MARKER_PATTERNS/SPECIES_PATTERNS in this script AND game/utils/poc.js:`);
    unknowns.slice(0, 20).forEach(([t, d]) => console.error(`    ${JSON.stringify(t)} | ${JSON.stringify(d)}`));
  }

  const canonMap = {};
  for (const n of allRawNames) canonMap[n] = CANON_OVERRIDES[n] || n;
  const canonicalNames = [...new Set(Object.values(canonMap))].sort();
  const canonToSlug = Object.fromEntries(canonicalNames.map(n => [n, slugify(n)]));
  console.error(`${canonicalNames.length} unique species to fetch from PokeAPI`);

  console.error('Fetching PokeAPI species + encounter data...');
  const slugs = Object.values(canonToSlug);
  const speciesRaw = await fetchAll(Object.fromEntries(slugs.map(s => [s, `${POKEAPI_BASE}/pokemon-species/${s}`])));
  const encountersRaw = await fetchAll(Object.fromEntries(slugs.map(s => [s, `${POKEAPI_BASE}/pokemon/${ENCOUNTER_SLUG_OVERRIDES[s] || s}/encounters`])));

  const fetchErrors = [...slugs].filter(s => speciesRaw[s]?.__error__ || encountersRaw[s]?.__error__);
  if (fetchErrors.length) {
    console.error(`⚠ PokeAPI fetch errors for: ${fetchErrors.join(', ')} — check slug spelling (e.g. gendered/regional forms)`);
  }

  const chainUrls = {};
  for (const d of Object.values(speciesRaw)) {
    if (d?.evolution_chain?.url) chainUrls[d.evolution_chain.url] = d.evolution_chain.url;
  }
  console.error(`Fetching ${Object.keys(chainUrls).length} evolution chains...`);
  const chainsRaw = await fetchAll(chainUrls);
  const childEvo = buildEvoMap(chainsRaw);

  const slugToCanon = Object.fromEntries(Object.entries(canonToSlug).map(([n, s]) => [s, n]));
  const reference = {};
  for (const [name, slug] of Object.entries(canonToSlug).sort()) {
    const sdata = speciesRaw[slug];
    const entry = {};
    const evolvesFrom = sdata?.evolves_from_species;
    if (evolvesFrom) {
      const parentSlug = evolvesFrom.name;
      const match = (childEvo[slug] || []).find(d => d.from === parentSlug && d.details.length);
      if (match) {
        entry.evolvesFrom = slugToCanon[parentSlug] || titleCase(parentSlug);
        entry.evolveMethod = fmtEvoDetail(match.details[0]);
      }
    }
    if (sdata?.is_legendary) entry.legendary = true;
    if (sdata?.is_mythical) entry.mythical = true;
    const locs = distillLocations(encountersRaw[slug], versionNames);
    if (Object.keys(locs).length) entry.locations = locs;
    if (BREEDING_FALLBACK[name]) entry.breeding = BREEDING_FALLBACK[name];
    reference[name] = entry;
  }

  const unresolved = Object.entries(reference).filter(([, e]) => Object.keys(e).length === 0).map(([n]) => n);
  if (unresolved.length) {
    console.error(`\n⚠ ${unresolved.length} species have NO evolution/location/breeding/legendary data — `
      + `review manually (event-only Pokémon, fossils, gifts PokeAPI doesn't track, etc):`);
    unresolved.forEach(n => console.error(`    ${n}`));
  }

  for (const [raw, canon] of Object.entries(canonMap)) {
    if (raw !== canon && !(raw in reference) && canon in reference) reference[raw] = reference[canon];
  }

  let existing = {};
  const outPath = path.resolve(output);
  if (fs.existsSync(outPath)) existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const merged = { ...existing, ...reference };

  const sorted = Object.fromEntries(Object.keys(merged).sort().map(k => [k, merged[k]]));
  fs.writeFileSync(outPath, JSON.stringify(sorted, null, 2) + '\n');
  console.error(`\nWrote ${Object.keys(sorted).length} total entries (${Object.keys(reference).length} from this run) to ${output}`);
  console.error('\nNext steps:');
  console.error('  1. Add the new subset(s) to POC_SUBSETS in game/utils/poc.js');
  console.error('  2. Review any ⚠ warnings above');
  console.error('  3. Load the game page and sanity-check a handful of entries');
}

main().catch(e => { console.error(e); process.exit(1); });
