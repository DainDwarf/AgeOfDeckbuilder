# A step and an attack in one press

**Line:** **A step and an attack in one press** — a unit out of the selected unit's range that a step brings in range wears the attack's ring, the pointer on it reads the path to the tile the attack comes from with the move points left there and then the attack, and one press, a click or a drag, is the step and the attack, the war warning asked once before anything moves; a rules test holds which tile is taken, `e2e/attack.spec.ts` proves the reading and the press, and the pages say so.

**Rests on:** "The attack on a unit", shipped. The sentences below are written against the pages as that line leaves them, and the ring, the arrow and the number are that line's.

**Spec:** the mockup, its first section, is https://claude.ai/artifact/To2kJ1oSNxabgUqXhk5syW; the user's picks are the same mark as a unit in range wears, the nearest tile then the straightest way, and the move points left kept on the arriving tile. The pages, the sentences written by the intake and taken with the design:

- `docs/CHRONICLE.md`, _Units and combat_, the bullet "A unit attacks on its own action", after "The player attacks by the same press as a move — the target standing on the tile is what makes it an attack.": "On a unit out of its range that a step would bring in range, that press is the step and the attack: the unit crosses to a landing that brings it in range and attacks from there. Of those landings it takes one that declares no war before one that does, then the cheapest, then the one its path reaches over the fewest tiles, then the one nearest the straight line from the unit to the unit attacked. A unit already in range is attacked from where the unit stands, and only a unit in sight is attacked either way."
- `docs/CHRONICLE-SCREEN.md`, _The map's presses_:
  - "A selected unit of the player's lights every tile its move points reach, as one region with its own tile among them, and marks with a ring in the enemies' own colour every unit its attack reaches, from where it stands or after a step that brings it in range; a tile selected under a unit lights and marks nothing."
  - "A click on a lit tile is that unit's next step and selects nothing; a click on a marked unit is that unit's attack on it, the step that brings it in range first where it takes one, and selects nothing either."
  - "The selection follows the unit to where it stands after either — where it landed, or where it attacked from — lit and marked again with what it has left."
  - In the paragraph "A unit being aimed reads its attack", after its first sentence: "Where the attack takes a step first, the unit's path to the tile it would attack from is drawn with it, the move points left at its end as on any path, the arrow leaves from that tile, and the health read is the damage the unit would carry there."
- `docs/LOOK.md`, _The attack's marks_, after the arrow's sentence: "Where a step comes first, the arrow leaves from where the unit's painting would stand on the tile it attacks from, by the same 11 units, and the path to that tile is drawn as any path is, its number at the arrow's start."

No player-facing entry is new: the number is the entry the line before added, and the warning's press reads Attack.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`.

**Scope:**

- In: the rules' answer of the units a step brings in range, each with the landing the attack comes from; the attack command on one of them resolving as the step and then the attack; the ring on them; the reading under the pointer and under a drag; the click and the drag; the pages.
- Out: the pointer choosing the side the unit attacks from, served on the mockup and turned down for the nearest tile; a walk of several turns; embarking or disembarking as part of the press, each being a card; anything for the enemies, the neutral or the simulator's personas.
- Decided here:
  - A unit in range from where the selected unit stands is attacked from there, never stepped toward.
  - Only a unit in sight now is marked, never one the landing would bring into sight.
  - A landing that declares war is taken only where no other brings the unit in range, whoever is attacked.
  - A step over a river spends every move point and keeps the action, so the attack lands and the tile reads 0 left.
  - The move points left on the arriving tile are what the unit holds on landing, though the attack then spends them: the user's ask.
  - A unit with action and no landing that brings anything in range marks only what is in range, as today; one with no action marks nothing.
  - The step plays, then the attack, and the unit stays selected where it attacked from.
  - The warning is raised once, before anything moves, whether the step or the attack declares war; Back leaves the unit where it was.
