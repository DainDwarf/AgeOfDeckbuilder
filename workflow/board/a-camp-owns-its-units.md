# A camp owns its units

**Line:** **A camp owns its units** — an enemy a camp enters carries its camp for good; the guard keeps that camp and none other, walking home from however far it stands ashore; the wave counts the camp's own guards ashore wherever they stand and its distance is gone; a capture leaves the camp's enemies no camp's, and a guard of no camp raids; a raid's enemies and the console's are no camp's; the rules tests prove each on the fixture and the pages say so.

**Spec:** `docs/CHRONICLE.md` _Enemies and camps_ and `docs/ages/NOMADIC.md` _The camps_. The base is the text the line "Pillagers enter from the camp's roll" leaves; its dossier's sentences are the ones edited here. Written out:

`docs/CHRONICLE.md`, the paragraph opening **Enemies enter from camps** gains, after "its capture deals the same rewards.":

> An enemy a camp enters — at the opening, by its roll, or through an answer that enters it on a camp the answer places — is the camp's, and stays so whatever script it comes to carry; a raid's enemies are no camp's, whichever door they come through.

`docs/CHRONICLE.md`, the paragraph opening **An enemy follows its script**: the clause "each camp standing counts the guards ashore within the distance its content names, each guard counted for the nearest camp alone, ties in tile order; where they are as many as its content names, as many as it names leave together as raiders, and act as such from that phase on." becomes

> each camp standing counts its own guards standing ashore, wherever they stand; where they are as many as its content names, as many as it names leave together as raiders, the camp's still, and act as such from that phase on.

and "How far, how many gathered and how many sent are the camp's content" becomes "How many gathered and how many sent are the camp's content".

`docs/CHRONICLE.md`, the paragraph opening **A camp is captured**: "A captured camp leaves the map, its slot empty, so it enters nothing again and is no raid's door;" becomes

> A captured camp leaves the map, its slot empty, so it enters nothing again and is no raid's door, and its enemies are no camp's from then on;

`docs/ages/NOMADIC.md`, _The camps_, the sentence opening "A guard keeps its camp" becomes:

> A guard keeps its own camp, the one that entered it: on the camp it stays; off it, however far, it walks back onto the camp while the tile is free; while a unit of another faction stands on the camp, it closes on that unit as on any other; and while a fellow holds the camp it closes on any unit of another faction it could attack from inside a small radius of the camp and wanders inside it otherwise — so a camp with one guard is held, and one with several has the rest roaming around it; a guard of no camp, its camp captured, raids.

`docs/ages/STONE.md` stands: "Embarked, a guard raids until it stands ashore" holds, and what it does ashore again is the guard's rule on the Nomadic page.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`.

**Scope:**

In:

- An enemy unit may name its camp, the tile it stands on; the player's units never do. Whoever enters a unit says whether it is a camp's: the opening and the camp's roll make the camp's units, and so does an answer entering units on a camp it has placed, the Nomadic _Make room_ and the fixture's encampment and siege among them. A raid's enemies name no camp, through a camp's door or the outer ring alike. The console's entry names none.
- The guard keeps the camp it names: on it, it stays; off it, from however far, it walks onto it while free and otherwise behaves as today around it, inside the radius its script names; a guard naming no camp acts as a raider, as a guard with no camp within its radius does today; embarked, it acts as a raider until ashore, as today.
- The wave counts the camp's own guards standing ashore, wherever they stand, and the wave loses its distance: the catalogue's wave names how many gathered and how many sent, and its check of the distance goes. The order of leaving, off-camp first in unit order and the one on the camp last, stands. A guard sent off as a raider keeps naming its camp.
- A capture clears the camp from every enemy naming it, in the capture's own group.
- The nearest-camp lookup goes, with every caller.
- Tests on the fixture: a guard keeps its own camp when another stands nearer; a guard far from its camp ashore walks toward it instead of raiding; a captured camp's guards name no camp and raid at the next phase; the roll's and the opening's enemies name their camp and a raid's name none, through a camp door too; the wave counts its own guards wherever they stand ashore, none embarked, none another camp's, none of no camp's, no enemy under another script, no unit of the player's; a chronicle with camps' enemies survives JSON.

Out:

- Any screen change: nothing shows a unit's camp.
- What a camp does with its units beyond this: patrol and responding to an attack are ideas.
- A raid through a camp's door becoming that camp's: the schedule rung revisits event raids.
- Saves: a save written before this line holds guards naming no camp, and they raid; pre-existing saves need no care before the Bronze Age.

Corner cases decided here:

- A camp placed on a tile a captured camp stood on adopts nobody: the capture cleared its enemies, and nothing else points there.
- A guard whose camp is held by a unit of another faction closes on that unit from wherever it stands, through the rule that already stands; only how it found the camp changes.
- Nothing removes a camp but a capture, so no enemy names a camp that is gone, and the guard reads its camp without checking the tile still holds one.

Reconcile: the nearest-camp lookup is the one standing thing that does this job, in the guard script and the wave count both; ownership replaces it in both and it is deleted. Nothing else in the tree does the job.

**Traps:**

- The dossier of "Pillagers enter from the camp's roll" ships first; its entry helpers take a unit entry's table and are what this line teaches to name the camp. The sentences this Spec edits are that dossier's, not today's page.
- A raid enters around its door through the same entry as the roll enters around its camp, and a raid's door may be a camp's tile: the caller says whether the entry is the camp's, never the tile.
- `src/rules/fixtures.ts` builds standing enemies without a camp through its `standing` and `sentry` helpers, and `src/content/scripts.test.ts` proves the guard on them; a guard built so names no camp and raids, so the guard tests name the camp on their units.
- `src/rules/enemies.test.ts` holds the wave tests around `gatheredAround`, which places guards around one camp by tile, and a test that a guard nearer another camp is not counted: that test's case becomes a guard of another camp's.
- The enemy half of the unit type is a union member with its script and its prepare; the camp sits there, optional, and the player's half never gains it. A save is the state serialised, so the field is plain data, a tile.
- `src/content/stone.ts` names the wave's distance through the guard's radius constant; the radius stays for the guard script and leaves the wave.
- `src/ui/console-line.ts` builds an enemy's entry with its script and no camp; it changes only if the entry type demands a value, and it must not.

**Plan:**

1. `src/rules/units.ts`, `src/rules/catalogue.ts`: the enemy's optional camp on the unit and on its entry, carried through the one way a unit enters; the wave without its distance and the catalogue's check of it gone. Leaves standing: the types, the content red on the wave.
2. `src/rules/enemies.ts`, `src/rules/chronicle.ts`: the opening and the roll entering the camp's units, an answer's entry on a placed camp able to, a raid's never; the wave counting the camp's own guards ashore; the capture clearing its enemies' camp; the nearest-camp lookup deleted. Leaves standing: the rules compiling, the guard script red.
3. `src/content/scripts.ts`, `src/content/stone.ts`, `src/content/nomadic.ts`, `src/rules/fixtures.ts`: the guard reading its own camp; the Stone Age wave without its distance; _Make room_ and the fixture's encampment and siege entering the camp's units. Leaves standing: `npm run check` green.
4. `src/rules/enemies.test.ts`, `src/content/scripts.test.ts`, `src/rules/catalogue.test.ts`: the tests Scope names, the wave's distance cases gone. Leaves standing: `npm test` green.
5. `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`: the Spec's sentences; `workflow/BOARD.md`: the line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: none; the line never reaches the screen.
- CI's on the push, listed for the hand-back: `camps`, `pillage`, `attack`, `archer`, `fog`, `map`, `fall`, `console`, `capstone`, `resume`, `continue`.
