# The sight charted once

**Line:** The sight charted once — the sight is read once per command and again only on a stage that changed a watcher, the border, the ground or the phase, each reading scanning the tiles within each watcher's sight through the map's one disc and one keyed lookup, and the per-unit sight question answered off the same reading; every chronicle of the builder's cell lands the same row, and the cell re-profiled shows the charting's share down. Doc-impact: none.

**Spec:** [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) _Sight_, as it stands and unchanged: the snapshot is taken again each time a command changes the chronicle, a unit killed reveals nothing after the blow and keeps what it saw up to it, the settle phase sees the centre part alone, a held tile is in sight, and the line over the ground is drawn as the section says. [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md) _What it is_: a consumer of the rules through their public API. No sentence is added or changed on any page, and the line foresees no player-facing sentence.

**Doc-impact:** none — what is in sight, when a snapshot is taken and what the fog shows are unchanged; the line changes how often and how widely the rules compute an answer the pages already fix.

**Scope:**

In:

- One reading of the sight per command, kept across its stages. The walk over a command's stages already carries the snapshots and the turn from one stage to the next; the sight reading, and the keyed lookup of the tiles it was read with, ride beside them. The reading is read again on a stage whose chronicle differs from the one it was read on in any input the sight reads: the phase (turn 0 sees the centre part alone), the centre part, the city's tile and its section's sight, the held tiles, the tiles the player's units stand on and their sight stats, and the terrains of the map's tiles. On every stage the answer is what a fresh reading on that stage's chronicle gives; the saving is in not computing an identical answer. Measured on the builder, five seeds, Nomadic temperate: 3.0 readings per command, 52% of them identical to the previous stage's inside the same command.
- Each reading scans the tiles within each watcher's sight — the disc around the watcher's tile out to its sight — instead of every tile of the map, reading the terrains through the map's one keyed lookup. Measured: 4.6 watchers and 331 tiles per reading today; the disc scan alone made every chronicle of the cell 20–30% faster with identical rows.
- One disc helper in the map module, beside the count of a disc's tiles: the tiles within a radius of a tile. The watcher's scan goes through it, and so do the three hand-written copies of the loop — the generator's disc around the centre in `src/rules/map.ts`, the fixture's `field` in `src/rules/fixtures.ts` and the sight test's `ground` in `src/rules/sight.test.ts`.
- The per-unit question — whether one unit sees one tile from where it stands, the attack's legality and the enemies' target reading — answered off the same reading of what a watcher sees from a tile, through the keyed lookup and never through a search of all the tiles for each crossed one.
- Rows unchanged, and a before-and-after profile on the same cell.

Out:

- A memo across commands. 12% of readings equal the previous command's last, the builder's trials being replays of one chronicle; catching them needs state outside the walk, in a module of pure rules, and that share does not buy it.
- Charting the snapshots only at a command's end: the chronicle page's _Sight_ decides against it, and the test `a killed unit charts nothing more` reads the fog at the blow's stage.
- The builder's yield reads, the profile's next 28%: the simulator's own, a line of their own if one is wanted.
- The snapshot taking itself, measured at under 2% of the charting's time.
- Any change to what the chronicle screen, `byHand` or the builder ask: they keep asking for the sight of a bare chronicle and get the cheaper reading.

Corner cases decided here:

- The turn tick is a stage that changes the phase on the first end of turn (turn 0 to 1): the reading is read again there, the centre part's sight giving way to the watchers'. The comparison of inputs covers it with nothing special-cased.
- A unit of the player's killed mid-command, a unit entered mid-command, a tile claimed mid-command, a tile relaid mid-command: each changes an input, the next stage is read afresh, and the snapshots of that stage are what today's are.
- A reading's set is read by membership everywhere — the charting, the map's `live`, `byHand`, the builder. Its iteration order may change with the disc scan; nothing reads it in order, and the rows prove it.

Reconcile:

- The disc of tiles around a tile: the standing loops and the projected scan become one helper in the map module, the generator and the two fixtures reshaped in this line; what differs between them, the centre and the radius, is what the helper takes.
- The keyed tile lookup: the projected goes through the standing one in the map module as it is; the sight module builds no table of its own.
- The carry across stages: through the standing walk in `charting`, where the snapshots and the turn already carry.

**Traps:**

