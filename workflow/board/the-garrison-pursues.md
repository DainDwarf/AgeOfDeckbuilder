# The garrison pursues

**Line:** The garrison pursues — both personas gain a gambit below the attack and above the charting walk, the governed units walking toward the enemy the map shows within three tiles of the city, and the builder's attack admits the enemies within three tiles of the city from any tile in place of any enemy from a held tile; `--personas` prints the sentences at their numbers, each gambit is held by one test on the fixtures, the trace names each, and `--without` leaves either out alone.

**Spec:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md) → _The persona and the gambit_: "A gambit is one condition and one command", "A gambit weighs candidates one ply deep and no further", "no number is scored over the map", "A persona plays with the player's knowledge, the charted tiles, what is in sight and what the fog shows this turn, and reads the whole map nowhere", "ties fall in tile order", and "The numbers a persona carries, how many of a thing it keeps, how far it goes, are the persona's own". [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) → _Sight_: the snapshot keeps the non-player unit standing on every tile ever in sight, taken again on every command, and a unit in the snapshot leaves it when the turn ticks, so a unit the fog shows is where it was seen; → _Units and combat_: there is no retaliation, a unit moves and then acts, one unit per tile. [`docs/GLOSSARY.md`](../../docs/GLOSSARY.md): **enemy**, **attack**, **in sight**, **fog**, **charted**.

The sentences, the ones `--personas` prints. The builder's 15, today "A unit that attacks, attacks the enemy of least health within its range from a held tile, walking to that tile first", becomes:

> A unit that attacks, attacks the enemy of least health within three tiles of the city within its range, walking to the tile it attacks from first, the cheapest of equals

The builder's new 16, and the warlord's new 17 with the warlord's garrison clause in front of it, "A unit that attacks that is not marching, the nearest the city's tile or any while fewer than three stand, walks toward …":

> A unit that attacks walks toward the enemy the map shows within three tiles of the city, the nearest the city first, of least health of equals, to the reachable tile nearest that enemy, nearest the city of equals, where that is nearer the enemy than where it stands

The warlord's 16, its attack, changes by no word.

The page's builder paragraph, today "keeps a few workers and a small garrison out of the population no tile needs, which fights what reaches the border, charts the ground near the city and otherwise stands on the ring just outside the border", becomes:

> keeps a few workers and a small garrison out of the population no tile needs, which walks out to meet what comes within three tiles of the city and fights it, charts the ground near the city and otherwise stands on the ring just outside the border

and its last sentence, today "It attacks nothing beyond its border, never embarks and never declares war.", becomes:

> It attacks nothing beyond three tiles of its city, never embarks and never declares war.

The warlord paragraph's "then marches all but a small garrison, which stands as the builder's does, on the nearest as a band" becomes:

> then marches all but a small garrison, which stands as the builder's does and meets what comes within three tiles of the city, on the nearest as a band

No player-facing text: the persona is the simulator's.

**Doc-impact:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md), the three sentences as written above.

**Scope:**

In: the pursuit gambit in both personas, the builder's governing every unit that attacks, the warlord's the units its garrison walks govern, every one while fewer than three stand and the nearest the city's tile else; the builder's attack reworded and re-limited; the sentences; one test per gambit on the fixtures, the builder's attack test re-aimed; the page's three sentences. Out: the warlord's attack, which admits every enemy as today; the charting walk's five, a number of its own; the rest and the walk home, which change by no word; the raid's first blow, below.

The enemies the map shows are the units the snapshots carry this turn, in sight or in fog, as the worker's flight reads them; the pursuit reads no unit the snapshots do not show. The health read is the one the screen shows: the unit's own where it stands in sight, its kind's full health where the fog shows it, which is how the flight stands a shown unit on its rebuilt map.

The enemy chosen is one per governed unit, the same reading for each: among the shown enemies within three tiles of the city's tile, three measured in tiles between the enemy's tile and the city's, the nearest the city first, of least health of equals, in tile order of equals. The tile walked to is among the unit's landings this turn, ranked by its distance in tiles to that enemy's tile, then to the city's tile, then tile order, and only where that distance to the enemy is below the one the unit stands at; a unit already as near as any landing brings it answers nothing and the walk goes on. A landing is a tile the unit may enter on its move points as the screen offers it, which never lands on a tile a unit stands on, so the pursuit lands beside the enemy at the nearest and never on it. The pursuit never looks at the attack it sets up: after the move the walk restarts from the top, and the attack gambit above strikes where the enemy is now within range, so meeting and striking in one turn is the list's order, not a ply.

