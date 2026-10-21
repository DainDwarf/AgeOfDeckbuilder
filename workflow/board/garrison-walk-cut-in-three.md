# The garrison walk cut in three

**Line:** The garrison walk cut in three — the builder's 16 and the warlord's 19 become three gambits each, the charting walk within five tiles, the rest on the ring and the walk home of a unit beyond the ring, and the charting walk, the warlord's scout included, goes to the cheapest tile that charts one rather than the one charting most; `--personas` prints the seven sentences at their numbers, each gambit is held by one test on the fixtures, the trace names each, and the builder's and the warlord's 100 seeds at HEAD and after are joined seed by seed at the hand-back.

**Spec:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md) → _The persona and the gambit_: "A gambit is one condition and one command", "the first deciding and the next of equals", "ties fall in tile order", and the builder's and the warlord's paragraphs, which change by no word. The gambits' sentences, the ones `--personas` prints, written out; every ranking reads its numbers in the order the sentence gives them and falls to tile order last.

The builder's 16, 17 and 18:

> A unit that attacks walks to the cheapest reachable tile within five tiles of the city whose trial charts a tile, the one charting most of equals

> A unit that attacks walks to the reachable tile the city may claim that stands highest, yields least of equals, nearest the city's tile of equals, where that beats where it stands

> A unit that attacks outside the border and off the tiles the city may claim walks to the reachable unheld tile nearest the city's tile, where that is nearer than where it stands

The warlord's 17, its scout, reranked the same way:

> While no camp and no site is charted, a unit that attacks walks to the cheapest reachable tile whose trial charts a tile, the one charting most of equals

The warlord's 19, 20 and 21, the three above each opening with the warlord's governance in place of "A unit that attacks":

> A unit that attacks that is not marching, the nearest the city's tile or any while fewer than three stand, walks to the cheapest reachable tile within five tiles of the city whose trial charts a tile, the one charting most of equals

> A unit that attacks that is not marching, the nearest the city's tile or any while fewer than three stand, walks to the reachable tile the city may claim that stands highest, yields least of equals, nearest the city's tile of equals, where that beats where it stands

> A unit that attacks that is not marching, the nearest the city's tile or any while fewer than three stand, outside the border and off the tiles the city may claim walks to the reachable unheld tile nearest the city's tile, where that is nearer than where it stands

No player-facing text: the persona is the simulator's.

**Doc-impact:** none — the page's builder paragraph, "charts the ground near the city and otherwise stands on the ring just outside the border", covers the three gambits, the walk back toward the ring being part of standing on it, and the warlord's "scouts with them until a camp or a site is charted" covers the scout's new order.

**Scope:**

In: the one garrison gambit of each persona cut into three, in today's order; the charting door's ranking, which the scout walks through too; the seven sentences; one test per gambit; the gambit numbers in the tests and on the board. Out: the attack gambits, the march, who the warlord's walk governs, the radius's value, every other gambit, the page.

A sentence names what its gambit reads, and the order gives the rest. "With nothing to attack" leaves the sentences: the attack gambit stands above and the code never read it. The walk home's "with no ring tile reachable" is the order's too: a unit off the ring with a ring tile reachable always moves there under the rest gambit, since no own rank holds it, so the walk home is reached for exactly the units the rest left standing. What the walk home does read is where the unit stands, outside the border and off the tiles the city may claim, and it offers unheld landings alone, as today.

The charting ranking is the cheapest landing first, by the cost in move points the rules hand with each landing, the one charting most tiles of equals, tile order last; a landing whose trial charts nothing is no candidate, as today. "Nearest" is read as cheapest, what the unit spends. The radius is a number the persona hands the gambit and prints in its sentence, five for both garrisons; the scout hands none. The door is one, the radius its only parameter: the scout and the garrison snake the same way.

The cut moves the order across units: today each unit in turn charts, else rests, else walks home; after it every governed unit charts before any rests. A chart by a second unit can show the first a ring tile it did not have, so some seeds play differently, and the hand-back lists the endings that moved.

The next board line, "The card aimed at the hand cut in two", names "the builder's 18 and the warlord's 23", which this cut makes 20 and 25; the ship renumbers that line in the commit that deletes its own.

Reconcile: the charting walk is already the one door the scout and the garrison both walk through, the radius its parameter; the walk home is already the worker withdrawal's door with the landings offered as its parameter, the garrison's unheld only. Both stay as they are.

**Traps:**

- The charting door is shared: the reranking lands once and reaches the warlord's scout. The scout's test on a ten-tile strip expects the landing charting most; its fixture must be one where cheapest-first and most-first disagree, a near landing charting one tile and a farther one charting more, and the test asserts the near one.
- A reachable landing is never a tile a unit stands on: the rules cross a tile one of the unit's own faction stands on and never offer it, and another faction's shuts the way. The rest gambit needs no reading of its own for a tile taken.
- The rest always ends on the ring: a unit off the ring has no own rank and loses to every ring tile it reaches, never ranked by height against them; tile order picks among equals but never counts in "beats where it stands".
- The warlord's stay-on-camp test reads the builder's 16 as the walk that moves a unit off a camp. A camp's tile is never one the city may claim, so after the cut the unit on it is outside the border and off the ring; which of the builder's three moves it depends on whether a ring tile is reachable from the camp on that fixture, and the test names that gambit.
- The gambit numbers after the cut: the builder's gain 17 → 19, hand 18 → 20, end 19 → 21; the warlord's refresh 20 → 22, heal 21 → 23, gain 22 → 24, hand 23 → 25, end 24 → 26. The tests name gambits by number; the `--without` refusal test reads the count and stands.
- The persona page forbids a value model and a weight between two readings: every ranking is an order of readings, nothing summed across them.
- No measurement runs on CI and none is committed; the baselines are taken at HEAD before any file changes.

**Plan:**

1. The charting door reranked, cheapest first among the landings charting a tile, most charted of equals, tile order; the scout's sentence rewritten; its test on a fixture where the two orders disagree. Leaves: the warlord's scout snaking, its test green.
2. The garrison walk cut into three gambits in both personas, the sentences as written, each held by one test on the fixtures: the charting one, cheapest first within the radius and nothing beyond it; the rest, today's cases; the walk home, a unit beyond the ring with no ring landing walking to the unheld landing nearest the city's tile, standing where none is nearer, and not walking from inside the border or from the ring. The gambit numbers in the tests follow. Leaves: `--personas` printing the seven sentences at their numbers, `npm test` green.
3. The next board line's two numbers. Leaves: the board true to the personas.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Before the change, at HEAD: the builder and the warlord on the default cell, 100 seeds each, split into the scratchpad as the sim skill's split recipe runs it, as the baselines. After the change: the same two cells into two more folders, each pair joined seed by seed through the skill's two-file query; the hand-back lists the endings that moved with their seeds, per persona.
- `npm run sim -- --personas` printing the sentences as the builder's 16, 17 and 18 and the warlord's 17, 19, 20 and 21.
- `node tools/sim.ts --persona builder --trace <seed>` on a seed whose row stands a unit that attacks, the three sentences each named behind a move; the same seed with `--without 16`, the trace naming the rest sentence and never the charting one.
- No proof spec: the line lands in `tools/` and `workflow/`, nothing on screen. CI proves the Playwright suite on the push as always.
