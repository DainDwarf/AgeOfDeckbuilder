# The builder

**Line:** The builder — `--persona builder` drives a chronicle through the nineteen gambits below, `--personas` prints them as written, every command it sends is one the rules can be asked declares no war, and each gambit's choice has its test on the fixture. Doc-impact: `docs/SIMULATOR.md`.

**Spec:** `docs/SIMULATOR.md` _The persona and the gambit_, three edits, and the persona's sentences, which are what `--personas` prints and what the trace names, written out here so the implementer authors none.

The sentence "No gambit names a card, a building, an event or a capstone: it reads kinds, aims, costs, blocks, yields and counts." becomes:

> No gambit names a card, a building, a unit kind, an event or a capstone: it reads kinds, aims, costs, blocks, yields and counts, and a unit by what it does, a worker or one that attacks.

The paragraph ending "whether that is the persona's defect or the content's lesson is the user's reading." gains after it:

> A persona is as competent as one ply makes it inside its stance and blind outside it by design: a gambit changes when a trace shows a misplay a player of that stance would never make, never to win more. The numbers a persona carries, how many of a thing it keeps, how far it goes, are the persona's own.

After the idle's paragraph, before the goal's:

> The **builder** is the stance that works the land and the border: it settles on the ground richest with its ring, staffs its tiles food first, claims the richest tile and toward richer ground of equals, walks its workers to where a card in hand lands most, places what it holds and gathers where it stands, never spoiling a tile, keeps a few workers and a small garrison out of the population no tile needs, which fights what reaches the border and charts the ground near the city, pays a hazard it can, takes of a deal what its trial shows costs least, and discards through a card aimed at the hand what nobody plays. It attacks nothing beyond its border, never embarks and never declares war.

The persona, `builder`, its gambits in this order, each sentence verbatim and ending in no period:

1. While a deal stands, take the entry whose trial brings no defeat, no unit acting as an enemy and no card that strikes, of those the one losing the least population and then leaving the most stock together, and the first not refused where none qualifies
2. On the settle phase, settle on the charted tile the city's building stands on whose yield summed with its six neighbours' is the most, the nearest the centre of equals
3. On the settle phase, play a settle card that enters a unit on the free tile beside the city that yields most
4. Pay a hazard in hand the stocks cover
5. While a population is idle and the city holds a tile nobody works, assign it to the free held tile that yields the most food, the most of everything together of equals
6. While a worked tile yields less than a free held tile, reassign the population onto it
7. While culture covers a claim, claim the tile that yields most among those the city may claim, the nearest a charted tile that yields more of equals
8. A worker an enemy in sight could reach next turn walks to the reachable tile nearest the city
9. Move a worker holding its move points to the reachable tile where the best play in hand lands the most, where that beats where it stands
10. Play through a worker the card that places something, on the tile where it adds the most food to the yield, the most of everything of equals, the nearest the city of equals, one adding nothing still played
11. Play through a worker the card whose trial raises the stocks the most, never one whose trial lowers a tile's yield
12. Move a worker with nothing to play to the reachable tile outside the border that yields most
13. While fewer than three workers stand, a population is idle and no held tile is free, play a unit card whose trial enters a worker
14. While fewer than two units that attack stand, a population is idle and no held tile is free, play a unit card whose trial enters a unit that attacks
15. A unit that attacks, attacks the enemy of least health within its reach from a held tile, walking to that tile first
16. A unit that attacks with nothing to attack walks to the reachable tile within five tiles of the city whose trial charts the most tiles, and charting none, to the free held tile nearest the city's own, never onto it
17. Play a card aimed at nothing whose trial raises the stocks' sum or the population
18. Play a card aimed at the hand on a hazard in hand, else on its first other card
19. End the turn

No player-facing sentence: nothing of this reaches the screen.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:** In: the persona in `tools/personas.ts`, its sentences above, one test per gambit's choice on the fixture catalogue in `tools/sim.test.ts`, the page's three edits, and ahead of all of it the one inert commit moving the sum of a tile's yield, every resource together, out of `src/content/scripts.ts` into the rules beside the yield it sums, the script reading it from there and nothing else of the script changing. Out: the goal gambit, the warlord and the population floor a unit card leaves, which stay their own lines; the `sim` skill, whose step 1 already names `--persona` and `--personas`; `CLAUDE.md`'s command table, still true; a card aimed at a tile that no worker plays, such as a trophy claiming a tile, which the builder never plays; embarking, so no building on the coast; March, Heal and Calendar, which the builder never plays.

How each gambit reads, decided here:

