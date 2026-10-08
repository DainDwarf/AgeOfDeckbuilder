# Pillagers enter from the camp's roll

**Line:** **Pillagers enter from the camp's roll** — every entry draws kind and script together from a unit entry's table of its own, the camp naming its opening's and its roll's and an answer naming the answer's; the Stone Age camp's roll table holds guard archer, guard warrior and pillager warrior, its opening table guard warrior alone; a wave leaves as raiders and the wave's own list of scripts is gone; one rules test proves the joint draw on the fixture, the coherence tests refuse a bad table, and the pages say so.

**Spec:** `docs/CHRONICLE.md` _Enemies and camps_, three paragraphs rewritten, and `docs/ages/STONE.md` _The camps_, its paragraph rewritten. The sentences, written out:

`docs/CHRONICLE.md`, the paragraph opening **A camp enters on its own too**: the clause "its kind drawn as any entry's" becomes "its kind and its script drawn as any entry's". The rest of the paragraph stands.

`docs/CHRONICLE.md`, the paragraph opening **What a camp enters is content** becomes:

> **What an entry enters is content**: every entry — the opening, the camp's roll, a raid, an answer — draws from a unit entry's table of its own, rows of a kind of unit and a script, each with a weight; each enemy's row is drawn seeded among them by their weights, one draw for each enemy, so a raid of several comes as a mix, and a table of one row draws nothing. The camp's content names its opening's table and its roll's, and an answer's content names the answer's. A table naming a kind or a script the catalogue does not hold, a weight not above nought or no row at all is a defect of the content, refused before any chronicle is dealt. Where the enemy lands is read on the kind drawn: a tile it stands on, reached on its own move ashore and the camp's embarked move on the water. A raid draws its enemies' rows before its door, and its door is read on its first enemy. The opening draws among the rows whose kind stands on the camp's tile, so every camp opens held; a camp lying on a terrain none of its opening's kinds stands on is a defect of the content, refused before any chronicle is dealt.

`docs/CHRONICLE.md`, the paragraph opening **An enemy follows its script** becomes:

> **An enemy follows its script**, the one the row drawn for it names; what a script does, whom it attacks, where it prepares, and whether it attacks from the city's tile rather than preparing the capture there, is content. The camp's content names which script is its guard, the one its wave counts, and which its raider, the one its wave sends. A camp sends its guards off in a wave: at the start of every enemy phase, once the prepares have landed and before any enemy acts, each camp standing counts the guards ashore within the distance its content names, each guard counted for the nearest camp alone, ties in tile order; where they are as many as its content names, as many as it names leave together as raiders, and act as such from that phase on. The guards off the camp's tile leave first, in the order they entered, and the one on its tile last, so a wave smaller than the band leaves the camp held. How far, how many gathered and how many sent are the camp's content, and a camp naming no wave sends none. So a camp's own enemies come as a band and not one by one, and a guard killed on the player's turn holds the wave back. A wave sent after the camp's roll, before the player's turn, was rejected: the band gathering is what the player answers. Scouting is how a chronicle learns where the enemy comes from.

`docs/ages/STONE.md`, _The camps_, its paragraph becomes:

> A camp is a rival band's, and it enters warriors and archers. They follow one of three scripts. **Guard** and **raider** are the Nomadic Age's, the raider crossing the water on its way, embarking where the ground ends and disembarking where it begins. Embarked, the camp's enemies cross the coast as slowly as the player's units do. The guard keeps the ground around its camp and crosses only once it raids. Embarked, a guard raids until it stands ashore. A raid through the map's edge enters ashore or embarked, as the edge the city is reached from is land or coast, so on the archipelago most raids out of the edge enter embarked. **Pillager** goes for the nearest, by its own walk, of the player's workers and of what they built, the improvements and the buildings, the city's tile and a camp's never, and no tile it would stand on only embarked; it attacks what it can on its way, and standing on something built with nothing to attack it prepares the pillage; with nothing left to go for it raids. A camp opens held by a warrior as a guard. Its roll enters a guard, a warrior the likelier and an archer otherwise, and rarest of all a warrior as a pillager, so a camp's own pressure is guards gathering and now and then one pillager walking out alone. A camp sends out waves: once enough guards stand within the guard's own radius of it, some leave together as raiders, the one holding the camp staying, so a raid out of a camp arrives as a band and not one warrior at a time.

`docs/ages/NOMADIC.md` _The camps_ stands as written: its camp opens with a guard, its roll enters a guard, _Keep to yourself_ and _Fight them_ enter raiders, _Make room_ enters guards, and every one of them a warrior.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Scope:**

In:

- The unit entry's table: rows of a kind of unit, a script and a weight, drawn seeded by weight, one draw per enemy, no draw for a table of one row. The camp names two, `opening` and `roll`; an answer that enters units hands the helper the table it draws from. The camp's record of scripts keeps the two roles the rules read, `guard` and `raider`; the `pillager` role leaves it, since a row names the pillager's script outright.
- The Stone Age camp's tables: opening `warrior` as `guard` at 1; roll `archer` as `guard` at 2, `warrior` as `guard` at 3, `warrior` as `pillager` at 1. The Nomadic camp's: opening and roll each `warrior` as `guard` at 1. The Nomadic answers': _Keep to yourself_ and _Fight them_ each `warrior` as `raider` at 1; _Make room_ `warrior` as `guard` at 1. The fixture camp and the fixture answers each a one-row table, the fixture tests' coverage of two-kind draws kept through a two-row table where they need one.
- The wave loses its list of scripts: a wave leaves under the camp's raider script, and the catalogue's `Wave` names `within`, `gathered` and `sent` alone. The test proving the wave's weighted script draw is deleted on the user's decision; the test proving a wave sends under one script, in order, stays and reads the raider.
- Coherence: a table with no row, a row naming a kind or a script the catalogue does not hold, or a weight not above nought is refused when the catalogue is built, in the one rejection vocabulary; a camp's terrains are checked against its opening table's kinds. The refusal replaces the runtime error "an entry asking for a script its camp names none of": no entry can ask for one any more, and that test goes with the case.
- The new mechanism test, on the fixture: a roll table of two rows of one kind under two scripts draws the script with the kind, seeded, the heavier row the likelier, the same seed drawing the same; and the opening draws among the opening table's rows whose kind stands on the tile.

