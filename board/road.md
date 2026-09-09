# Placeholder road card

The contract for the board line of that name, settled with the user on 2026-09-09. Depends on
*Move points count in hundredths*: every number below is written in move points and lands in
code as hundredths (half a point is 50).

## Scope

- **The card.** `PH_Road`, an instant aimed at a tile, cost throwaway (production 2). Refused
  where no worker of the player's stands, where the terrain is not one the road goes on, and
  where the tile already carries a road — the same three doors as the mine.
- **Where it goes.** Plain, forest, hills and urban. A mountain is unreachable by a worker
  anyway, so no rule excludes it. The design says an improvement "names the terrain it goes on",
  singular; the road names four, so the sentence and the improvement content shape both widen to
  a list (the mine's becomes hills alone).
- **The cost is flat, not scaled.** A road's tile costs half a move point to enter whatever lies
  under it: hills road, plain road, urban road all read the same. This changes the design's
  "movement cost is the sum of what its layers say": the sum stays the rule, and a road names its
  tile's cost outright over the sum. Rejected: a road halving the tile's cost (terrain would
  still show through; the user wants the road to be the whole decision).
- **No tile is entered for nothing.** A layer may lower a cost but never to zero; the road's half
  point is the floor content may reach. The design says so in words.
- **Enemies use roads.** One cost function for every walker; a road laid outward is a raid's
  highway too. A pillaging enemy already destroys any improvement, a road with the rest.
- **The bridge.** A river edge whose two tiles both carry a road is a **bridge**: the step over
  it spends the entered tile's cost like any other, no drain. Where only one bank carries a road
  the drain stands. The whole-map walk the enemy scripts read takes the same path, so a bridged
  edge is weighed at the tile's cost there too.
- **No bridge tell.** The terrain card's river line "Crossing ends the move." stays as it is; the
  lit reach of a selected unit shows the crossing. (The card is per tile, the bridge per edge.)
- **The road's mark.** A small straight fat horizontal line above the tile, at the mine's height
  (`FEATURE_RISE`), drawn like the other improvement marks: a polygon in `BUILT` with the outline
  stroke. Rough size 16 × 4 px; the implementer picks the exact corners.
- Text entries for the improvement, the card and its rules line ("Lay a road").

## Doc-impact

- `docs/DESIGN.md`: the map section's improvement bullet names the road and widens "the terrain"
  to the terrains an improvement goes on; the movement bullet gains the road's flat cost over the
  sum, the never-zero floor, and the bridge as the one exception to the drain.
- `docs/GLOSSARY.md`: **road** (an improvement whose tile costs half a move point to enter) and
  **bridge** (a river edge with a road on both banks, crossed as if no river ran there). Both
  under the map terms, beside **improvement** and **river**.
- `IDEAS.md`'s "Bridges are a technology" entry stays: the tech later gates the same word.

## Hazards

- `movementCost(tile)` in `src/rules/map.ts` is the one answer every walk asks, and it already
  takes the whole tile; the road branch goes there and nowhere else. `standsOn` and the enemy's
  `away = reached - own` in `enemies.ts` read it and need no change.
- The bridge check needs both tiles of an edge, which `pathCosts` has as `at` and `coord`; the
  `crossings` set is edges only, so the road-on-both-banks test sits beside it, not inside
  `riverEdges`.
- `IMPROVEMENTS[...].terrain` is a single `Terrain` used by `made(tile, terrain)` in cards.ts;
  widening it touches the mine's refusal and any test naming `.terrain`.
- Fog draws improvements from the snapshot; a road is laid only where a worker stands, so it is
  always laid in sight. Nothing new there.
- The test for "further over a road" wants a worker with move 2 on a plain road run: four road
  tiles reached against two plain ones. The bridge test wants a river edge, roads on both banks,
  and a crossing that leaves points on the unit.

## Plan

1. Widen the improvement content shape to a terrain list; the mine follows.
2. `PH_Road` in `IMPROVEMENTS` and `CARDS`, with its text entries.
3. The road's cost in `movementCost`; the bridge beside the crossing check in `pathCosts`.
4. The mark in `src/ui/map.ts`.
5. Rules tests: reach over a road, reach across a bridge, the drain standing with one bank roaded.
6. The two docs pages.

## Verify

`npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/move.spec.ts`.