- The reconcile's seven, all taken as recommended:
  1. Which tile: the path's own order of ties read a second time — the cheapest, the fewest tiles, the nearest the straight line, here the line from the unit to the unit attacked — under one new first test, no war.
  2. The enemies' and the neutral's scripts, which land nearest the place they walk to and read what they would see from the landing: apart, both differences meant.
  3. The personas, which try each landing themselves: apart. What the rules answer them today, the landings and the units in range, does not move, so no simulator number changes.
  4. The press: one with the attack's, so the warning's one question covers the step and the attack.
  5. The number: the same reading, taken on the chronicle the step leaves.
  6. The marks: the line before's ring, arrow and number and the path as shipped, where the arrow leaves from being the one thing that varies.
  7. The pointer's reading: as it is, a unit a step away being a marked unit like any other.

**Traps:**

- `byHand` (`src/rules/chronicle.ts`) is read by `tools/builder.ts`, `tools/warlord.ts` and `litFor` in `e2e/chronicle-screen.ts`: its landings and its targets answer what they answer today, and the units a step brings in range are an answer beside them.
- `declaresWar` asks what a command resolves as for a `relations` change, and `warDeclared` raises none once the neutral is hostile: a press resolving as the step and then the attack is warned of once, and two commands sent one after the other would raise the warning after the step has played.
- `bonusCarried` (`src/rules/catalogue.ts`) counts every unit of the faction one tile from the tile it is handed: asked for a unit on a tile it does not stand on yet, it counts that unit's own bonus from the tile it leaves. The damage after a step is read on the chronicle the step leaves.
- A landing is a free tile `reachable` answers with its cost, a river's crossing costing every point left; `canAttack` answers on a distance and reads the embarked rules. `pathBetween` (`src/rules/map.ts`) holds the order of ties the Spec names.
- `crossed` raises what the landing declares and the one `move`; `blow` raises the `attack` group. The change names and the group names are closed sets (`src/rules/stages.ts`), and the map's motion already plays both.
- The target's sight is the player's as it stands (`inSight` in `byHand`), not the sight from the landing, which is what the enemies' scripts read (`landingsWithTarget`, `src/content/scripts.ts`).
- `commandUnitOn` in `src/ui/map.ts` tells a step from an attack by which list holds the tile, and `commandUnit` in `src/ui/chronicle-scene.ts` selects where the unit stands once the command has played out.
- A pure rule is proven on the fixture: the test names no card, unit kind or number of the content (`DOGMAS.md` _Testing_).

**Plan:**

1. The rules, in `src/rules/units.ts` and `src/rules/chronicle.ts` with their tests: the units a step brings in range, each with its landing by the Spec's order, and the attack command on one resolving as the step and then the attack; in range it resolves as today. Nothing on the screen asks it yet.
2. The map, in `src/ui/map.ts` and beside the path: those units ringed, the pointer and a drag reading the path to the landing, its move points left, the arrow from there and the number as the step leaves it; the click and the drop sending the attack.
3. `e2e/chronicle-screen.ts` reading it in one question, and the test in `e2e/attack.spec.ts`.
4. The three pages as the Spec writes them, and the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The rules tests hold: an attack on a unit a step away resolves as the move to the landing and then the attack from it; of two landings the order of ties picks the one the Spec names; a landing that declares war yields to one that does not; a unit in range is attacked with no step. One cell through the sim skill, any persona on the Stone Age, 5 seeds, read before the change and after it: the rows are the same. The proof spec is `e2e/attack.spec.ts`: a warrior two tiles from an enemy marks it; the pointer on it shows the path to the landing the rules name, the move points left there, the arrow and the number read from the rules on the chronicle the step leaves; a click is the step and the attack, the chronicle the screen holds equal to the rules' outcome of the one command, the warrior selected where it attacked from. CI proves on the push: `e2e/neutral.spec.ts` for the warning, `e2e/archer.spec.ts`, `e2e/path.spec.ts`, `e2e/unit-ring.spec.ts`, `e2e/held-press.spec.ts`, `e2e/map-order.spec.ts`, and the rest of the suite.
