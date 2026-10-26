# The personas reinforced

**Line:** **The personas reinforced** — both personas raise a unit early, raise more under threat and keep a lone unit home, measured on the cells [`CAMPS.md`](../CAMPS.md) names with one set left out at a time. Done when both walks hold the enter-early gambit, the emergency pair and the stay-home condition on their charting gambits, each held by a test on the fixture, `docs/SIMULATOR.md`'s persona paragraphs say so, and the hand-back carries the six cells against the baseline with one row per set left out.

**Spec:** `docs/SIMULATOR.md` → _The persona and the gambit_, the builder's and the warlord's paragraphs.

The builder's paragraph: after "keeps a few workers and a small garrison out of the population no tile needs," insert "raises its first unit that attacks before it staffs a field, while none stands within three tiles of the city, and under threat, while more enemies the map shows within three tiles of the city than its units that attack there stand, raises one for each, taking a worker off the field that yields the least for it where its income allows,"; and "charts the ground near the city and otherwise stands on the ring" becomes "charts the ground near the city once two units that attack stand, a lone one staying home, and otherwise stands on the ring".

The warlord's paragraph: "turns its people into units that attack down to a floor of population, the tiles the city holds and three at most, taking them off the fields for it where its income allows, scouts with them until a camp or a site is charted," becomes "raises its first unit that attacks and more under threat as the builder does, turns its people into units that attack down to a floor of population, the tiles the city holds and three at most, taking them off the fields for it where its income allows, scouts with them once two stand until a camp or a site is charted,".

The gambits' sentences, the ones `--personas` prints and the trace names, verbatim. Three new gambits, the same in both personas, standing in this order after the goal gambits and before the idle assignment, so ahead of the warlord's own entry and unassign:

1. Enter early: `While no unit that attacks stands within three tiles of the city and a population is idle, play a unit card whose trial enters a unit that attacks`
2. Emergency entry: `While more enemies the map shows stand within three tiles of the city than units that attack there, and a population is idle, play a unit card whose trial enters a unit that attacks`
3. Emergency unassign: `While more enemies the map shows stand within three tiles of the city than units that attack there, none is idle, and a unit card in hand that enters a unit that attacks is held back by the idle alone, unassign the worked tile that yields the least of everything together, the least food of equals`

Three standing gambits gain the stay-home condition, their sentences opening with `While at least two units that attack stand, `: the builder's charting walk within five tiles, the warlord's charting walk while no camp and no site is charted, and the warlord's charting walk within five tiles of the not-marching unit. Nothing else in those sentences changes.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:**

- In: the three gambits in both walks; the stay-home condition on the three charting gambits; one test per new gambit and the charting tests asserting a lone unit charts nothing; the measurement below, run during the ship and carried whole in the hand-back; the `docs/SIMULATOR.md` sentences.
- Out: the fighting gambits, which are the next line; the deck weighed before a unit enters, which is an idea; the baseline's rerun, which is a Baseline commit of its own after the user has read the hand-back and cut what goes, never part of the ship.
- "Within three tiles of the city" is the distance from the city's tile, three or fewer, on both sides of the emergency's count: the enemies the map shows, in sight or in fog this turn, and the player's units that attack, so a unit marching far away counts for nothing at home. A hostile neutral's unit is an enemy here as it is for the garrison. Nothing counts while no city stands.
- Enter early fires at the first idle population once a unit card is in hand; on every deck the settle brings none idle, so the first growth is the earliest. A unit card refused for the city's last population is dropped by the trial as any refused command is; no guard.
- The emergency entry enters one unit per enemy counted, and stops when the units match them. The emergency unassign keeps the income guard: a worked tile whose unassign takes a resource's income below nothing, or lower while it is, is passed over, as the warlord's unassign passes it today. The emergency never overrides the guard.
- Stay home counts every unit of the player's that attacks, wherever it stands, the settle's scout included. On the no-scouts deck no such unit stands at the opening, so charting waits for two entered; that is the design, read by the measurement.
- Reconcile, three likenesses, each chosen: the emergency unassign and the warlord's unassign become one, the "when" its parameter — the warlord's floor reading stays the warlord's, the emergency reading goes to both, and the builder gets no floor reading; the two new entry gambits go through the standing door that reads the unit cards whose trial enters a unit that attacks, and the builder's cap-of-two and the warlord's floor entry stay apart, behind the land, as the late top-up, a difference that is meant; the emergency's count and enter early's "none within three" read the enemies and the distance through the garrison's standing reading, unchanged.

