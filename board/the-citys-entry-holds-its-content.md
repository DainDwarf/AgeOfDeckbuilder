# The city's entry holds its content

**Line:** the city's sight, how far out from its tile the settle holds, and the idle inhabitants it opens with are three fields of the catalogue's city entry, read by the rules through it, with today's numbers in both catalogues — two, one ring, two — so no chronicle plays differently; `src/rules/sight.ts` and `src/rules/city.ts` hold no constant for any of the three.

**Spec:** `docs/CHRONICLE.md` → _Sight_ (the sentence "Sight is a unit's stat…"), _Population_ (the settle sentence), _The map_ (the paragraph "The city stands on the one tile it settled…").

The three fields, as the spec reads them:

- **Sight.** The city sees over the ground as a unit does, and how far is its content's number.
- **What the settle holds.** The settle holds the city's tile and every tile within so many of it, on the map; that count of rings is content — none for a city that holds its tile alone. The border grows from there by claims, and the culture threshold counts the tiles claimed past what the settle held.
- **Idle inhabitants.** The settle puts an inhabitant on each tile it holds, the city's own first, and the chronicle opens with so many idle besides; that number is content.

Sentences to change in `docs/CHRONICLE.md`:

- _Sight_: replace "**Sight is a unit's stat**, how far in tiles it sees, and the city has a sight of its own. 🔧 A worker and a warrior see two tiles, and so does the city." with "**Sight is a unit's stat**, how far in tiles it sees, and the city has a sight of its own, a number on its content. 🔧 A worker and a warrior see two tiles, and so does the city."
- _Population_: replace "🔧 The settle assigns one inhabitant to the tile the city stands on, and the rest the chronicle opens with are idle; how many is content." with "The settle puts an inhabitant on each tile it holds, the city's own first, and the rest the chronicle opens with are idle; how many idle is content. 🔧 Two."
- _The map_: replace "The city stands on the one tile it settled and holds that tile alone; every tile more is claimed." with "The city stands on the tile it settled and holds, with it, every tile within so many of it as its content names — none for a city holding its tile alone; 🔧 the stand-in's holds the six around it. Every tile more is claimed."

No player-facing text changes.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

- In: the three fields on `Catalogue['city']`, both catalogues declaring `sight: 2`, one ring held, `idle: 2`; the sight function reading the city's sight off the catalogue; the founding reading the rings and the idle count off it, the tiles it holds being those within that many of the city's tile that the map has; the culture threshold counting claims past the tiles the founding held, from the same list; the docs edits above; the tests below.
- Out: where the city settles — the founding still takes the centre tile, and turn 0 is the next line; the settle card; any change to what a chronicle opens with in play.
- Corner cases decided here: a ring tile off the map is not held, so the founding may hold fewer than the full rings and the threshold counts what it held, never the formula; a ring tile with a camp in its slot is held all the same today, exactly as today's founding holds whatever surrounds the centre — the camps keep four from the centre and the ring reaches one, so it does not arise, and no rule is written for it; every held tile takes an inhabitant, the city's own first, while the population lasts, and the population is the held count plus the idle content, so it always lasts.

**Traps:**

- `founding()` in `src/rules/city.ts` takes no arguments today and is spread into the chronicle by `beginChronicle`; it needs the catalogue and the tile, and the next line calls it from the settle's effect, so its signature is `founding(catalogue, at)` and it answers `held`, `assigned` and `population` as now.
- `cultureThreshold` reads `FOUNDING_HELD.length` today; it becomes a function of the catalogue and the chronicle, so `tileCost` and `claim` thread the catalogue through — `claim` already has it, `tileCost` gains it, and `src/ui/chronicle-scene.ts` calls `tileCost` in `thresholdOn`.
- `CITY_SIGHT` is exported from `src/rules/sight.ts` and read by `src/rules/sight.test.ts` only; the test reads the fixture catalogue's number instead.
- `src/rules/fixtures.ts` `founded()` builds the seven held tiles by hand; it goes through `founding(CATALOGUE, CITY)` instead, as the dogma on fixtures asks.
- `MapContent` (`src/rules/map-kinds.ts`) is what `map.ts` and `units.ts` read the catalogue through; the city entry's new fields are read by `sight.ts` and `city.ts`, which take the full `Catalogue`, so `MapContent` does not change.

**Plan:**

1. `src/rules/catalogue.ts`: `Catalogue['city']` gains `sight: number`, `holds: number` (rings) and `idle: number`; `catalogued` refuses a negative in any of the three, in the refusal vocabulary the rest uses.
2. `src/rules/sight.ts`: `inSight` watches from the city with `catalogue.city.sight`; `CITY_SIGHT` goes.
3. `src/rules/city.ts`: `founding(catalogue, at)` owns which tiles the settle holds — the one list the threshold counts from — and staffs them; `IDLE_FOUNDED` and `FOUNDING_HELD` go; `cultureThreshold(catalogue, chronicle)`; `tileCost(catalogue, chronicle, tile)`.
4. `src/rules/chronicle.ts`: `beginChronicle` spreads `founding(catalogue, CITY_TILE)`.
5. `src/content/stand-in.ts` and `src/rules/fixtures.ts`: the city entry carries the three numbers; `founded()` goes through `founding`.
6. `src/ui/chronicle-scene.ts`: `tileCost` gets the catalogue.
7. Tests on the fixture catalogue, by changing the fixture's city entry through a `changed` catalogue as `src/rules/catalogue.test.ts` does: `src/rules/city.test.ts` — a city whose content holds no ring holds its tile alone with one inhabitant on it and the idle content besides, and its first claim costs what the threshold's first step costs; `src/rules/sight.test.ts` — a city of sight one sees the six around it and no further, the held-tile rule aside; `src/rules/catalogue.test.ts` — a negative on the city entry is refused. The existing founding tests stand.
8. `docs/CHRONICLE.md` as written under _Spec_.

**Verify:** `npm run check`, `npm test`, `npm run lint`; `npx playwright test e2e/city-mode.spec.ts` — the one spec that reads the culture threshold off the screen, and nothing else on screen changes.
