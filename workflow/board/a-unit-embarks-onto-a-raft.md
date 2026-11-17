# A unit embarks onto a raft

**Line:** A unit embarks onto a raft — a unit of the player's embarks by a step onto the tile of a raft of the player's that carries no unit and disembarks by a step onto a free tile ashore, each spending one of its action and each a tile of its reach, from where it stands or at the end of a walk; embarked it moves with the raft, on the raft's move, one unit to a raft, an attack landing on the unit, and the raft stays on its tile when the unit disembarks or is killed; the Raft card reads "Carries 1 unit" under its stats; Embark and Disembark leave, and with them the card played through a unit beside its tile, Becomes staying, the enemies and the neutral embarking as they do; `e2e/embark.spec.ts` passes.

The line as it stood before intake said "paid on its own move points and spending no action". The user reversed it at intake: the step spends the unit's action, and asks nothing of its move points, as Embark and Disembark do today and as the enemies' embark does. The user kept one line against Claude's proposed cut in two, kept Becomes with no card of the game's carrying it, and cut the card played through a unit beside its tile.

**Spec:**

Every sentence below is Claude's, written at intake on the settled design.

_`docs/CHRONICLE.md`, Units and combat, the bullet "A unit moves on its own move points."_ Its last sentence, "A unit passes through the units of its own faction and never through another's, and it lands only on a free tile.", becomes:

> A unit passes through the units of its own faction and never through another's, and it lands only on a free tile, or by embarking.

_Same section, the bullet "A unit attacks on its own action."_ "A step spends no action, and an action spent spends the move points the unit has left with it, on an attack and on a card played through a worker alike," becomes:

> A step spends no action, an embark and a disembark excepted, and an action spent spends the move points the unit has left with it, on an attack, on an embark or a disembark and on a card played through a worker alike,

_Same section, the bullet "A unit embarks and disembarks through a card."_ The whole bullet becomes:

> - **A unit embarks and disembarks by a step.** To **embark** is to step from the tile a unit stands on onto a tile beside it that embarked units enter; to **disembark** is the step back, onto a tile beside it that the unit stands on ashore. Either spends one of the unit's action, so it is the last thing that unit does that turn, and asks nothing of its move points. A unit of the player's embarks onto the tile of a unit of the player's whose kind stands on the water alone and that carries no unit, and onto no other tile; it disembarks onto a free, charted tile. Either tile is one of its reach while it holds an action, from where it stands or at the end of a walk that brings it beside, the landing of that walk taken as an attack's is: the press is the walk and the step. An **embarked** unit is itself: it keeps its health, its sight and, a worker, the cards played through it. Its move is that of the unit carrying it, and it attacks nothing; disembarked, its move, its damage and its range are its own again. The two move as one: a step of the embarked unit's spends the same of the move points of the unit carrying it, and is taken only where both cover it. An attack on their tile lands on the embarked unit, and the unit carrying it stays on its tile when the embarked unit disembarks or is killed, with the health and the move points it holds. A unit whose range is one attacks no embarked unit, and a unit of a longer range attacks one anywhere within its range. An enemy embarks and disembarks on its script's walk, onto a free tile and carried by nothing: each is the last thing it does that turn, as the player's is, and its embarked move is the one its camp's content names; a camp naming none keeps its enemies ashore. A unit's kind may stand on the water alone: such a unit is embarked from the moment it enters, moves on its kind's own move, never disembarks, and carries one unit.

_Same section, the bullet "One unit per tile."_ Add at its end:

> An embarked unit and the unit carrying it stand on one tile as one.

_`docs/CHRONICLE.md`, Cards, the bullet "Action"._ The whole bullet becomes:

> - **Action** — a card a unit's action goes to: played through a unit standing on the tile it is aimed at, which spends one of its action, and what it does is content. The card names the unit it is played through, and its label reads that name before the kind's.

_Same section, the paragraph "A card **aimed** at a tile lands on no tile its aim does not admit"._ Its last sentence leaves: "A card aimed at a tile may be played through a unit standing beside that tile, whose action it spends: where one unit beside the tile can be the one, the play goes through it; where several can, the card is then aimed at a unit, among those."

_`docs/CHRONICLE-SCREEN.md`._ The paragraph "**A card played through a unit beside its tile asks which unit only where it must.**" leaves whole.

