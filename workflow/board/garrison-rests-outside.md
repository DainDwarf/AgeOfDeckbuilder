# The garrison rests outside the border

**Line:** The garrison rests outside the border — a unit that attacks with nothing to attack and nothing to chart rests on the reachable tile the city may claim that stands highest, yields least of equals, nearest the city's tile of equals, where that beats where it stands, never on a held tile; the builder's and the warlord's sentences print so, the rest spot is held by one test on the fixtures, and the builder on seed 89 of the default cell ends in victory on turn 15 instead of defeat on turn 37.

**Spec:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md) → _The persona and the gambit_, the builder's paragraph and the warlord's. The builder's sentence gains the rest spot, so that

> keeps a few workers and a small garrison out of the population no tile needs, which fights what reaches the border and charts the ground near the city,

becomes

> keeps a few workers and a small garrison out of the population no tile needs, which fights what reaches the border, charts the ground near the city and otherwise stands on the ring just outside the border, on the highest ground, the poorest of equals, so the tiles the city holds and the ones its workers want stay free,

and the warlord's

> then marches all but a small garrison on the nearest as a band,

becomes

> then marches all but a small garrison, which stands as the builder's does, on the nearest as a band,

The gambit's sentence, the one `--personas` prints as the builder's 16 and the warlord's 19, with the warlord's own opening kept:

> A unit that attacks with nothing to attack walks to the reachable tile within five tiles of the city whose trial charts the most tiles, and charting none, to the reachable tile the city may claim that stands highest, yields least of equals, nearest the city's tile of equals, where that beats where it stands

No player-facing text: the persona is the simulator's.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:**

In: the rest clause of the shared garrison walk, the two persona sentences, the simulator page, the rest-spot test. Out: the charting clause, the five-tile radius, who the warlord's walk governs, the attack gambits, every other gambit.

The ring is the tiles the city may claim, read through the rules' own door: not held by any city, touching a tile the player's city holds, charted, no camp filling its slot, no unit of another faction standing on it. So a camp's tile, the neutral's border and an uncharted tile are never a rest spot, and the city's own tile and every claimed tile are out by being held. The reconcile chose this door over a second definition of the ring; the one difference it carries, the camp and the neutral excluded, is meant.

The reading, first deciding and the next of equals: the terrain's elevation, the highest first; the tile's yield with every resource counted as one, the least first; the distance to the city's tile, the nearest first; the map's tile order last. Elevation and yield are read off the tile as the player sees it, the snapshot, as the claim gambit reads yields.

A candidate is a landing of the unit's this turn; a ring tile it cannot reach is no candidate. One unit per tile is a rule, so a ring tile another unit stands on is no landing, and with several units each takes the best free one in the order the walk governs them.

A unit moves only to a candidate that ranks above the tile it stands on under the same reading, so a unit already on the ring's best tile stays and none shuffles between equals. A unit standing on a held tile, the city's own included, always has a candidate above it where any is reachable, since a held tile is no candidate.

When no candidate is reachable: a unit outside the border keeps today's walk home, to the reachable tile nearest the city's tile where that is nearer than where it stands; a unit inside the border stays.

Both personas change, the clause being one piece of code; the warlord's rule for which units the walk governs stays.

**Traps:**

- The persona page forbids a value model and a weight between two readings: the rest spot is an order of readings and nothing is summed across them.
- A gambit reads the chronicle the way the screen does: the ring and the elevation come off the snapshots and the rules' questions, never off the map unseen.
- The trace of the builder on seed 89 is unchanged up to turn 14; on turn 14 a warrior enters and today walks onto the claimed tile (1,2), standing there to turn 34 while three workers gather beside it and the Shelter sits in the piles from turn 14 with production at 11 and climbing. After the change the worker is expected to walk onto (1,2) on turn 15 and build the Shelter, which is what seed 89 without gambit 14 does today.
- The rest-spot test in the sim's test file holds the city at radius two and expects a move to a held tile; it is rewritten to expect the ring, and the fixture it needs is one with a hill and a plain both on the ring, or a richer and a poorer tile of one height. The warlord's walk-governance test asserts which units move, not where, and should stand.
- `--without 16` on the builder also removes the charting walk, so it is no clean ablation of the rest spot; the proof is the seed as written.
- The simulator's own tests run under `npm test`; no measurement runs on CI and none is committed.

**Plan:**

1. The shared garrison walk's rest clause reads the tiles the city may claim through the rules' door, ranks them by elevation, yield, distance and tile order, and yields the moves that beat where the unit stands; the walk-home clause for a unit outside the border with no candidate stays. Leaves: the rest spot on the ring, both personas.
2. The two gambit sentences in the builder's and the warlord's lists, and the rest-spot test rewritten to the ring with the three readings each decided once on a fixture. Leaves: `--personas` printing the new sentence, `npm test` green.
3. The simulator page's two paragraphs. Leaves: the docs matching the code.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Before the change, at HEAD: the builder on the default cell, 100 seeds, split into the scratchpad as the sim skill's split recipe runs it, as the baseline. After the change: the same cell into a second folder, and the two joined seed by seed through the skill's two-file query; the hand-back lists the endings that moved with their seeds.
- `node tools/sim.ts --persona builder --seeds 89-89 --out <scratchpad>/89.csv` ending in victory on turn 15, and `node tools/sim.ts --persona builder --trace 89` showing the worker's move onto the claimed tile and the Shelter's play on turn 15.
- `npm run sim -- --personas` printing the new sentence as the builder's 16 and the warlord's 19.
- No proof spec: the line lands in `tools/` and `docs/`, nothing on screen. CI proves the Playwright suite on the push as always.