Out:

- Archers in the Stone Age's raids. A Stone Age chronicle runs the Nomadic events, whose tables are warriors alone, so Stone Age raids hold no archer until the Stone Age's schedule rung writes the age's own events and their tables. Decided: Stone Age content does not hide in a Nomadic event.
- A door for an event's table in the design page: no page says an answer may name its own rows beyond the sentence above. The helper takes a table from whoever calls it, so the day an event wants rows of its own its intake writes them.
- A pillager's behaviour. It is the script already shipped: rolled with nothing built it raids, rolled on the camp's tile it walks off and the camp may stand empty, exactly as a camp whose guards all left.
- The console's line that enters a unit: it names kind and script outright, draws nothing, and does not change.
- Saves: a save holding a camp's wave or kinds needs no care before the Bronze Age.
- A camp owning its units, and the wave counting its own guards: the next board line.

Corner cases decided here:

- The roll's seeded draws move: a roll on a Stone Age camp makes one draw for its row instead of one for its kind, and the opening on a one-row table makes none where today it draws between two kinds. A replay of an old seed plays differently; nothing promises otherwise.
- The raid's door is read on its first enemy's kind as today; a table whose rows name several kinds still gives a raid of one archer a door a warrior would not take.
- `kind` and `script` in a row are ids of the shared tables, so a Nomadic answer's row names `warrior` and `raider` and resolves in a Stone Age chronicle.

Reconcile: the table's draw goes through the one seeded weighted pick the wave, the camp's kinds, the schedule's deal and the generator already use, as it is. The console's entry stays apart: naming the unit outright, with no draw, is the difference that is meant.

**Traps:**

- `src/content/stone.ts` builds its camp by spreading the Nomadic camp, so a field the Nomadic camp names and the Stone Age does not override is inherited; the Stone Age camp must name both tables itself.
- `e2e/chronicle-screen.ts` reads the camp's first unit kind off `unitKinds` for its fixtures (`campKind`), and `e2e/pillage.spec.ts` and `src/rules/enemies.test.ts` build a pillager through the camp's `pillager` role; once the role leaves the camp's scripts record they name the pillager's script id directly. Six e2e files reach the camp's kinds or roles: `pillage`, `archer`, `attack`, `fog`, `map`, and the shared `chronicle-screen.ts`.
- The fixture's siege capstone enters raiders on the camps it places through the on-camp entry, and the fixture's `PH_Encampment` answer and the Nomadic `make-room` enter guards around a placed camp; each now hands the entry its table. Both encampments carry a comment on why the first enemy lands on the camp's tile; it still holds and stays.
- The design holds the rule that the opening draws only among rows whose kind stands on the camp's tile; with a one-row opening table the filter still runs, and a camp on a terrain its one kind does not stand on is refused at the catalogue, as today, by the terrain check now read against the opening table.
- `src/ui/console-line.ts` checks a script against the catalogue's scripts table, not the camp's roles; it is untouched by the roles record shrinking.
- No fallback where a table draws nothing: a one-row table is the no-draw case the design names, and an empty table is refused at the catalogue, so no entry meets one.

**Plan:**

1. `src/rules/catalogue.ts`: the unit entry's table type; the camp's `opening` and `roll` in place of `unitKinds`; the camp's scripts record down to `guard` and `raider`; the `Wave` without its scripts and the wave-script types gone; the catalogue's checks of a table, the camp's terrains against the opening table, and the wave checks without the script ones. Leaves standing: a catalogue that refuses every bad table and no bad wave script, typecheck red on every caller.
2. `src/rules/enemies.ts` and `src/rules/chronicle.ts`: every entry draws a row from the table handed to it, the opening filtering rows by what stands on the camp's tile, the roll drawing from the camp's roll table, a raid and an around-the-door entry from the table the caller hands; the wave sends under the camp's raider script with no draw. Leaves standing: the rules compiling, the content red.
3. `src/content/nomadic.ts`, `src/content/stone.ts`, `src/rules/fixtures.ts`: the tables as Scope names them, the answers handing theirs. Leaves standing: `npm run check` green.
4. `src/rules/catalogue.test.ts`, `src/rules/enemies.test.ts`, `src/content/scripts.test.ts` where it reaches the camp: the coherence tests of tables, the wave's script tests cut as Scope says, the two-kind draw tests rewritten over a two-row table, the opening test over an opening table, the new joint-draw test, the runtime-error test of an unnamed script removed. Leaves standing: `npm test` green.
5. `e2e/chronicle-screen.ts` and the specs the Traps name: the camp's kind read off the opening table, the pillager built by its script id. Leaves standing: the proof spec green.
6. `docs/CHRONICLE.md`, `docs/ages/STONE.md`: the Spec's sentences in place of the old; `workflow/BOARD.md`: the line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/pillage.spec.ts`, the spec that builds a pillager of the camp's and walks it onto a farm.
- CI's on the push, listed for the hand-back: `camps`, `archer`, `attack`, `fog`, `map`, `console`, `fall`, `capstone`.