- Every candidate command is asked of the rules whether it declares war, through the question `src/rules/chronicle.ts` exports for the screen's warning, and one that would is dropped as if its gambit had answered nothing: a take, a move and an attack alike. This is the builder's "never declares war", a rule over the list and no gambit of its own.
- A trial is a candidate command played through `apply` on the chronicle as it stands, the chronicle it leaves read and thrown away; the page's rule holds, a trial whose chronicle carries another generator than the one it started on is not read, and for gambit 1 such an entry never qualifies. So on A rival band, whose two answers both draw, no entry qualifies and the first not refused is taken, the raid; the user knows.
- Gambit 1 reads off the trial: no defeat, the ending's outcome; no unit acting as an enemy more than before, read with the relations the trial leaves, so a declared war with the neutral's units standing counts; no card that strikes added to the piles, a hazard or a challenge; then the population after, highest first; then the stocks' sum after, highest first; ties fall to the order dealt. An entry refused is never a candidate. Its fallback is the idle's gambit as it stands.
- Gambit 2 sums the settle tile's yield with the yield of each of its six neighbours the map holds, through the rules' yield on each, among the tiles the city's card admits; the nearest the map's centre of equals, ties in tile order. Gambit 3 plays each remaining settle card, hand order, on the tile at distance one from the city the card admits that yields most, every resource together, ties in tile order.
- Gambit 4 plays a card of the hazard kind the refusal lets through, hand order; the play is aimed at nothing.
- Gambits 5 and 6 read the city's own question for a tile, the one city mode asks, and the drag's for a reassign. Order of tiles: the most food, then the most of everything together, then tile order. Gambit 6 reassigns from the worst worked tile to the best free held one only where the free one is strictly better in that order, so it ends.
- Gambit 7 reads the tiles the city may claim through the same question, affordable ones only; the most of everything together, then the nearest a charted tile not held that yields strictly more than it, then tile order.
- Gambit 8 reads the enemies in sight, the units acting as enemies whose tile the rules' sight set holds, and whether one could reach the worker next phase: a tile within its range of the worker's among the landings the rules give that enemy read with its move points at its move, since its own are spent by its phase. The worker moves to its landing nearest the city's tile, only where strictly nearer than where it stands.
- Gambit 9 weighs, for a worker holding move points and action, each landing and its own tile against each card in hand a worker's action goes to, the worker read as standing on the tile, as the neutral's worker reads it: a card that places something by what its trial there adds to that tile's yield, the most food then the most together; a card that gains at once by what its trial adds to the stocks' sum. A placing card beats a gaining one, as the ladder's order says; the worker moves only where the best landing strictly beats its own tile; ties the cheapest landing, then tile order.
- Gambit 10 plays, among the placing cards in hand on the tiles their aim admits now, the play adding the most to that tile's yield in the same order, the nearest the city of equals, tile order after; a play adding nothing is still a play. A card places something where its aim says so, the flag the rules' building and improvement aims set.
- Gambit 11 plays, among the cards in hand a worker's action goes to that place nothing, the trial raising the stocks' sum the most, and never a trial after which any tile's yield, every resource together, is lower than before; ties in tile order.
- Gambit 12 moves a worker holding move points and action, for which 9 to 11 answered nothing, to its landing outside the border yielding the most, every resource together, only where strictly more than its own tile; ties the cheapest, then tile order.
- Gambits 13 and 14 count the player's units by what they do, workers and the rest; "no held tile is free" is the city's assign question answering nothing while a population is idle. The unit card is the first in hand order whose trial enters a unit of the kind asked, read on the unit the trial adds.
- Gambit 15 reads a unit's landings and the targets in sight through the by-hand question the screen asks, keeps the landings the city holds and the unit's own tile where held, and among the targets within the unit's range from one of those takes the least health, ties in tile order; where the unit stands on such a tile it attacks, else it moves to the cheapest such landing and the walk restarts, the attack following. A unit with no action answers nothing.
- Gambit 16, for a unit that attacks with move points and nothing from 15: among its landings within five tiles of the city's own tile, the one whose move's trial charts the most tiles for the first time, the snapshots grown, at least one; ties the cheapest, then tile order. Charting none: to the free held tile that is not the city's nearest the city's own, only where strictly nearer than where it stands or where it stands on the city's tile or outside the border; outside the border with no held landing, the landing nearest the city's tile where strictly nearer. So a unit at rest answers nothing and the walk goes on.
- Gambit 17 plays the first card in hand order aimed at nothing, not a hazard, the refusal lets through and whose trial leaves the stocks' sum or the population higher. A unit card is aimed at nothing too and never qualifies: its trial lowers both.
- Gambit 18 plays the first card in hand order aimed at the hand, on the first hazard in the hand, else on the hand's first other card. Next to last, so nothing above it still lands and the hand holds what nobody plays.
- Gambit 19 is the idle's end of turn, the same gambit object.
- The persona's numbers, three workers, two units that attack, five tiles, are literals in the persona, not content and not named constants: each stands in one sentence.
- On the settle phase every gambit from 4 on may be asked; whatever the rules refuse is dropped, and a city standing with nothing idle and no culture answers nothing to them.

