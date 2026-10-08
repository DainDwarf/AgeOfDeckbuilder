# Enemies cross the water

**Line:** Enemies cross the water — the rules step an enemy embarking or disembarking through the same step the Embark card takes, on the embarked move its age's camp names, a camp naming none keeping its enemies ashore; the raider's walk over the whole map runs over ground and water weighed in moves, held by a test on the fixture beside the script; the guard keeps the ground while it guards; the camp generator's reach across the water is that walk's reach; a snapshot keeps the embarked flag of the enemy it remembers and the map draws it on its hull; the Stone camp names the raft's move. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Spec:**

- `docs/CHRONICLE.md` → _Units and combat_, the movement bullet ("A unit moves on its own move points."). Its sentence _"An enemy reading a walk over the whole map has no points to drain and weighs a crossing as the walking unit's whole move, which is what the drain costs at worst."_ becomes:

  > An enemy reading a walk over the whole map has no points to drain and weighs it in moves: each step weighs its movement cost against the move the enemy has on the tile it enters, ashore or embarked, and a crossing, an embark or a disembark weighs one whole move, which is what each costs at worst.

- `docs/CHRONICLE.md` → _Units and combat_, the embark bullet, already holds the rule this line lands ("An enemy embarks and disembarks on its script's walk, through no card: …"); it is not edited.
- `docs/ages/STONE.md` → _The camps 🔧_. After the sentence on the raider crossing the water, add:

  > Embarked, the camp's enemies cross the coast as slowly as the player's units do. The guard keeps the ground around its camp and crosses only once it raids.

- No player-facing text: an enemy embarked is already named and drawn through `embarked.unit` and the hull.

