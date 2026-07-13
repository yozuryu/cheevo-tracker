# Professor Oak Challenge — Adding a New Game

How to extend the Professor Oak Challenge (POC) guide (game page → **Professor Oak** tab) to a new Pokémon game. Read [`docs/pages/game.md`](pages/game.md#professor-oak-challenge-tab) first for how the feature works at runtime — this doc is only about generating the data for a new game.

## Overview

Three things make a POC subset work in the app, and only the first two need new work per game:

1. **`POC_GAMES` entry** (`game/utils/poc.js`) — registers the subset(s) under their parent game's RA ID. The tab shows up on each subset's *own* page (e.g. `game/?id=22862`), not the parent's.
2. **Reference data** (`game/data/poc-pokemon.json`) — evolution/location/breeding hints per species, generated from PokeAPI.
3. **Checkpoint parsing** (`game/utils/poc.js` — `classifyPocAchievement` / `buildPocCheckpoints`) — already generic, driven by achievement text patterns. You only touch this if the new subset uses wording that doesn't match the existing patterns (see "If parsing fails" below).

## Step 1 — Find the subset's RA game ID(s)

RA represents a POC challenge as a separate **subset game**, not a tag on the main game. Search RA (or Google, since RA's site blocks non-browser fetches) for `"<Game Name>" "Professor Oak Challenge" retroachievements`. You want the subset's own numeric game ID, e.g.:

- `retroachievements.org/game/22862` → "Pokémon HeartGold Version [Subset - Professor Oak Challenge]"

Note the **parent** game's ID too (the page you land on when browsing the game normally) — `POC_GAMES` is keyed by it, even though the tab itself renders on the subset's page.

## Step 2 — Find the matching PokeAPI version slug

The reference data needs to know which PokeAPI "version" the subset corresponds to, for encounter-location lookups. Check `https://pokeapi.co/api/v2/version/` — common ones: `red`, `blue`, `yellow`, `gold`, `silver`, `crystal`, `ruby`, `sapphire`, `emerald`, `firered`, `leafgreen`, `diamond`, `pearl`, `platinum`, `heartgold`, `soulsilver`, `black`, `white`.

## Step 3 — Run the generator

```bash
set -a; source .env; set +a   # loads RA_USERNAME / RA_API_KEY
node scripts/poc-data-gen.js --subset <RA_GAME_ID>:<pokeapi-version-slug> [--subset ...]
```

Pass one `--subset` per version in the challenge (e.g. both HeartGold and SoulSilver in one run, or just one if the game doesn't have a paired version). The script:

1. Fetches the subset's full achievement list from the RA API (`API_GetGameExtended`).
2. Parses every achievement's `Title`/`Description` into either a **checkpoint marker** (identified by a target Pokédex count embedded anywhere in the description — `NUMERIC_TARGET_PATTERNS`) or a **species catch** requirement (`SPECIES_PATTERNS`, falling back to `KNOWN_CHOICE_GROUPS` or a title-looks-like-a-species-list heuristic when the description alone doesn't name real Pokémon).
3. Fetches each unique species from PokeAPI (species info, wild encounters filtered to the given version(s), evolution chain).
4. Distills that into `evolvesFrom`/`evolveMethod`, `locations`, `breeding`, or `legendary`/`mythical` fields.
5. **Merges** the result into the existing `game/data/poc-pokemon.json` (doesn't clobber species from other games already in the file) and writes it back, sorted.

It prints warnings for anything that needs a human look — read them before moving on:

- **Unmatched achievement text** — a new subset author phrased something the regexes don't recognize. Add a pattern to `NUMERIC_TARGET_PATTERNS`/`MARKER_SPECIES_PATTERNS`/`SPECIES_PATTERNS` in `scripts/poc-data-gen.js` **and** the identical patterns in `game/utils/poc.js` (they must stay in sync — the script only generates data, `poc.js` does this same classification live at runtime). Five different subset authors (HeartGold, SoulSilver, Red, Blue, Yellow) are already covered, each with their own quirks — check `poc.js`'s pattern comments for real examples before assuming you need a brand new pattern; a small tweak to an existing one often covers it.
- **PokeAPI fetch errors** — usually a slug mismatch. Check `ENCOUNTER_SLUG_OVERRIDES` if a species has an unusual default form (e.g. `wormadam` needs `wormadam-plant` for the encounters endpoint specifically, even though the plain slug works for species/evolution data).
- **Species with no evolution/location/breeding/legendary data** — event-only Pokémon, fossils, or gifts PokeAPI doesn't track as an "encounter". Decide case by case:
  - If it's a starter-choice or literal placeholder achievement (e.g. "Evolve your starter"), no data is needed — `poc.js` already falls back to the achievement's own description text at runtime.
  - If it's a real gift/static encounter PokeAPI is simply missing, look it up manually and either extend `BREEDING_FALLBACK`-style special-casing in the script, or patch the generated JSON entry by hand afterward (document why, in a commit message — don't silently hand-edit without a trace).

## Step 4 — Wire up `POC_GAMES`

Add the parent game ID → subset(s) mapping in `game/utils/poc.js`:

```js
export const POC_GAMES = {
  '7212': { // Pokémon HeartGold Version | Pokémon SoulSilver Version
    subsets: [
      { id: 22862, label: 'HeartGold', version: 'heartgold' },
      { id: 22693, label: 'SoulSilver', version: 'soulsilver' },
    ],
  },
  '<new-parent-id>': {
    subsets: [
      { id: <subset-id>, label: '<Version Label>', version: '<pokeapi-version-slug>' },
    ],
  },
};
```

`version` must match what you passed to `--subset` in Step 3 — it's the key used to look up `locations` in the reference data at runtime. `label` is shown on the sibling-version links when a parent has more than one subset.

## Step 5 — Verify in the browser

Start a static server from the repo root (`python3 -m http.server 8934`) and open `game/?id=<subset-id>&tab=poc` — the **subset's** own ID, not the parent's. Check:

- The checkpoint accordion renders, and (if there's a sibling subset) an "Also see" link to it appears.
- The currently-active checkpoint auto-expands.
- A few locked species show sensible location/evolution hints — spot-check against your own game knowledge, since the data is API-sourced but summarized/formatted by the script.
- Species with no structured hint fall back to readable achievement description text (not a blank line).

## Things that don't generalize automatically

A few pieces of `scripts/poc-data-gen.js` are Gen1/Johto/Kanto-specific and need extending for other regions:

- **`KNOWN_CHOICE_GROUPS`** — exact-title lookup for achievements that never name a real Pokémon in either title or description (SoulSilver's generic "Starter Evolved" label, Red's "Choose your Eeveelution"). Most subset authors DO put species names in the title or description somewhere — `looksLikeSpeciesList()` (title-based) and the `SPECIES_PATTERNS` regexes (description-based) catch those automatically. Only add a `KNOWN_CHOICE_GROUPS` entry when neither resolves it. Must stay in sync with the identical table in `game/utils/poc.js`.
- **`BREEDING_FALLBACK`** — baby Pokémon with no wild encounters and no `evolves_from_species` in PokeAPI (they're bred). The current list covers Gen 2–4 babies relevant to Johto/Kanto; a different region may introduce others (or none, if the new game doesn't reach that part of the Pokédex).
- **`CANON_OVERRIDES` / `SLUG_OVERRIDES`** — species names with special characters (gender symbols, apostrophes, periods) or spelling variants across differently-authored subsets. The script's `unresolved`/`unknowns` warnings will surface anything new automatically; add overrides as needed rather than guessing ahead of time.