The pursuit steps adjacent where it can, giving the raider the first blow where the raider acts first; stopping one tile short is a two-ply thought the page forbids, decided here, not encoded.

The builder's attack: the enemy admitted is one standing within three tiles of the city's tile, the tile attacked from any landing or the unit's own, the cheapest of equals, the rest of its reading unchanged; a builder's unit beside an enemy four tiles out attacks nothing, by the paragraph's last sentence. The warlord keeps attacking any enemy it reaches.

The gambit numbers after: the builder's end 22 → 23, the warlord's 27 → 28; the warlord's camp walk, march, charting walk, rest, walk home, refresh and heal each move down one. Nothing on the board, in the tests or in the skills cites those numbers.

Reconcile: the shown enemies go through the reading the worker's flight makes over the snapshots as it is; the attack's door takes the enemies admitted as its parameter, the builder those within three tiles of the city and the warlord all, and its held-tile reading goes; the pursuit takes the governed units as the rest and the walk home do; three and the charting walk's five stay apart, a difference that is meant.

Measured, 2026-10-22, the Nomadic Age's temperate region, the campaign's first civilization, 10 seeds per persona at HEAD 85e0ea8: the builder ends in capture in 9 rows and at the turn cap in 1, the median capture on turn 22, and kills no enemy in any row; the warlord ends in capture in 8, victory in 1, the turn cap in 1, the median capture on turn 17. In the traces of builder seeds 1 and 4 and warlord seed 1 the workers' flight fires two to three turns before the capture while the garrison charts four to seven tiles out and never turns.

**Traps:**

- A snapshot's unit carries its kind, its faction and whether it is embarked, no health and no number: a shown enemy in fog is read at its kind's health, and the flight's rebuilt map is where the standing code already stands such a unit as a unit.
- The snapshots hold a unit for a tile in sight too, taken again on every command; a unit of the player's is never among them. The flight's rebuilt map stands only the player's units and the shown ones, never the chronicle's own units, so the fog is never read through.
- The warlord's `staying` wrapper refuses a move off a camp or a site; a pursuit that would walk the holder off a camp is dropped by it, as every other walk is, and the walk goes on.
- The warlord's governed units while three or more stand is the one nearest the city's tile, ties in tile order; the pursuit governs that unit only, and the marching ones never turn.
- The attack reads `unit.action`, the walks `unit.movePoints`; a unit that struck this turn has spent both and the pursuit answers nothing for it.
- The trace names a gambit by its sentence, and `--without` numbers the gambits as `--personas` prints them; the builder's reworded attack and the pursuit differ in their sentences, so a trace tells them apart.
- Comments are for traps only; the sentences carry the why.
- No measurement runs on CI and none is committed; the baselines below are taken at HEAD before any file changes.

**Plan:**

1. The pursuit gambit in both lists, below the attack, above the warlord's camp walk and the builder's charting walk, the governed units as each persona's rest takes them; the builder's attack re-limited to the enemies within three tiles of the city from any tile, the sentence as written; one test per gambit on the fixtures: the pursuit with a shown enemy within three tiles walked toward along the landing nearest it, one beyond three left alone, of two the nearest the city chosen, and one in fog read at its kind's health; the builder's attack test re-aimed at an enemy in range beyond three tiles left alone and the warlord's attack striking it. Leaves: `--personas` printing the sentences as the builder's 15 and 16 and the warlord's 17, `npm test` green.
2. The page's three sentences. Leaves: the two paragraphs true to the personas.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Before the change, at HEAD: the builder and the warlord on the default cell, 20 seeds each, into the scratchpad as the baselines. After the change: the same two cells, each pair joined seed by seed through the sim skill's two-file query; the hand-back lists the endings that moved with their seeds and the capture turns' movement per persona, and the builder's enemies killed, expected above the baseline's none.
- `npm run sim -- --personas` printing the sentences at the builder's 15 and 16 and the warlord's 17.
- `node tools/sim.ts --persona builder --trace 1`, the pursuit sentence named from the turn the flight first fires, turn 9 at HEAD; the same with `--without 16`, the trace naming it nowhere and the chronicle still ending.
- No proof spec: the line lands in `tools/` and `docs/`, nothing on screen. CI proves the Playwright suite on the push as always.