**Doc-impact:** `docs/CHRONICLE.md` (the movement bullet's whole-map sentence), `docs/ages/STONE.md` (_The camps_).

**Scope:**

- In:
  - **The camp's embarked move.** A camp's content may name the move its enemies have embarked; a camp naming none keeps its enemies ashore, so the Nomadic camp and the fixture's `CAMP` change nothing. The Stone camp names `MOVE_POINT`, the Embark card's own.
  - **The step.** An enemy embarks onto a free tile beside it that embarked units enter, or disembarks onto a free tile beside it that it stands on ashore, charted or not. The step spends one of its action and the move points it had left, and its move becomes the camp's embarked move, or, disembarking, its kind's own. It is the last thing the enemy does that turn, so it attacks nothing after it. It may come after the walk in the same turn, as the player's card does after a walk. It is the same step the Embark and Disembark cards take, raising the same `action-spent` and `move` changes. The card's charted check and its refusals stay the card's; a script never chooses a step it cannot take, and the enemy phase answers a step the rules cannot take with a `runtime-error` and no step.
  - **The walk.** The raider's walk over the whole map — what it moves toward the city by — runs over ground and water when the camp names an embarked move. It embarks where the ground ends and disembarks where it begins. It weighs each step as its movement cost over the move the enemy has on the tile entered: its kind's move ashore, the camp's embarked move on the water. A river crossing, an embark and a disembark each weigh one whole move. Ashore only, the weighing orders landings exactly as today's points do, so no Nomadic raider changes its walk.
  - **The raider.** It keeps its order: onto the city's tile, then a striking landing nearest the city, then the landing cheapest toward the city. Where the cheapest route's next step from the landing chosen changes medium, the raider steps onto that tile, embarking or disembarking. Where that tile is held, it steps onto another free tile beside it of that medium on a route as cheap, and otherwise it does not step that turn. Embarked, it strikes nothing, so its choice is the cheapest landing and step toward the city.
  - **Disembarking onto the city's tile is allowed.** It is a free tile ashore. An enemy standing on it through the player's turn captures the city, as any other.
  - **The guard.** While a camp stands within its radius, it keeps the ground and never steps. With no camp within its radius it raids, so it crosses as the raider does.
  - **The generator's reach.** The reach across the water the camp generator reads (`groundAndWaterRunTo`) becomes the tiles the new walk reaches, the costs ignored, the way `groundRunsTo` reads `pathCosts`. The tile set is the same by construction: both enter every tile either medium names a cost for, and a walk over the whole map refuses no step. So every seed deals the same map.
  - **The snapshot.** It keeps the embarked flag of the enemy it remembers. The map draws a remembered enemy on its hull. Two snapshots differing only in that flag are two records.
  - **Catalogue coherence.** A camp dealt across the water whose content names no embarked move is refused, since its enemies could never leave their island.
- Out:
  - The raid's door across the water (the next line), so raids still enter on the city's ground.
  - Archers at the camps, the pillager, camps that prepare.
  - A guard chasing a target over the water.
  - Any new UI beyond the remembered hull.
- Reconcile:
  - The enemy's step goes through the card's step: one transform and one pair of changes, with the move as the parameter. The charted check and the refusal reasons stay the card's, being a difference that is meant.
  - The generator's flood over ground and water becomes the new walk's reach.

**Traps:**

- An embarked unit's `stats.move` is its embarked move. Its own move is its kind's, read through `unitKind` as the card's disembark reads it. The weighing needs both, whichever medium the enemy stands in.
- `cheapestToward` in `src/content/scripts.ts` subtracts the landing's own cost on the walk out. With two media, that cost is the landing's medium's, weighed in moves. Its comment explains the trick.
- `src/rules/` never imports `src/content/`. The step and the walk live in `src/rules/`, and the scripts call them.
- The camp generator in `src/rules/map.ts` reads `MapAge['camp']`, which carries `acrossWater` alone and no embarked move. The reach it reads needs no move.
- `src/rules/map.test.ts` holds the camps-across-water tests. They and any seed pinned in a spec must pass unchanged. A change there means the reach changed, which is a deviation.
- `records` in `src/rules/sight.ts` compares snapshot units field by field. The flag joins the comparison.
- `src/rules/save.ts` reads the snapshot's unit. The flag is read, and saves planted by the e2e specs may carry snapshot units without it. Save compatibility waits for the Bronze Age, so a planted save may be updated rather than the reading softened.
- `src/ui/map.ts` draws a remembered unit with `false` for its embarked flag. That is the one place the hull is missed.
- Script decisions are tested in `src/content/scripts.test.ts`, and the mechanism on the fixture. The fixture's `coast` names an embarked movement cost and its `deep` names none. Its `CAMP` names no embarked move, so a test that needs one names it on its own camp.
- `runtime-error` is in the closed set in `src/rules/stages.ts`.

**Plan:**

1. **Rules.**
   - The camp's embarked move and its coherence refusal.
   - The step shared with the cards.
   - The whole-map walk over ground and water, weighed in moves, with the generator's reach read off it.
   - The enemy phase taking a script's step.
   - One test on the fixture per piece. This leaves every existing test green and the Nomadic Age unchanged.
2. **Scripts.**
   - The raider walks and steps on the new walk, and the guard keeps the ground.
   - One test per decision in `src/content/scripts.test.ts`.
   - The Stone camp names `MOVE_POINT`.
3. **The snapshot.**
   - The flag kept, compared and saved.
   - The map drawing the remembered hull.
   - One rules test.
4. **Docs.** The two sentences of the Spec.
5. **Verify.** Run fmt, check, test and lint.

**Verify:**

- Commands: `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- Proof spec: none. The decisions are held by the rules and script tests, and the hull goes through `unitMark` as the player's embarked units already do.
- CI proves on the push: `e2e/embark.spec.ts`, `e2e/fog.spec.ts`, `e2e/archipelago.spec.ts`, `e2e/camps.spec.ts`, `e2e/map.spec.ts`, `e2e/attack.spec.ts`, `e2e/archer.spec.ts`.