_`docs/MAP-SCREEN.md`, A unit's step and its attack._ Add after the first paragraph:

> **A unit's reach holds its embark and its disembark.** While it holds an action, a selected unit of the player's lights with its reach the tile of each unit it can embark onto and each tile it can disembark onto, from where it stands or after a walk that brings it beside, and a click or a drag there is the walk and the step. The path drawn to such a tile ends on it and reads no move point left. An embarked unit marks no unit.

_`docs/MAP-SCREEN.md`, What a unit wears._ "An embarked unit's mark shows it embarked." becomes:

> An embarked unit's mark shows it embarked. The unit carrying it shows nothing of its own while it carries: a press on their tile reads the embarked unit, and the unit carrying it is neither selected nor inspected.

_`docs/MAP-SCREEN.md`, The infopanel._ In the first paragraph, "the unit standing on it;" becomes:

> the unit standing on it, the embarked one where one unit carries another;

_`docs/LOOK.md`, the paragraph "A unit"._ Add after "with the dark line and the halo any unit wears.":

> While it carries a unit it is not drawn: the canoe under the embarked unit is all that shows of it.

_`docs/ages/STONE.md`, The technologies._ Raft's "It unlocks the cards **Embark** and **Raft** and the archipelago region and pays influence." becomes:

> It unlocks the card **Raft** and the archipelago region and pays influence.

_`docs/ages/STONE.md`, The units._ The raft's bullet becomes:

> - **The raft** stands on the water alone and attacks nothing: it crosses the coast slowly, holds little health and carries one unit.

_`docs/ages/STONE.md`, The cards._ The bullets of Embark and Disembark leave. Raft's bullet becomes:

> - **Raft**, costing production: one population leaves the tiles to become a raft, on a coast tile inside the border. A unit embarks onto a raft and crosses the coast as slowly as the raft does, so the rafts the player's city has are how many of its units are on the water at once.

_The text table, every entry written out._