The reconcile: the sum of a tile's yield becomes one, in the rules, the script and the persona both reading it; the deal's fallback and the end of turn go through the idle's gambits as they are; the attack's target goes through the least-health and by-hand questions the rules export as they are; the richest-tile orderings stay apart from the neutral's script, the builder's food-first order being the neutral's by reading and not by code; the walk stays apart from the enemies' routes, meant, the player's knowledge; the garrison's rest stays apart from the neutral's wander, meant, determinism.

**Traps:**

- The driver drops a command whose chronicle is the one it started on and restarts the list from the top after every command landed, and stops a turn at a hundred commands. A gambit that would answer the same command on the chronicle its own command left loops to that cap: every move above is "strictly" nearer, better or more for that reason, and a unit or a population already placed answers nothing.
- `reachable` in `src/rules/units.ts` reads the unit's own `movePoints`; an enemy's are spent after its phase. Gambit 8 hands it a copy of the enemy with its move points at its move. `byHand` in `src/rules/chronicle.ts` answers no landings and no targets on the settle phase.
- The page's rule on trials that draw: `apply`'s stages leave `chronicle.rng` as it was where nothing drew; a trial that drew is told by the generator differing. A raid, a camp placed and a feature dealt near a city draw; a hazard added to the draw pile's top, a stock taken and a war declared do not.
- `declaresWar` resolves the command in full, a second `apply`; it is the one choke point for the builder's rule and is asked of the command before it is answered, never after.
- A `take` on a capture's deal adds cards and moves no stock; every entry ties on gambit 1's reading and the first in the order dealt is taken.
- A settle card entering a unit is aimed at a tile the unit can stand on with no unit standing there; the city's card is the hand's first on the settle phase and gambit 2 answers while `chronicle.city` is undefined, gambit 3 after.
- `admitted` and `refuses` in `src/rules/chronicle.ts` and `src/rules/cards.ts` are asked with a worker standing on the tile; a card played through a worker answers `no-worker` on any other tile, which is why gambit 9 asks them of a copy with the worker moved, as `src/content/scripts.ts` does for the neutral's worker today.
- The `places` flag on a tile aim is set by `builds` and `placesImprovement` alone; a worker action that gains at once, such as the Nomadic Age's, carries none.
- The sum of a tile's yield is private to `src/content/scripts.ts` today, three lines, used by the neutral's claims, assigns and build; it moves to the rules in the line's first commit and the script's three readers import it; a tool imports `src/rules/` and never `src/content/scripts.ts`.
- A unit card's effect names the unit it enters and nowhere else, so a gambit learns what a unit card enters only by its trial, reading the unit the trial adds.
- The `sim` skill reads no persona's name from the code: `--personas` is how a session learns them.
- `tools/sim.test.ts` holds the idle's and the driver's tests on the fixture; the fixture catalogue in `src/rules/fixtures.ts` holds a settle, worker, building and improvement cards, a hazard and a camp; a gambit's test is one choice a player could state, on fixture numbers, never on the game's content.
- Prettier keeps every markdown paragraph on one line; `npm run lint` refuses a wrapped one.

**Plan:**

1. The sum of a tile's yield, every resource together, moves from `src/content/scripts.ts` into `src/rules/yields.ts`, the script's three readers importing it; its own commit, `npm test` green, nothing of play changed. Leaves the one sum in the rules.
2. `tools/personas.ts`: the builder, its nineteen gambits in order with the sentences above, the war check over every candidate, the idle's deal fallback and end of turn reused. Leaves `--persona builder` and `--personas` working on the game's content.
3. `tools/sim.test.ts`: one test per gambit's choice on the fixture, and one that the builder's every command is one that declares no war on a fixture where a claim's or a move's candidate would. Leaves `npm test` green.
4. `docs/SIMULATOR.md` as the Spec writes it. Leaves the page saying what the builder is.
5. `workflow/BOARD.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. On the game's content: `npm run sim -- --personas` printing the builder's nineteen sentences as written; `npm run sim -- --persona builder --seeds 20 --out <scratchpad>/builder-nomadic.csv` and `npm run sim -- --age stone --region temperate --persona builder --seeds 20 --out <scratchpad>/builder-stone.csv`, each read with the skill's endings query, the stops reported first with their seeds, and one seed of each traced with `--trace`, the trace read for a gambit answering against its sentence; the numbers go to the hand-back as numbers. No spec proves the line: it never reaches the screen. CI's specs on the push: none walk `tools/`; the suite runs as on every push.
