# The personas read a unit as last seen

**Line:** **The personas read a unit as last seen** — the map a persona knows stands each unit as the screen's card reads it, the one standing where the tile is in sight and the one its snapshot kept where it is in fog, through one reading in `src/rules/` that the screen and the personas both ask; the pursuit's test in `tools/sim.test.ts` holds a wounded enemy in fog pursued ahead of a healthy one equally near. Doc-impact: none.

**Spec:**

- `docs/SIMULATOR.md`, _The persona and the gambit_, as it stands: "A gambit reads the chronicle the way the screen does and never opens a closure: it asks the rules' own question functions, the ones the screen asks", and "A persona plays with the player's knowledge, the charted tiles, what is in sight and what the fog shows this turn".
- `docs/CHRONICLE.md`, _Sight_, the paragraph **Fog draws the tile as it was last seen.**, as it stands: the snapshot keeps the non-player unit standing on the tile as it stood.
- No sentence is added or changed on either page: the pages already say it, and the personas are what disagrees.
- No player-facing sentence and no persona sentence changes: every gambit's sentence in `tools/builder.ts` and `tools/warlord.ts` reads as it does, "of least health of equals" and "an enemy the map shows could attack next turn" among them.

**Doc-impact:** none — the simulator's page already has a persona read what the fog shows through the questions the screen asks.

**Scope:**

In: the one reading of which unit a tile shows, standing in the rules and asked by the screen and the personas alike; the map a persona knows built on it; the pursuit's test.

Out:

- Anything the screen draws or reads: the map's mark and the infopanel's card show exactly what they show today.
- A gambit reading what a unit in fog has left of its action, or whether it had prepared: no sentence asks for it.
- The attack on the enemy of least health: it reads the units in the attacker's own sight, as they stand, and never the fog.
- A simulator run: none is part of the ship. The hand-back says the rows may move on rare seeds, a unit in fog lasting to the tick and differing from a fresh one of its kind only wounded, healed short of full or embarked.

Corner cases decided here:

- A unit in fog is read with the stats its snapshot kept: its health, and the move it stood on, embarked or ashore.
- "Could attack next turn" reads every enemy the map shows at its move, the stat as the card shows it, whatever move points it holds or was last seen holding, in sight and in fog alike: the question is next turn's. That is what the personas read today, a fresh unit holding its full move.
- Whether a unit of the neutral's acts as an enemy is read off the relations as they stand, as today and as the card reads Hostile.
- The pursuit ranks an enemy in fog at the health it was last seen with. The test that promised its kind's health is rewritten to the opposite promise, on the user's decision.

Reconcile, each chosen with the user:

- The fog unit's card and the persona's unit in fog become one. The user's call, against Claude's first recommendation to keep them apart: "The fog unit's card is what a player can see, so it should be what the personas use for the informed decision." The reading that says which unit a tile shows moves from the screen's file into the rules, the screen asks it there, and the personas ask the same one. Reading the enemy at its move for next turn's question is the persona's own, on top of it.
- The pursuit's two readings, the unit as it stands in sight and one of its kind in fog, become that one reading, which answers the unit standing in sight and the kept one in fog. The swap the pursuit does by hand goes.
- The embarked move looked up from the age for any embarked unit in fog goes: the kept unit carries the move it stands on.
- "At its move" goes through the rules' own refresh of a unit's move points, as it is.
- The attack on the enemy of least health stays apart, untouched.

**Traps:**

- Nothing under `tools/` imports `src/ui/`, and nothing may: the simulator is a consumer of the rules. `unitDrawn` stands in `src/ui/map.ts` today, asked by the map's own painter, by the selection and by `cardsOf` in `src/ui/infopanel.ts`.
- `DOGMAS.md` _Code_ refuses a tool-serving function in the rules. The reading is the screen's own, moved: the screen has to ask it where it now stands, and no second function may stand beside the one the screen keeps.
- `unitDrawn` takes a `Drawn`, a type of the screen's, whose snapshot is there or not by the map's veils: the console can take the fog veil off, and the face is then the tile as it stands. The personas play with both veils on, always. What the rules hold must know nothing of veils: the screen keeps deciding which face it draws, the persona reads in sight as it stands and in fog as kept.
- A snapshot answers for its tile whole: one taken of an empty tile hides whoever has walked onto it since. `unitDrawn`'s comment says so, and the reading keeps it.
- A kept unit has no tile, no number, no script and no camp. `cardsOf` puts it on its snapshot's tile before it reads it. The last ship narrowed `damageOf` (`src/rules/catalogue.ts`) and `preparedAs` (`src/rules/enemies.ts`) to the fields they read so a kept unit could be handed in; `reachable`, `canAttack` and `actsAsEnemy` (`src/rules/units.ts`) take a whole `Unit` today.
- `shownMap` (`tools/builder.ts`) stands every snapshot's unit through `entered`, which deals it the next number and its kind's stats with full move points, tiles in sight included; `shownEnemiesNear` then swaps the one in sight for the unit standing there. `shownEntering` reads the age's camp for an embarked move. Their comments say "one of its kind" and "its kind's in fog" and are re-shaved.
- In sight the kept unit and the standing one read alike: `src/rules/sight.ts` takes a snapshot again whenever `sameUnit` finds a difference, on every command.
- `enemyAttacked` (`tools/builder.ts`) tells targets apart by their number. It reads units as they stand and is not on this line's path.
- `tools/sim.test.ts` names gambits by their number in the persona's list (the pursuit is the builder's 28 and the warlord's 27): no gambit is added, removed or moved.
- The pursuit's test already builds what the new promise needs: its `fogged` chronicle has a healthy enemy in sight and one at one health seen by a scout that then steps away, both three tiles from the city. Today it expects the walk toward the healthy one. The test "a worker walks away from an enemy the fog shows this turn" holds as it is.
- A test is rewritten to the new promise, never loosened (`DOGMAS.md` _Testing_); its title says "one in fog read at its kind's health" and changes with it.

**Plan:** two commits, the move first.

1. `src/rules/`, `src/ui/map.ts`, `src/ui/infopanel.ts`: the reading of which unit a tile shows stands in the rules, and the screen asks it there. This leaves the screen drawing and reading exactly what it does, `npm run check` and `npm test` green. The first commit ends here, inert.
2. `tools/builder.ts`: the map a persona knows stands each unit through that reading, at its move; the pursuit and the could-attack question read it; the stand-in entered fresh, the swap in sight and the age's embarked move go.
3. `tools/sim.test.ts`: the pursuit's test, title and `fogged` case, to the new promise.
4. The board line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/fog.spec.ts`, the screen's reading having moved under the card and the mark it walks. CI proves on the push: `e2e/inspect.spec.ts`, `e2e/unit-ring.spec.ts`, `e2e/console.spec.ts`, `e2e/neutral.spec.ts`, `e2e/archer.spec.ts`, `e2e/landing.spec.ts`, `e2e/population-badge.spec.ts`.
