# The neutral's units

**Line:** The neutral's units — the neutral is a faction of units: where it acts in the enemy phase its units act first, each by its script through the loop an enemy acts through, then its city claims, then it enters one unit on its tile through the unit card's rule, its script naming the card and the kind kept near a ratio its content names; its guards keep the tiles it holds and, as a camp sends its wave, enough of them leave together for the nearest camp; at peace they attack no unit of the player's and neither land on nor cross a tile the player holds, and the enemies and the neutral's units attack one another within reach; the map draws its units in the neutral's colour. Done when: the rules tests hold the entry, the act order, the landing filter and the wave on the fixture; the scripts' choices each have their test beside the script; the catalogue's coherence test reads the neutral's scripts and cards; the proof spec sees a unit of the neutral's drawn in its colour and its card named; the four pages say so.

**Spec:** `docs/CHRONICLE.md` _The turn_ and _The neutral_, `docs/CHRONICLE-SCREEN.md` _The pointer and the tile's marks_, `docs/GLOSSARY.md` the **cost** row, `docs/ages/STONE.md` _The neutral_ and _The technologies_. The sentences, written out:

- `docs/CHRONICLE.md` _The turn_, item 7: "then the neutral acts, its city and its units by its script;" becomes "then the neutral acts, its units and then its city, by its script;".
- `docs/CHRONICLE.md` _The neutral_, first paragraph, after "A card played through a worker lands on no tile the neutral holds, its city's included." add: "Where the neutral acts its units act first, then its city claims, then it enters one unit on its tile as the player's city plays a unit card: its script names the card, the card's cost is paid out of the neutral's stocks, one idle population becomes the unit and never its last, and its tile must be free; a unit entered waits for the next enemy phase, as an entered enemy does."
- `docs/CHRONICLE.md` _The neutral_, second paragraph, "Its units act where the enemy phase says the neutral acts, each by its script; at peace they attack nothing, and no unit of another faction passes through them." becomes "Its units act where the enemy phase says the neutral acts, each by its script, moving, embarking and attacking as an enemy does by its; at peace they attack no unit of the player's and neither land on nor cross a tile the player holds, and no unit of another faction passes through them. The enemies and the neutral's units attack one another within reach. The neutral keeps guards and sends waves as a camp does: its content names which script is its guard and which its wave, and how many guards gathered send how many, the guards off its city's tile leaving first, in the order they entered." The sentence "They go for the camps: …" stands as written.
- `docs/CHRONICLE-SCREEN.md` _The pointer and the tile's marks_: "The neutral's city's mark and the ring on every tile it holds are in the neutral's colour." becomes "The neutral's units, its city's mark and the ring on every tile it holds are in the neutral's colour."
- `docs/GLOSSARY.md` **cost**: "What the player's city pays out of its stocks to play something, for example a card." becomes "What a city pays out of its stocks to play something, for example a card."
- `docs/ages/STONE.md` _The neutral_: "Its units are the age's own, and its script keeps it growing and sends its warriors at the camps: it claims the tile that yields most among those it may claim, the nearest to its city of equals." becomes "Its units are the age's own, warriors and archers, entered as the player's unit cards enter them and kept near two warriors to one archer, the kind whose share falls shortest entered first and the warrior of equals; its script keeps it growing and sends its warriors at the camps: it claims the tile that yields most among those it may claim, the nearest to its city of equals. Its units follow one of two scripts. **Guard** keeps the tiles its city holds: it attacks an enemy it can reach from inside the border, walks inside it toward one it sees, otherwise wanders inside, rests on its city's own tile only while no other tile it holds is free, and never embarks. Once enough guards stand, some leave together as a **wave** for the nearest camp, crossing the water as the camp's enemies do and attacking the enemies they can reach on the way; with no camp standing, a wave unit stands where it is."
- `docs/ages/STONE.md` _The technologies_, Bow and arrow: "the enemies killed by a Scout's attack" becomes "the units killed by a Scout's attack".
- Player-facing text: the goal entry `goal.bow-and-arrow` becomes `Kill {need} units with a [player:scout]`. No other entry: a unit of the neutral's is headed by its kind's name as any unit is, with no state line.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/GLOSSARY.md`, `docs/ages/STONE.md`.

**Scope:**

In:

- The neutral is a third faction of units. A unit of the neutral's carries a script as an enemy does, no prepare and no camp. It stands in the fog's snapshot as any non-player unit does, blocks the player's claim on its tile and the player's units' passage by the standing rules, counts toward the neutral's growth threshold by the standing rule, and is attacked by a unit of the player's by the standing combat rule, which this line gives no consequence.
- The act: where the neutral acts, after the waves and before the enemies act, each of its units standing when the phase began acts in unit order through the loop an enemy acts through, the script's move, the embark or disembark step, then attack or nothing for each of its action; a prepare answered by a neutral's script is a `runtime-error`. Then its city claims as today. Then it enters one unit.
- The entry: the neutral's script names a unit card of the catalogue, or none; the unit enters through the unit card's rule with the city as the parameter: the card's cost out of the neutral's stocks, one idle population taken and never its last, its city's tile free; a block or a cost unpaid enters nothing and raises no stage. At most one unit enters where the neutral acts. The script names the kind whose share of the neutral's units standing falls shortest of the ratio its content names, the warrior of equals.
- The wave: the neutral's content names its guard script, its wave script and a wave, how many gathered send how many; where its guards standing ashore are as many as gathered, as many as sent leave together with the wave script, the ones off the city's tile first in unit order and the one on it last, through the door the camp's wave goes through, the owner the parameter. A neutral naming no wave sends none.
- The landing filter: a unit of the neutral's at peace neither lands on nor crosses a tile the player holds; the filter lives on the one door every walk reads landings from, with the uncharted filter the player's units carry.
- The scripts, content: the Stone Age's neutral guard and wave as _Spec_ says, each decision tested beside the script on the fixture's ground; the fixture's neutral names a guard, a wave script and a wave of the fixture's own.
- The Stone Age's numbers, tuning: the wave gathered 6 and sent 3; the ratio two warriors to one archer; the cards the warrior's and the archer's at the player's costs.
- The catalogue refuses, before any chronicle is dealt: a neutral script the catalogue does not hold, a wave with a gathered below one or a sent below one or above gathered, as the camp's are refused, a card the script could name that is no unit card.
- The screen: the neutral's units' marks in the `neutral` colour entry, live and in fog; the panel's unit card for one of them headed by its kind, reading its stats, no state line; the glow a unit of the player's raises on one it can attack is the standing glow.
- The save writes and reads a unit of the neutral's with its script, refusing a script the catalogue does not hold as it refuses an enemy's.

Out, decided here:

- The neutral's workers and what they play: the board line **The neutral's workers**, placed by this intake after the fall.
- A unit of the neutral's standing on a camp or a site through the enemy phase captures nothing: the next line.
- Anything of hostility: a unit of the player's attacking a unit of the neutral's, or stepping onto a tile it holds, changes nothing of the neutral: the stance line. The neutral's units never attack the player's in this line.
- A neutral's script answering a prepare, and what a hostile unit does on the player's city's tile: the stance line.
- Card text naming a unit kind for the neutral: no reference kind is added; no text names one.
- The debug console enters the player's units alone, as today.
- Save compatibility: a save from before this line holds no unit of the neutral's and loads as it did.

Corner cases decided:

- The neutral's claim and its entry both take its idle population; the claim comes first. Measured on the Stone yields, the order moves nothing: four warriors by turn 30 either way, each raising the growth threshold.
- The warrior and the archer cost the same in the Stone Age, so the ratio alone decides the kind; a kind the stocks cannot pay for enters nothing that phase, and the script does not fall back to the other.
- The guard counts every unit under the guard script standing ashore, wherever it stands, as the camp's wave counts its guards.
- A guard entered on the city's tile with no other held tile free stands there and blocks the next entry until it steps off; with one tile held, at the opening, that is where it stands.
- The wave's camp is the nearest by the unit's own walk, ashore and embarked, ties in tile order; a camp no walk reaches is no target. A wave unit with no camp to go for stands where it is and attacks what it can reach.
- An enemy walks onto a tile the neutral holds and occupies it as today; a unit of the neutral's on a tile the player holds cannot happen at peace.
- A unit of the neutral's killed by a Scout's attack counts for Bow and arrow: the tally reads the attacker alone, as it does today.
- An event's terraform kills a unit of the neutral's standing on a tile its kind cannot stand on, whatever its faction, by the standing rule.

Reconcile, each likeness and what was chosen:

- The camp's wave and the neutral's: one door, the owner the parameter — the camp's tile and its guard script against the neutral's city's tile and its guard script. The camp's "guards of this camp" reads the unit's camp; the neutral's reads the faction. The rest, the count ashore, the order of leaving, the script switched, is the same.
- The enemy's acting loop and the neutral's unit's: one loop, the faction the parameter; the neutral's units act before the enemies, in unit order among themselves.
- The unit card's rule and the neutral's entry: one pair, block and effect, with the city as the parameter; the player's play goes through it unchanged.
- The camp's guard script and the neutral's: two scripts, the area kept differing — a radius around a tile against the tiles a city holds — sharing the helpers under them; whether one helper takes the area is the implementer's.
- The raider's walk and the wave's: the wave walks to a camp by the raider's walk with another destination; the landing filter is the one difference, carried by the door every walk reads.

**Traps:**

- `Faction` in `src/rules/units.ts` is a closed union read by `switch` sites that the typecheck guards: `factionOf` and `unitOf` in `src/rules/save.ts`, `standing` in `src/rules/fixtures.ts`, `entered` in `src/rules/catalogue.ts`, and `FACTION_COLOURS` in `src/ui/map.ts`, a `Record<Faction, number>` with `LOOK.neutral` already standing for the city. `CityFaction` in `src/rules/state.ts` is `'player' | 'neutral'`; the neutral is both a city faction and a unit faction, and `growthThreshold` in `src/rules/city.ts` already counts `unit.faction === whose`.
- `Unit`'s enemy arm carries `script`, `prepared` and `camp`; `Entering` in `src/rules/catalogue.ts` mirrors it. `canAttack` in `src/rules/units.ts` reads only "another faction", so the player's and the neutral's attack one another already; the neutral's acts must filter the player's units out in this line.
- `reachable` in `src/rules/units.ts` is the one door every walk reads landings from, the player's charted filter inside it; the enemies' walks in `src/content/scripts.ts` read it too, and `routesFrom`/`routesToward` in `src/rules/map.ts` weigh the whole map with no faction read. The filter on the player's held tiles goes on `reachable`'s callback, not into the route weights, or the wave's camp choice and the guard's target choice drift apart.
- `enemyActs` in `src/rules/chronicle.ts` reads `enemyScript(catalogue, found.script)` and refuses any faction but the enemy's; `enemyPhase` there holds the order: prepares, waves, the neutral's claims, each enemy in unit order, the camps' roll. The neutral's units act between the waves and the enemies, before the claims.
- `wavesSent` in `src/rules/enemies.ts` reads `camp.scripts` and `camp.wave` off the age's camp and matches guards by `campAshore(unit)`; `ageHeld` in `src/rules/catalogue.ts` validates the camp's wave and its scripts, and must validate the neutral's the same way, one rejection vocabulary.
- `enters(type)` in `src/rules/cards.ts` is the unit card's rule, `chronicle.population`, `idle(chronicle)` and `chronicle.city` hard-wired to the player; `populationTaken` in `src/rules/city.ts` is the player's too, while `cityRows`/`withCityRows` in `src/rules/state.ts` show the shape that serves both cities. The neutral's entry reads the card's cost through `costOf` and `unaffordable` against its own stocks.
- `NeutralScript` in `src/rules/catalogue.ts` holds `claims` alone; the Stone content is `VILLAGER` in `src/content/scripts.ts`, the fixture's `FIRST_OFFERED` in `src/rules/fixtures.ts`, and `src/rules/city.test.ts` builds a straying neutral script inline. The enemy scripts' decisions are tested in `src/content/scripts.test.ts` on `besideTheNeutral` and the camp fixtures.
- `guarding(radius)` in `src/content/scripts.ts` keeps a camp's radius and draws its wander from the generator; `walkedTo` there is the raider's walk; `goesFor` weighs a pillager's target by its walk. `enemyMoves` reads the camp's embarked move for any unit handed in.
- `enemiesKilledBy` in `src/rules/chronicle.ts` reads the attacker alone; it stays so. The goal's entry is `goal.bow-and-arrow` in `src/ui/text.ts`.
- `taken` in `src/rules/sight.ts` keeps every non-player unit in the snapshot; nothing to add. `occupied` in `src/rules/units.ts` reads the enemy alone and stays so.
- `unitMark` in `src/ui/map.ts` is the one way a unit is drawn; `infopanel.ts` reads a unit's faction for its mark and its state line, which reads `prepared` off the enemy arm alone. The `ReferenceKind` union in `src/ui/text-run.ts` names `player` and `enemy` for card text and gains nothing.
- The proof spec builds its chronicle headlessly: `settledOn` in `e2e/chronicle-screen.ts`, the unit planted through `entered` with the neutral faction on its city's tile — the helper a card's effect composes — and `fillOf`/`reading` read a mark's fill. `standing(page, 'unit-<key>')` names a unit's mark.
- For `src/ui/` and `e2e/`: `docs/PHASER.md`, read before any Phaser claim; a spec rests before it presses or measures.

**Plan:**

1. `src/rules/units.ts`, `src/rules/catalogue.ts`, `src/rules/save.ts`, `src/rules/fixtures.ts`, `src/ui/map.ts`, their tests: the neutral is a faction of units, entered, saved, read and drawn; the catalogue's neutral names its scripts and its wave and is validated as the camp's is. Leaves standing: a unit of the neutral's exists, every switch over the faction takes it, the typecheck green.
2. `src/rules/units.ts` and its tests: a unit of the neutral's at peace neither lands on nor crosses a tile the player holds. Leaves standing: the landing filter proven on the fixture.
3. `src/rules/cards.ts`, `src/rules/city.ts`, `src/rules/catalogue.ts`, their tests: the unit card's rule takes the city as a parameter and the neutral enters one unit through it where it acts, its script naming the card. Leaves standing: the player's unit cards unchanged, the neutral's entry proven.
4. `src/rules/enemies.ts`, `src/rules/chronicle.ts`, their tests: the acting loop takes the neutral's units before the enemies, the wave door takes the neutral's city as an owner, the order within the neutral's act as _Spec_ says. Leaves standing: the enemy phase proven on the fixture with the neutral's units acting and its wave sent.
5. `src/content/scripts.ts`, `src/content/stone.ts`, `src/content/scripts.test.ts`, `src/rules/catalogue.test.ts`, `src/ui/text.ts`: the Stone Age's guard and wave scripts, its ratio and cards, the wave's numbers; each decision tested beside the script; the goal entry. Leaves standing: the content standing in its catalogue, the coherence test passing.
6. `e2e/neutral.spec.ts`: one test added, a unit of the neutral's drawn in the neutral's colour and its card named; `docs/` pages edited as _Spec_ says; the board line deleted with this file.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The one proof spec: `npx playwright test e2e/neutral.spec.ts`.
- CI proves on the push, listed for the hand-back and never run: `e2e/camps.spec.ts`, `e2e/pillage.spec.ts`, `e2e/attack.spec.ts`, `e2e/archer.spec.ts`, `e2e/move.spec.ts`, `e2e/embark.spec.ts`, `e2e/fog.spec.ts`, `e2e/map.spec.ts`, `e2e/inspect.spec.ts`, `e2e/archipelago.spec.ts`, `e2e/resume.spec.ts`, `e2e/tree.spec.ts`.
