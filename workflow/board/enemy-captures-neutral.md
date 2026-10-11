# An enemy captures a faction's city

**Line:** **An enemy captures a faction's city** — an enemy that prepares on the neutral's city's tile and still stands there when the next enemy phase begins captures it: the neutral's border, population and stocks go as when the player captures it, nothing is dealt, the age's camp stands in its slot held by the enemy that took it as its guard, and its relations with the player stand as they were, under one test on the fixture; the raider goes for the nearer city by its own walk and prepares the capture on either's tile, under one test beside it; a city's tile yields nothing while an enemy occupies it, or, hostile, a unit of the neutral's on the player's tile and one of the player's on the neutral's; the catalogue refuses an age whose camp does not stand on every terrain its neutral's city's building stands on; the pages say so. Doc-impact: `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/ages/STONE.md`.

**Spec:**

- `docs/CHRONICLE.md` _The turn_, item 7. "resolves what it prepared, the player's city's capture ahead of every pillage;" becomes:

  > resolves what it prepared, a city's capture ahead of every pillage, the player's ending the chronicle on the spot;

- `docs/CHRONICLE.md` _Units and combat_, the bullet "Enemies hurt the player's city by standing on it." Its first two sentences, "**Enemies hurt the player's city by standing on it.** A tile it holds yields nothing at income while an enemy **occupies** it." become:

  > **A unit hurts a city by standing on it.** A tile a city holds yields nothing at income while a unit **occupies** it: an enemy on a tile either city holds, and, hostile, a unit of the neutral's on a tile the player holds and one of the player's on a tile the neutral holds.

  Its sentence "When the next enemy phase begins with that enemy still standing there, what it prepared lands before anything else of the phase: on the player's city's tile that city is captured; on any other tile the enemy **pillages** it, …" becomes, the rest of the sentence unchanged:

  > When the next enemy phase begins with that enemy still standing there, what it prepared lands before anything else of the phase: on a city's tile that city is captured; on any other tile the enemy **pillages** it, …

- `docs/CHRONICLE.md` _Enemies and camps_, first paragraph. "An event's answer may place a camp too, and a placed camp is a camp in everything: it rolls its own enemies, it is a raid's door, and its capture deals the same rewards." becomes:

  > A camp comes to stand in two more ways, placed by an event's answer or left where the neutral's city fell to the enemies, and a camp is a camp in everything however it came to stand: it rolls its own enemies, it is a raid's door, and its capture deals the same rewards.

- `docs/CHRONICLE.md` _The neutral_, first paragraph. "A pillage prepared on a tile the neutral holds lands as on the player's, and never on its city's own tile, where an enemy prepares nothing." becomes:

  > A pillage prepared on a tile the neutral holds lands as on the player's, and never on its city's own tile, where an enemy prepares its capture.

- `docs/CHRONICLE.md` _The neutral_, last paragraph. "and by a unit of the player's alone — its own guard resting on its tile and an enemy standing there capture nothing." becomes:

  > and by a unit of the player's alone — its own guard resting on its tile captures nothing, and an enemy standing there captures nothing by standing.

  After that paragraph, which ends "nothing enters for a city that has fallen.", add a new paragraph:

  > The enemies destroy the neutral too: an enemy that prepares on its city's tile and still stands there when the next enemy phase begins captures it, as the player's city is captured. Its population, its stocks and its border go as when the player captures it, and nothing is dealt; its building leaves the map and the age's camp stands in its slot, held by the enemy that took it, which is that camp's from then on and carries its guard's script, so a camp stands where the neighbour stood. Its relations with the player stand as they were, and its units of no city keep acting by their scripts, which say what each does of no city. An age whose camp does not stand on every terrain its neutral's city's building stands on is a defect of the content, refused before any chronicle is dealt. The neutral's city left empty was rejected: a village the raiders took would hand the player its land free of a war declared and of its guards.

- `docs/GLOSSARY.md`, the **occupy** row's meaning becomes: "What a unit does to a tile a city of another faction holds, by standing on it: the tile yields nothing and is not claimable." Its _Not_ column stays.

