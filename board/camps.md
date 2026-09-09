# Camps on the map

The contract for the board line of that name, settled with the user on 2026-09-09. The design is
already written: `docs/DESIGN.md` → *The map* (the building bullet, the sixth generator layer) and
*Events and the capstone* (the "Enemies enter from camps" paragraph); `docs/GLOSSARY.md` → **camp**.
The ship edits neither page unless a deviation forces it. The user waived the generator dogma's
running mockup for this line: the placement below is the whole pitch.

## Scope

- **A camp is a building.** `PH_Camp` joins `BuildingTypeId` and `BUILDINGS` with no yield. It
  is put on the tile by the generator, never by a card, so `BUILDINGS[...].terrain` — the one
  terrain `made()` in `cards.ts` checks for the farm card — means nothing for it. A made-up
  terrain there is a lie; the content shape widens instead (the field optional, or the two tables
  split). The implementer's layout, reported.
- **Placement**, the sixth layer of `generateMap` in `src/rules/map.ts`, after the rivers. The
  count is fixed: **three**. The positions are rolled: a candidate tile is one a warrior stands on
  (`standsOn(UNIT_STATS.PH_Warrior, tile)`), one the whole-map walk from the city reaches
  (`pathCosts` from `CITY_TILE` with the warrior's move, the rivers in hand, nothing blocked), at
  **distance 4 or more** from the city and **3 or more** from every camp already placed. One camp at
  a time, drawn uniformly from the candidates by the rng in tile order, the candidates filtered
  again after each. When they run out the map holds fewer, and that is accepted. Nothing else on
  the tile changes: a feature stays under the camp. The three numbers sit in `MAP_COMPOSITION`
  beside the others; they are tuning.
- **The arrival spawns at a camp.** `arrival` in `src/rules/enemies.ts` draws uniformly, by the
  rng in tile order, among the camps whose tile no unit stands on, and the enemy enters on it
  through `entered` as today. With no such camp it places nothing and steps the rng no further,
  as the empty ring does today. Every fifth turn stays as it is; the schedule line changes it.
- **Sight needs nothing.** The snapshot keeps a tile's building, so a camp seen once is drawn in
  the fog as last seen; the enemies read the whole map and need no sight of a camp. Every camp
  stands beyond the city's sight at the founding by the distance above.
- **The mark**: the city's crenellated wall — the same corners as `BUILDING_MARKS.PH_City` in
  `src/ui/map.ts` — in the enemy faction's red (`FACTION_COLOURS.enemy`, 0xb4453c), the outline
  stroke as every building mark. `buildingMark` paints every building `BUILT` today; the colour
  becomes a per-building fact beside the marks, the city and the farm staying `BUILT`. A text entry
  `building.PH_Camp` for the infopanel's building row; the row shows no yields, which is right.
- **Nothing forbids the city a camp's tile.** It is claimed, assigned and worked like any charted
  tile, the camp still spawning inside the border; accepted, no rule. A building card and a
  terraform are refused there by the filled slot, which the design says.

## Doc-impact

None: the pages above already hold the settled fact. A deviation the ship meets is reported, never
written into them.

## Hazards

- `copies()` in `cards.ts` is untouched here, but the capture line's card will meet it; nothing to
  do on this line.
- `chronicle.test.ts` pins the outer ring at 400, 2394, 2420 and 2669; those tests move to the
  camp: the fifth turn's enemy stands on a camp's tile, the same seed deals the same camps, a camp
  whose tile is taken is not drawn. A fixture that takes every camp's tile enters units through the
  rules (`entered`), never by writing `units`.
- The e2e seed searches (`fallRun`, `attackRun`, the fog, map and console runs) search over ends
  of turn for an enemy's crossing; camps at distance 4 to 8 bring the enemy sooner than the ring
  did, so the seeds they find change and their budgets should shrink, not grow. A search that no
  longer finds a seed is a deviation to report.
- The e2e spec: `e2e/camps.spec.ts` opens a seed, takes the uncharted veil off through the console
  (`uncharted`), and finds as many camp marks on screen as the chronicle holds camps; after five
  ends of turn, the chronicle's one enemy stands on a camp's tile. Counting the marks may want a
  name on the camp's polygon the way the rivers' surfaces have one; that is the second instance of
  render code shaped for a spec (the tools-are-consumers ratchet), reported if taken.
- `generateMap`'s docstring says five layers; it becomes six with the design.

## Plan

1. `PH_Camp` in the building content, and the content shape the terrain field needs.
2. The sixth layer in `generateMap`, its numbers in `MAP_COMPOSITION`.
3. `arrival` draws a free camp.
4. The mark, its colour, the text entry.
5. Rules tests: placement on a fixed seed (count, distances, standable, reachable, replay), the
   spawn on a camp, the silence with every camp's tile taken; the outer-ring tests rewritten.
6. `e2e/camps.spec.ts`.

## Verify

`npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/camps.spec.ts`; the arrival
path changed under `e2e/fall.spec.ts` and `e2e/attack.spec.ts`, so both run too.