- The sight's inputs are exactly: `onSettlePhase` (turn 0), `centre`, `city` and `citySection.sight`, `held`, every unit of faction `player` (its `tile` and `stats.sight`), and the terrains of `tiles`. The `units` array is rebuilt whenever any unit changes, an enemy's move included, so its identity says nothing about the watchers; the `tiles` array was the very same object on 99.6% of readings and is rebuilt when a tile is relaid, so its identity is a sound "same terrains" and a rebuilt one is compared by terrain or read afresh. `held` is replaced on a claim and otherwise kept by reference.
- `charted` hands back the very chronicle it was given when nothing was charted, and `charting` hands back the very stages: callers compare by identity (`charting`'s `left === stage.chronicle`, the test at `src/rules/chronicle.test.ts` asserting `reached.chronicle.snapshots` is `moved.chronicle.snapshots`). The kept reading changes none of that.
- `records` compares a snapshot's tile by identity, which is why `unitsGone` keeps the tile objects; nothing in this line rebuilds a tile.
- `chartedAt` charts one tile whatever sees it and reads no sight; it stays on the walk as it is.
- `inSight` is read on a bare chronicle by `src/ui/map.ts` (`drawing`), by `byHand` in `src/rules/chronicle.ts` and by `tools/builder.ts`; that public shape stays.
- `inOwnSight` is read by `src/rules/enemies.ts` (an attacker's targets), `src/content/scripts.ts` and the attack's legality in `src/rules/chronicle.ts`; its `tileAt` is a linear find per crossed tile. The enemies' target reading asks it for every unit from one attacker, so a caller may read the watcher's disc once and ask membership.
- The profile skill's rule, `.claude/skills/profile/SKILL.md`: a change in `src/rules/` is re-profiled on the same cell before and after, a speedup predicted and not measured does not count, and a row that moves is a bug. The baseline rows and profile are taken before the first edit.
- The sim's rows carry an `ms` column that differs run to run; a comparison blanks it. Run to run the wall time varied by ±3 s on 26–34 s with no code change, so the gain is read off the profile's shares and the per-chronicle medians, not one wall time.
- `src/rules/` imports no content and no Phaser; the tiles' elevation is read through `elevation(catalogue, terrain)` as today.
- Comments are for traps only; the docblocks in `src/rules/sight.ts` are re-shaved where the edit touches them, and the one on `charting` in `src/rules/chronicle.ts` says what the walk carries.

**Plan:**

1. Baseline, before any edit: the builder's rows on the cell (`npm run sim -- --persona builder --seeds 5 --out <scratchpad>/before.csv`) and the cell's profile as the profile skill takes it (Nomadic temperate, the builder, 20 seeds, in the scratchpad), the header, the split and the cumulative table kept for the report.
2. `src/rules/map.ts`: the disc helper beside `discTiles`, the generator's loop through it; `src/rules/fixtures.ts` `field` and `src/rules/sight.test.ts` `ground` through it. Inert: tests green, the five rows unchanged.
3. `src/rules/sight.ts`: one reading of what a watcher sees from a tile over its disc through the map's keyed lookup; `inSight` the union of it over the watchers on top of the held tiles, the settle phase as today; `inOwnSight` answered off the same reading. Tests green, rows unchanged.
4. `src/rules/chronicle.ts` `charting`: the reading and its lookup carried beside the snapshots and the turn, read again only on a stage that changed an input; `charted` takes what the walk hands it, and a bare `inSight` still reads a chronicle alone. One test on the fixture in `src/rules/sight.test.ts`: a claim of a tile the city does not see, through the real command, has the tile's snapshot taken at the `held` change's own stage, and a unit entered through a card mid-command charts what it sees at the stage it enters. Tests green, rows unchanged.
5. The after measurement: the five rows against the baseline with `ms` blanked, and the same cell profiled, the charting's share and the per-chronicle median beside the baseline's in the report.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- `npm run sim -- --persona builder --seeds 5 --out <scratchpad>/after.csv`, compared with the baseline, the `ms` column blanked: zero rows differ.
- The profile, before and after, per `.claude/skills/profile/SKILL.md` on the builder's Nomadic temperate cell, 20 seeds: the report gives both headers, the project/runtime split and the charting's cumulative share.
- Proof spec: none — the line changes nothing that reaches the screen.
- CI proves on the push, listed for the hand-back: `e2e/fog.spec.ts`, `e2e/map.spec.ts`, `e2e/archer.spec.ts`, `e2e/attack.spec.ts`, `e2e/neutral.spec.ts`, `e2e/camps.spec.ts`, `e2e/console.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/landing.spec.ts`, `e2e/predators.spec.ts`, `e2e/siege.spec.ts`, `e2e/population-badge.spec.ts`, `e2e/inspect.spec.ts`, `e2e/worker-instants.spec.ts`, and the rest of the suite.