- `docs/ages/STONE.md` _The neutral_, first paragraph. After its last sentence, "Hostile, guard and wave alike go for the player's city as the raider does, attacking what they can on the way and preparing the capture on its tile.", add in the same paragraph:

  > Of no city at peace, a guard stands where it is and attacks what it can, and a wave goes for the camps still, its own fallen village among them.

  Second paragraph: "Its fall deals three rewards," becomes "Its fall to the player deals three rewards,".

- `docs/ages/STONE.md` _The camps_. "**Guard** and **raider** are the Nomadic Age's, the raider crossing the water on its way, embarking where the ground ends and disembarking where it begins." becomes:

  > **Guard** and **raider** are the Nomadic Age's, the raider crossing the water on its way, embarking where the ground ends and disembarking where it begins, and going for the nearer of the cities its walk reaches, the player's or the neutral's, preparing the capture on either's tile, so the neutral absorbs raids; a unit of the neutral's that goes as the raider goes for the player's city, the one not its own.

- `docs/ages/NOMADIC.md` stays: the age has no neutral, so its raider goes for the player's city as the page says.
- No player-facing text: the unit prepared on the neutral's city's tile reads Capturing through the state line that stands; the camp's mark and the neutral's rows leaving are drawn from the state as today.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/ages/STONE.md`.

**Scope:**

- In: an enemy's prepare admitted on the neutral's city's tile and landing at the next enemy phase as the neutral's fall, grouped as a `capture` carrying the tile: the slot retiled to the age's camp's building, the neutral's rows gone as the standing fall takes them, the capturer made the camp's guard — its script the camp's guard's, its camp the tile, its prepare gone — and nothing dealt; the relations row untouched; the catalogue refusing an age whose camp does not stand on every terrain its neutral's city's building stands on; the raider going for the nearer of the cities its walk reaches, by its walk's weight, and preparing on either city's tile, a unit of the neutral's going as the raider going for the player's city alone; a tile of the neutral's yielding nothing under a unit of the player's while hostile, and the player's reading unchanged; the three page edits and the glossary row; the one overturned test clause rewritten.
- Out: the pillager, which goes on sparing a city's own tile and raids with nothing left to go for; the Nomadic page; any mark on the screen for an occupied tile or for the neutral's fall; the camp's numbers, odds and wave once it stands where the village stood, which are the camp's content; the fixture's own raider-like script, which prepares on the player's city alone; a reward for the enemies' capture; the raid's door, which is drawn as today.
- Corner cases decided here: the capture lands ahead of every pillage of the phase, and the player's city's capture, where both are prepared, ends the chronicle on the spot so the neutral's never lands; a capturer killed before the phase prepared nothing, as today; the improvements on the village's tile stay, as they stay when the player captures it; a hostile neutral unit on its own city's tile prepares nothing there, a `runtime-error` as today, since it goes as the raider for the player's city alone; the raider whose walk reaches neither city goes for the player's as today, standing where it is; the raider reads its target afresh each phase, so it may turn toward the other city as it walks; the neutral's wave of no city may walk onto the camp that stands where its village stood and capture it as any camp, the camp leaving and dealing nothing; nothing enters for the fallen neutral, as today; an enemy merely standing on the neutral's city's tile through the enemy phase captures nothing, as a prepare is what captures a city.
- Reconcile: the enemies' capture goes through the standing fall of the neutral with who captured as its parameter, the player's emptying the slot and dealing, the enemies' leaving the camp and dealing nothing; the camp left where the village stood goes through the design's "a camp is a camp in everything", widened to however it came to stand, and is placed through the one way a building fills a slot; the capturer's script changes as a wave changes one, its camp set with it; the raider's target goes through the nearest-by-walk door the pillager and the neutral's wave already pick theirs from; the prepare on the neutral's city's tile goes through the one prepare, its landing read on whose city stands there; the occupation becomes one rule read for either city, the player's reading as it stands.

**Traps:**

- `prepared` in `src/rules/chronicle.ts` admits a prepare on the player's city's tile or on a tile a pillage takes something from, and `preparesLanded` there turns any `capture` into the player's fall; `preparedAs` in `src/rules/enemies.ts` answers `pillage` for a unit prepared on the neutral's city's tile, a branch nothing reaches today, and `src/ui/infopanel.ts` reads it for the Capturing and Pillaging line.
- `captured` and `fallenWith` in `chronicle.ts` are the standing fall: `leftTheMap` empties the slot, `neutral-fallen` takes the rows. `captured`'s enemy branch stays as it is: standing captures nothing. `built` in `src/rules/cards.ts` is the one way a building fills a slot, the one `campsPlaced` in `src/rules/schedule.ts` uses.
- `RAIDER` in `src/content/scripts.ts` is one object both ages name (`scripts` in `src/content/nomadic.ts`), borrowed by the pillager with nothing to go for, by a guard of no camp or embarked, and by the hostile neutral's guard and wave; its `acts` prepares on `cityOn === 'player'`. `nearestByWalk` there is the door the pillager and the neutral's wave pick a target through; `walkedTo` takes the target tile. A unit of the neutral's on its own city's tile must never answer a prepare.
- The change names and the group names are closed sets in `src/rules/stages.ts`; `src/ui/map.ts`, `hand.ts`, `piles.ts`, `resource-bar.ts` and `overlay.ts` switch over them without a default, so a change name added for the capturer's row is named by `npm run check` at each listener; `wave-sent` is the precedent for a unit's script changing and is ignored by every listener.
- The catalogue's camp checks sit in `src/rules/catalogue.ts` beside the one that every camp terrain takes an opening kind; the fixture's `PH_Camp` and `PH_Hamlet` share plain, forest and hills, and the Stone Age's `stone-camp` and village share four terrains, so the new check passes on both.
- `occupied` in `src/rules/city.ts` reads the player's tile through `actsAsEnemy` and the neutral's through `faction === 'enemy'` alone; nothing on the screen reads the neutral's yield.
- Tests the decision touches: `src/rules/enemies.test.ts` "the neutral's city's tile is never pillaged … and an enemy prepares nothing there" loses its last clause, the pillage half standing; "the neutral's guard resting on its city's tile, and an enemy standing there, capture nothing" stands; `src/content/scripts.test.ts` "a pillager … never for the neutral's city's tile" stands, and the raider tests there run on fixtures holding no neutral, so they stand. `PREPARING` in `enemies.test.ts` is a fixture script that prepares wherever it stands.
- Specs entering a raider — `e2e/archer.spec.ts`, `attack.spec.ts`, `console.spec.ts`, `map.spec.ts`, `pillage.spec.ts` — are CI's; one running on a chronicle holding a neutral nearer than the player's city by the raider's walk would see it turn. `pillage.spec.ts` enters its raider on the player's city's tile, where it stands.
- `DOGMAS.md` _Testing_: the fall to the enemies is a mechanism, one test on the fixture through the end of turn; the raider's choice of city is content that decides, one test beside the script on the fixture's ground; the catalogue's refusal is one test on a fixture catalogue.

**Plan:**

1. `src/rules/catalogue.ts`: the refusal of an age whose camp does not stand on every terrain its neutral's city's building stands on. `src/rules/catalogue.test.ts`: the refusal on a fixture catalogue.
2. `src/rules/enemies.ts`, `src/rules/chronicle.ts`, `src/rules/stages.ts`: the prepare admitted on the neutral's city's tile and read as its capture; the landing through the standing fall with the camp in the slot and the capturer its guard, grouped as a `capture` on the tile, nothing dealt. `src/rules/enemies.test.ts`: the capture through the end of turn — the group and its changes, the camp's building on the tile, the neutral gone, the capturer's script and camp, its prepare gone, the deals empty, the relations as they were, the improvements standing; the overturned clause rewritten. `npm run check` names every listener a new change name reaches.
3. `src/rules/city.ts`: the occupation read for either city. `src/rules/city.test.ts`: hostile, a tile the neutral holds under a unit of the player's yields nothing.
4. `src/content/scripts.ts`: the raider's target and its prepare on either city's tile, a unit of the neutral's going for the player's city alone. `src/content/scripts.test.ts`: the neutral's city chosen when nearer by walk and the capture prepared on its tile; the player's when nearer; the hostile neutral's guard going for the player's city with its own nearer.
5. `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/ages/STONE.md`: the sentences above, verbatim. `npm run fmt`.
6. `workflow/BOARD.md`: the line deleted, this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — the line reaches the screen through readings that stand. CI proves on the push: `neutral`, `camps`, `pillage`, `fall`, `sites`, `attack`, `archer`, `map`, `console` and the rest of the suite.