- `rules.raft`: Carries 1 unit
- Leaving: `card.embark`, `rules.embark`, `card.disembark`, `rules.disembark`, and the notes "Needs a unit beside it", "Needs an embarked unit beside it", "The unit is already embarked", "The unit is not embarked" and "Not beside that tile". An entry that only the card played through a unit beside its tile reached, the action kind's own tooltip among the candidates, leaves with it and is named in the report.
- Nothing else is authored: the step raises no note and no line, a move being offered or not.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/MAP-SCREEN.md`, `docs/LOOK.md`, `docs/ages/STONE.md`.

**Scope:**

In, as two commits in this order, pushed together:

1. _The step and the carrying, in the rules._ A unit of the player's embarks onto a unit of the player's that stands on the water alone and carries none, and disembarks, each by the move command, each a tile of its reach; the two move as one; the attack lands on the embarked unit; the carrying unit stays. Proven on the fixture, a test to each rule a player could state. Embark and Disembark still stand in this commit, as they are: a unit Embark put on the water disembarks by the step too, and Disembark played beside a unit on a raft puts it ashore, the raft staying. Nothing more is designed for where the cards meet a raft; the second commit removes them.
2. _The line._ The map's reach, path and marks, the infopanel, the Raft card's sentence, Embark and Disembark out of the Stone Age with their texts, the card played through a unit beside its tile out of the rules, the screen, the fixture and the tests, the specs that stood on Embark rebuilt on the raft, the five pages, the workflow notes below, the board line deleted.

The rules, settled with the user:

- The step asks for one action and spends it, the move points left going with it as with any action spent. It asks nothing of the move points: a unit that walked its whole move still embarks, and a unit that moved on the water still disembarks, that turn.
- A disembark is admitted by the unit's own kind's move covering the tile ashore, as Disembark admits it today.
- One press: the tile is in the unit's reach while it holds an action, from where it stands or after a walk that brings it beside; the walk's landing is taken as the attack's is, one that declares no war first, then the cheapest, then the fewest tiles, then the nearest the straight line. The walk-then-disembark half is Claude's reading of the user's "make it part of the movement reach"; the user accepted the tiles ashore beside where the unit stands, and the hand-back says so.
- A disembark onto a tile the neutral holds, or a walk ending on one, declares war as any landing does, behind the standing warning.
- Embarked, the unit's move is the raft's. A step on the water spends the same of both units' move points and is taken only where both cover it. The raft keeps its health and its move points, so a raft whose unit stepped off before it moved that turn still moves.
- An attack on the tile lands on the embarked unit, from a range longer than one alone; the raft takes nothing while it carries. The embarked unit killed, the raft stands there empty.
- An embarked unit attacks nothing and marks nothing. A disembark spends the action, so the unit does nothing more that turn.
- Every unit of the player's embarks, a worker included: a worker on a raft is the embarked worker the Fishery is built through. A raft embarks onto nothing. An embarked unit steps onto no second raft, and a raft that carries a unit is lit for no other.
- Every unit that stands on the water alone carries one unit: no kind declares it, and none declares a count.
- The raft while it carries: not drawn, not selected, not inspected, not healed and not aimed at; a card aimed at a unit on that tile reads the embarked unit. It sees nothing of its own, the embarked unit seeing by its own sight, and it still counts among the player's units in the growth threshold.
- The embarked unit is drawn as an embarked unit is today, in the canoe, its card reading Raft on the state line and its embarked stats. The raft is back in its halo the moment the unit leaves it.
- The enemies and the neutral change nothing: they step onto no raft and embark by their scripts, an action spent.

What leaves, on the user's say:

- The cards Embark and Disembark, their texts, and the Raft technology's copy of Embark; it unlocks one Raft.
- The card played through a unit beside its tile: the rule, the play naming a unit, the screen's "which unit" aim, the five notes, the fixture's cards and the tests that held the rule. The user cut it; deleting those tests is that decision.
- An action card played through any unit: with the cut every action card is played through the unit its content names, so the page's "one that names none is played through any unit" leaves. This follows from the cut and was not put to the user in those words; the hand-back says so.

What stays:

- Becomes, the keyword, the glossary's row and the fixture's cards that prove it. No card of the game carries it, so no spec reads it.
- The glossary: no row moves, and "carry" gets none, for now, on the user's say. "Carries 1 unit" reads as plain English.

Out:

- The personas and `tools/`: no deck under `workflow/decks/` holds the Raft, so no persona meets one. A tools test that trips is reported, not bent.
- The neutral and the enemies.
- Saves and campaigns written before this line, a deck holding Embark among them.
- The card's art box.

What the reconcile chose:

- _The step's price, against Embark, Disembark and the enemies' embark._ The step goes through today's rule as it is: one action, nothing asked of the move points. One rule for the player, the enemies and the neutral.
- _The lit raft, against the reach._ One rule with one exception: a tile a unit of the player's own stands on is crossed and never lit, the raft that carries no unit excepted. The path to it is the path's standing rule.
- _The unit on a raft, against today's embarked unit._ Through as it is: the canoe, the state line, the embarked stats, what attacks it.
- _A disembark onto the neutral's tile._ Through as any landing.
- _The raft's card on the infopanel._ As it stands; "Carries 1 unit" is read on the card's face alone.

**Traps:**

- `unitAt` (`src/rules/units.ts`) answers the one unit on a tile, and the rules, the screen and the specs ask it everywhere. However the two units share a tile, every reader of "the unit on this tile" gets the embarked one, and the carrying one comes back as it was. The save holds the pair (`src/rules/save.ts` reads each unit's `embarked`), and a tile in fog keeps the embarked unit as last seen (`SnapshotUnit`, `src/rules/state.ts`, `src/rules/sight.ts`).
- The player's move is `move` over `byHand` and `reachable` (`src/rules/chronicle.ts`, `src/rules/units.ts`), which never offers a tile a unit stands on; `pathTo`, `anythingByHand` and the dim read the same landings. `broughtInRange` keeps the landings from which `canAttack` holds for the unit as it stands: a landing that embarks brings nothing in range.
- `steppedOnto` (`src/rules/cards.ts`) is the embark the scripts call (`src/rules/chronicle.ts`): what the landing declares, the action spent, then the move. It stays. `stepped`, `embarks` and `disembarks`, the cards' aim, leave.
- `standsOnWaterAlone` and `onWaterAlone` (`src/rules/catalogue.ts`) are the kind's declaration; `entered` keeps such a unit embarked on its own move. `spentAction` takes the move points left.
- The flow is rows moved (`DOGMAS.md`, _Architecture_; the closed sets in `src/rules/stages.ts`): two units leave a tile in one step, and a listener plays only what reaches it.
- The play naming a unit runs from the command (`through`, `src/rules/chronicle.ts`) through `playedThrough` and `throughRefusal` (`src/rules/cards.ts`) to the scene's aim (`src/ui/chronicle-scene.ts`); `actionGoesTo` (`src/rules/catalogue.ts`) answers `any` for those cards alone, and the face's label reads it (`src/ui/face.ts`, `src/ui/face.test.ts` on `PH_Embark`). `src/content/catalogue.test.ts` walks `card.through`. A closed set that loses a member loses its branch; no guard is left for a state no path reaches.
- The fixture's `PH_Embark`, `PH_Disembark` and `EMBARKED_MOVE` (`src/rules/fixtures.ts`) give other test files their embarked units of the player's, the save's, the sight's and the city's among them: each is rebuilt through the step onto `PH_Skiff`, the fixture's own unit on the water alone, on the fixture's numbers. `PH_Flood`, `PH_Ebb` and `PH_Sprout` keep Becomes proven.
- `inCanoe` (`src/ui/map-marks.ts`) decides the canoe and the infopanel's state line. A game object is made once and changed in place (`DOGMAS.md`, _Stack_): the raft's mark goes and comes back without the embarked unit's being rebuilt.
- In `e2e/`, `EMBARK`, `becomes`, `disembarkingAt` and the Fishery's opening (`e2e/chronicle-screen.ts`) build every embarked unit the specs use; `fishery.spec.ts`, `neutral.spec.ts`, `aimed-yield.spec.ts` and `raft.spec.ts` stand on them. A spec's chronicle is built through the rules' own helpers and commands: a raft entered, then the move. `docs/PHASER.md` for anything a spec presses or measures.
- `EMBARKED_MOVE` (`src/content/stone.ts`) stays, the camp's alone; its comment is re-shaved.
- `tools/builder.ts` and `tools/warlord.ts` read the rules' landings; `docs/SIMULATOR.md` says neither persona embarks, which holds while no deck of theirs holds the Raft.

**Plan:**

1. `src/rules/`, the fixture and the rules tests: leaves the step, the carrying and the save of the pair proven on the fixture, Embark and Disembark untouched, committed alone as `Mechanism: A unit embarks by a step`.
2. `src/ui/`: leaves the reach lighting the raft and the tiles ashore, the path, the embarked unit in its canoe with the raft's mark gone and back, the infopanel reading the embarked unit.
3. `src/content/stone.ts`, `src/ui/text.ts`, then the rules, the scene, the fixture and the tests of the card played through a unit beside its tile: leaves the game with no Embark, no Disembark and no such play, the Raft card reading its sentence, every test file standing on the step.
4. `e2e/`: `embark.spec.ts` rewritten on the step, the helpers and the specs that stood on Embark rebuilt on the raft.
5. The five pages as the Spec writes them. In `workflow/IDEAS.md`, "The warlord embarks" reads "embarking onto a raft and disembarking where the cheapest way steps onto the coast" and "then takes Raft and Fishery, one copy each"; in `workflow/LOOK.md`, what the cards' pool says of Embark's and Disembark's texts is struck. The board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The one proof spec is `npx playwright test e2e/embark.spec.ts`, rewritten by the line: on a save whose campaign learned Raft, a warrior of the player's standing beside a raft lights the raft's tile, and a click there leaves the chronicle the rules give, the warrior embarked with its action spent, drawn in the canoe with no raft's mark beside it; that warrior selected lights a tile ashore, and a click there leaves it ashore and the raft on its tile in its halo; a warrior a walk away from a raft embarks by one click, on the landing the rules name. Every number read from the rules. CI proves on the push, listed for the hand-back: `raft.spec.ts`, `fishery.spec.ts`, `neutral.spec.ts`, `aimed-yield.spec.ts`, `archipelago.spec.ts`, `move.spec.ts`, `path.spec.ts`, `attack.spec.ts`, `hand-aim.spec.ts`, `refuse.spec.ts`, `inspect.spec.ts`, `fog.spec.ts`, `unit-ring.spec.ts`, `card-reads.spec.ts`, `tree.spec.ts`, `collection.spec.ts`, `deck-editing.spec.ts`, `reference.spec.ts`, `heal.spec.ts`, `press.spec.ts`.
