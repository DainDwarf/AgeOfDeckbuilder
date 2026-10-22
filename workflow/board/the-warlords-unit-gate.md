# The warlord's unit gate

**Line:** The warlord's unit gate — the warlord's unit gambit and its unassign gambit open while more population stands than the tiles the city holds, three at most, in place of more than three; `--personas` prints both sentences at their numbers, each gambit is held by one test on the fixtures, and the trace names each.

**Spec:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md) → _The persona and the gambit_: "A gambit is one condition and one command", "A reserve a gambit keeps is derived, never a constant", "The numbers a persona carries, how many of a thing it keeps, how far it goes, are the persona's own"; → the warlord paragraph, "turns its people into units that attack down to a floor of population, taking them off the fields for it". [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) → _The city_: the culture threshold is "twice the tiles the city holds, its own counted", the count the floor reads; a unit is "made of one idle population of the player's city, never its last"; the growth threshold is twice the population and the units of the player's on the map counted together. [`docs/GLOSSARY.md`](../../docs/GLOSSARY.md): **hold**, **claim**, **idle**, **assign**.

The sentences, the ones `--personas` prints, the warlord's 5 and 6. Today "While a population is idle and more than three stand, play a unit card whose trial enters a unit that attacks" becomes:

> While a population is idle and more stand than the tiles the city holds, three at most, play a unit card whose trial enters a unit that attacks

Today "While none is idle, more than three stand and a unit card in hand that enters a unit that attacks is held back by the idle alone, unassign the worked tile that yields the least of everything together, the least food of equals" becomes:

> While none is idle, more stand than the tiles the city holds, three at most, and a unit card in hand that enters a unit that attacks is held back by the idle alone, unassign the worked tile that yields the least of everything together, the least food of equals

The page's warlord clause, today "turns its people into units that attack down to a floor of population, taking them off the fields for it", becomes:

> turns its people into units that attack down to a floor of population, the tiles the city holds and three at most, taking them off the fields for it

No player-facing text: the persona is the simulator's.

**Doc-impact:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md), the warlord clause as written above.

**Scope:**

In: the floor in both gambits, one reading; the two sentences; the two standing tests re-aimed, one per gambit, on a city holding its own tile alone and on one holding several; the page clause. Out: the builder's unit gates, apart by design, a builder first and a garrison second; the worker gambit, which opens while no worker stands; every other gambit; the gambit numbers, which do not move.

The floor is the tiles the city holds, its own counted, and three where it holds more: a city holding its own tile alone fields a unit at two population, one holding two at three, and one holding three or more at four as today. "More stand than the floor" reads the population as the chronicle counts it, the units on the map not among them; the rules refuse the last population to a unit card whatever the floor says, and the gambit reads the refusal as today, never the count.

The unassign gambit's floor is the same reading: with none idle and the population above the floor, a unit card in hand held back by the idle alone frees the worked tile yielding least, and the unit gambit plays the card on the next pass. Below the floor it frees nothing.

Growth costs twice the heads on the map, so a warlord held at the floor grows slowly for the rest of the age; that is the stance, decided here.

Reconcile: the two gambits' "more than three" become one reading of the floor, the persona's own, which both call; the tiles the city holds are counted as the rules count them for the claim threshold, through the chronicle's held tiles. The builder's gates stay apart for a difference that is meant.

Measured, 2026-10-22, the Nomadic Age's temperate region, the campaign's first civilization, 10 seeds, HEAD 85e0ea8: the warlord's population at the ending is 1 to 4, the median 3; it holds one tile in 8 rows and two in 2; it plays a warrior card in 4 rows of 10, the first on turn 16 at the earliest in the traces read, and ends with 6 to 36 military unspent, the median 11.

**Traps:**

- The population count is `chronicle.population`, the people of the city; the units of the player's on the map are not in it. The growth threshold adds them; the floor does not.
- The held tiles are `chronicle.held`, the city's own tile among them; a city before the settle holds nothing and has no population, and both gambits answer nothing then as today.
- The standing tests at `tools/sim.test.ts` build cities through `cityOf` with one tile per population named; a city of four tiles holds four, so the floor there is three and the standing expectations hold. The new cases want a city holding its own tile alone with two population, one idle, which the one-tile fixture `entering` already builds, and one holding two tiles with three.
- The sentences are the trace's names and `--without`'s numbering; the numbers 5 and 6 do not move.
- Comments are for traps only; the sentences carry the why.
- No measurement runs on CI and none is committed; the baselines below are taken at HEAD before any file changes.

**Plan:**

1. The floor read once and called by both gambits, the sentences as written; the two tests re-aimed: the unit gambit playing at two population on one held tile and at four on four, none at one on one nor at three on three, the unassign gambit freeing the least tile at three population on two held tiles with none idle and nothing at two. Leaves: `--personas` printing the sentences at the warlord's 5 and 6, `npm test` green.
2. The page clause. Leaves: the warlord paragraph true to the persona.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Before the change, at HEAD: the warlord on the default cell, 20 seeds, into the scratchpad as the baseline. After the change: the same cell, joined seed by seed through the sim skill's two-file query; the hand-back lists the endings that moved with their seeds, the capture turns' movement, the rows playing a warrior card against the baseline's, and the military left at the ending, expected below the baseline's.
- `npm run sim -- --personas` printing the sentences at the warlord's 5 and 6.
- `node tools/sim.ts --persona warlord --trace 1`, the unit sentence named before turn 6, where at HEAD no unit card is played in the chronicle; the same with `--without 5`, the trace naming it nowhere and the chronicle still ending.
- No proof spec: the line lands in `tools/` and `docs/`, nothing on screen. CI proves the Playwright suite on the push as always.