**Traps:**

- `tools/sim.test.ts` names a gambit by its number in the walk at some sixty-five call sites, and `--without` reads the same numbers. Three gambits inserted after the goal gambits shift every number from the tenth up in both personas; every call site is renumbered, and no test is weakened to pass. The test asserting the goal gambits print as the fifth to the ninth stands.
- The warlord wraps every weighing so a unit never walks off a camp or a site, the builder so no command declares war; the new weighings take the same wrapping as their neighbours in each walk.
- An enemy in fog is read at its kind's health by the garrison's reading; the emergency's count needs presence alone and reads nothing else off it.
- The simulator page forbids a gambit any lookahead over turns; the three gambits read the chronicle as it stands and one trial deep, as every gambit does.
- The baseline's cells play with `--off events,capstone`, the split and the flags as `CAMPS.md` and `ECONOMY.md` list them; a run on any other flags joins to nothing.
- A variant run edits a tracked file and reverts it: the stay-home measurement lifts the condition from the three charting gambits, runs, then `git checkout` on the file and `git status --porcelain` on it printing nothing, as the sim skill says.

**Plan:**

1. `tools/builder.ts`: the three weighings beside the shared ones, the builder's walk holding them after the goal gambits and before the idle assignment, the unassign shared with the warlord's with its condition as the parameter, the charting walk gated on two standing. Leaves the builder playing the new walk, the typecheck green.
2. `tools/warlord.ts`: the walk holding the three ahead of its own entry and unassign, its unassign through the shared one with its floor reading, its two charting walks gated. Leaves both personas playing the new walks.
3. `tools/sim.test.ts`: the call sites renumbered; one test per new gambit on the fixture — enter early answers with none within three tiles and one idle and not with one standing there; the emergency entry answers with two enemies shown within three tiles and one unit there and not with one of each; the emergency unassign unassigns the tile yielding the least when the card is held back by the idle alone and the enemies outnumber, and not when they do not, and passes a tile the income guard refuses; the three charting tests assert a lone unit charts nothing and two chart. Leaves the tests green.
4. `docs/SIMULATOR.md`: the sentences above.
5. The measurement, in the background from step 2 on, read once steps 3 and 4 are done.

**Verify:** `npm run check`, `npm test`, `npm run lint`; `npm run sim -- --personas` printing the three sentences in both personas and the three gated ones. No proof spec: the line touches no `src/ui/` and no `e2e/`. CI runs the whole e2e suite on the push; no spec is expected to move.

The measurement, every run on the six cells of `CAMPS.md`, the split and the flags as it lists them, into the scratchpad, joined seed by seed to `workflow/camps/` by its queries:

1. The full set: the six cells as the walks stand after step 2. Per cell, the baseline's columns beside the run's: captured, capture turn median, first capture, captured by turn 15, neutral fell, its fall turn median, enemies killed median, own units lost median.
2. One run per set left out: `--without <enter early's number>`; `--without <emergency entry's number>,<emergency unassign's number>`, the numbers read off `--personas` for each persona; and the stay-home variant, the condition lifted from the three charting gambits for the run and the file reverted after. Each joined to the full set's rows, the same columns.
3. The dead rule: a set whose run leaves every ending row the same as the full set's on every cell — the ending, its turn, the neutral's fall, the units standing and the units killed — is cut from both walks before the commit, and the hand-back says so with the join that read it. A set that moves any row ships and its row stands in the table.
4. The hand-back carries the two tables, one line per cell and set, and names the seeds whose ending moved under each set, for the trace. It reminds that the baseline is rerun and replaced by a Baseline commit once the user has cut what goes.

Each run of the six cells takes about five minutes of wall clock at eight processes, the four runs about twenty; they run in the background.
