# The withdrawal kept

**Line:** The withdrawal kept — a worker walk of the builder's and the warlord's never lands on a tile an enemy the map shows could attack next turn, and the withdrawal walks to such a tile no enemy could attack, the nearest the city of those, else the nearest the city; the three gambits' tests on the fixture pass, and the Stone Age deck's rows under the builder are reported before and after.

**Spec:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md), _The persona and the gambit_.

- The knowledge sentence, "A persona plays with the player's knowledge, the charted tiles and what is in sight, and reads the whole map nowhere.", becomes: "A persona plays with the player's knowledge, the charted tiles, what is in sight and what the fog shows this turn, and reads the whole map nowhere."
- In the builder's paragraph, "walks its workers to where a card in hand lands most," becomes: "walks its workers to where a card in hand lands most and never onto a tile an enemy the map shows could attack next turn, walks a worker such an enemy could attack onto the tile no enemy could, the nearest the city of those, else the nearest the city,".
- In the warlord's paragraph, "it settles, staffs, claims and gathers as the builder does" becomes: "it settles, staffs, claims, walks its worker and gathers as the builder does".

The three gambits' sentences, as `--personas` prints them, both personas:

- "A worker an enemy the map shows could attack next turn walks to the reachable tile no such enemy could attack, the nearest the city of those, else the reachable tile nearest the city"
- "Move a worker holding its move points to the reachable tile no enemy the map shows could attack next turn where the best play in hand lands the most, where that beats where it stands"
- "Move a worker with nothing to play to the reachable tile outside the border no enemy the map shows could attack next turn that yields most"

No player-facing text: the simulator never reaches the screen.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:**

- In: one reading, the tiles an enemy the map shows could attack next turn, and the three gambits that walk a worker reading it: the withdrawal prefers a landing outside those tiles and falls back to the nearest the city as today; the send-to-play walk and the send-out walk pass a landing inside them. The builder and the warlord both take it, since the three gambits are the builder's weighings the warlord shares.
- An enemy the map shows is a unit acting as an enemy that the chronicle's snapshots carry: in sight, or in fog this turn. The player's own units are never in a snapshot, and a unit in sight is in its tile's snapshot too, so the snapshots are the one listing. Its stats are its kind's, from the catalogue: the player sees the kind.
- Out: the garrison's walks and attacks, which read targets and not tiles; a worker's plays, which move nothing; the warlord's march.
- Corner cases decided here: a worker standing where an enemy could attack it with no landing outside the enemies' tiles walks nearest the city, as today, and then stays, since no walk lands inside those tiles; a worker standing safe whose best play lands inside them stays where it stands; where every landing is inside them the send-out walk moves nothing. A withdrawal spends move points, and a worker it left with some may still walk, to a tile outside those tiles alone.
- The withdrawal's test on the fixture today expects the walk to the city's tile. The rule is now the landing no enemy could attack nearest the city, so the expectation follows the rule, with the fixture laid so the two differ: an enemy whose walk and range cover the tile nearest the city and not a further one.
- The reconcile: the withdraw gambit's own threat reading, in-sight enemies walked over the charted tiles and asked whether they attack the worker where it stands, and the projected reading become one, reshaped here to list the enemies the map shows and to be asked of a tile. The garrison's attack reading stays apart, meant: an attacker seeks, a worker flees. The fog's units are read off the snapshots directly, as the warlord reads camps and sites.

**Traps:**

- The driver restarts the persona from the top after every command landed, and a gambit reads the chronicle alone: nothing remembers that a withdrawal just happened. The keeping is read off the chronicle, the fog's unit among it, never off what the previous gambit did.
- A unit in a snapshot leaves it when the turn ticks, and within a turn nothing but the player moves, so the fog's unit is where it was seen (`docs/CHRONICLE.md`, _Sight_). A snapshot carries the unit's kind, faction and whether it is embarked, no stats; the catalogue's unit kind table gives them.
- The enemy's walk is read on a chronicle whose tiles are the snapshots', so it never reads the map unseen; the standing comment at the withdraw gambit says so and stays. The units blocking that walk are the ones the map shows, not the chronicle's.
- The reading asked per landing walks every enemy for every landing of every worker; taken once per decision as the set of tiles the enemies could attack, it walks each enemy once. A builder chronicle takes 2.4 s at the median today; the hand-back reports the time beside the rows.
- The measurement runs before the first edit: the before rows are the tree as it stands, the after rows the change, joined by seed. Cell: `--age stone --persona builder --civilization workflow/decks/stone.json`, 100 seeds, split as the `sim` skill splits a run. The seeds the line cites, 89, 29 and 1, traced after, show the worker's walks.
- No gambit is added or reordered, so the gambit numbers the tests and `--without` use hold.
- The glossary forbids "reach" for range and "threat" for an event; the sentences say "could attack next turn".

**Plan:**

1. `tools/builder.ts`: the reading reshaped and the three gambits reading it, the sentences as the Spec writes them. The builder and the warlord play on.
2. `tools/sim.test.ts`: the withdrawal's test asserts the landing no enemy could attack nearest the city ahead of the nearer one an enemy could, the fallback where none is outside, and an enemy in fog this turn counted, the fog made through the rules by a player's unit that saw it stepping away within the turn; the send-to-play test and the send-out test each assert a landing an enemy could attack passed for the next.
3. `docs/SIMULATOR.md`: the three sentences.
4. The measurement: the before rows run first, the after rows once the change stands, the endings joined by seed and the three seeds traced, all in the report.
5. `workflow/BOARD.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none, the simulator never reaches the screen. CI proves on the push: the whole suite, none of it walking this path.
