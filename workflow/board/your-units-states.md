# Your units' states

**Line:** **Your units' states** — a unit of the player's is dimmed exactly when it can do nothing on the map: no tile in its reach, no unit in sight its attack reaches without declaring war, and, a worker, no action left; no unit is dimmed on the settle phase; the dim, the pointer's following and the drag ask one question, the war its parameter; the look's one map dim is three entries; `npm run check`, `npm test`, `npm run lint` and `npx playwright test e2e/move.spec.ts` pass. Doc-impact: `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`.

**Spec:**

`docs/CHRONICLE-SCREEN.md`, _The map's presses_. The two sentences from "A unit of the player's with no move points and no action left is dimmed where it stands" to "stands undimmed." are replaced by:

> A unit of the player's that can do nothing on the map is dimmed where it stands, so the units that still have something to do there read at a glance: it has no tile in its reach, its attack reaches no unit, and, a worker, it has no action left, the card its action goes to being what a worker waits for. An attack that would declare war counts for nothing there, and a step counts wherever it lands. The dim is read off the chronicle as it stands, so a dimmed unit is lit again as soon as a tile comes in its reach or a unit in its attack's. No unit is dimmed on the settle phase, which is no turn.

The sentence after them, "An enemy is never dimmed: the enemy phase spends its action and the same end of turn refreshes it.", stands as it is.

`docs/LOOK.md`, _The pieces on the map_:

- **A unit.** After "In fog the painting, the halo and the canoe are darkened as every painting is." add: "A dimmed unit of the player's has its painting, its halo and its canoe darkened by 60%."
- **A unit's ring.** "and one whose turn is done wears it undarkened" becomes "and a dimmed one wears it undarkened".
- **A unit's health bar.** "and is darkened with it in fog and when its turn is done" becomes "and is darkened with it in fog and when it is dimmed".

No player-facing text entry changes: the line adds no word to any screen.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`.

**Scope:**

In: what the dim reads. Today it reads two numbers, no move points and no action; since an action spent spends the move points with it and every kind holds one action, it is worn only by a unit that attacked or had a card played through it, and a unit that walked out looks untouched. From this line it reads what the map can still take from the unit.

Out, each the user's call at the intake (2026-11-13, https://claude.ai/artifact/JRptuL92g9hv61hdu13b5Y):

- No new mark. The glyphs for the move points and the action, the grey halo and the two steps of dark were served and not taken; what a dimmed unit still holds is left to a window of the chrome rung.
- The dim's look stays as shipped: 60%, on the painting, the halo, the canoe and the health bar. The health bar darkened with its unit is the user's standing pick.
- The count of units and the jump key (Motion), and units reading as not interactive in city mode (the chrome), stay where they are.

Corner cases decided:

- **A worker** stays lit until its action is spent, whatever is in its reach: the user's pick over a worker dimmed once it can step nowhere. A worker with no action left and a tile in its reach is lit, as any unit with a tile in its reach.
- **A unit of the neutral's at peace** in the attack's reach does not keep a unit lit: the attack would declare war. Hostile, it does. A step counts wherever it lands, a tile the neutral holds included.
- **The settle phase:** no unit is dimmed, though none can move or attack on it.
- **An embarked unit** that is no worker attacks nothing, so it is dimmed once it can step nowhere, even holding the action a card would take.
- **Only a unit in sight** is attacked, so a unit in fog keeps nobody lit.
- **A step that brings a unit in range** adds nothing to the question: it needs a landing, and a landing alone keeps the unit lit.
- **Lit again** is no rule of its own: a refresh of its move points, a unit of the player's stepping off the tile that boxed it in, a unit coming into its attack's reach each change the answer of the one reading.
- **Through the end of turn's play-out and the enemy phase** the units stand as the chronicle holds them, as today.
- An enemy and a unit of the neutral's are never dimmed; the unit's ring stays undarkened on a dimmed unit; the infopanel draws a unit fresh.

What the reconcile chose:

1. **The selection's reading** (the landings and the units to attack the rules answer for the selected unit): the dim goes through it as it is. Timed in Node on a settled chronicle: 0.14 ms a unit on a Nomadic map of 331 tiles, 0.18 ms on a Stone one of 469, so ten units are under 2 ms a render of the units.
2. **The pointer's following and the drag**, which already test whether a unit lights or marks anything: they and the dim become one question. The difference that is meant is its parameter: the pointer and the drag count an attack that would declare war, since the press is what raises the warning, and the dim does not. The worker's action and the settle phase are the dim's alone.
3. **The personas** read the raw move points and action to choose a command: they stay apart, a different job.
4. **The look's one map dim**, which paints the yield overlay's dim, a held tile nobody works and this unit: split into three entries, one per meaning, each at today's value.

**Traps:**

- `byHand` (`src/rules/chronicle.ts`) answers no landing and no target on the settle phase. Read bare, every unit would be dimmed there.
- `canAttack` and `attackable` (`src/rules/units.ts`) admit a unit of the neutral's at peace for an attacker of the player's; `actsAsEnemy` beside them says whether a unit acts as an enemy does under the relations. `byHand` is what cuts the targets to the tiles in sight.
- A worker attacks nothing by `canAttack`, so nothing the selection reads says a worker holds its action: the dim reads the number for it.
- `shadeOf` (`src/ui/map.ts`) reads the unit alone today. The new reading needs the chronicle the map stands on, and one unit's dim now moves when another unit does. `paintUnits` paints every unit on every render; `paintBar` and `paintBarOf` repaint one unit's bar alone with its shade, while an attack is read on it. Check that no path leaves a unit's shade from an older chronicle.
- The two sites that test "lights or marks anything" today are `followPointer` and `unitBeingAimed` in `src/ui/map.ts`.
- `e2e/attack.spec.ts` reads the unit's dim off `LOOK.mapDim` by name; it is the only spec that names the entry.
- A look entry is named for what it means (`DOGMAS.md` _Code_); the unit's entry is read through `darkeningOf` for its strength alone.
- A question the rules answer takes the catalogue before the chronicle (`DOGMAS.md` _Architecture_).
- Nothing new is drawn: the tints are today's, multiplied as today. `docs/PHASER.md` holds what the bundled pages omit, should a tint or a retained object surprise.

**Plan:**

1. `src/rules/`: the one question stands, whether the map takes anything from a unit, the war counted or not, answered through the reading the selection asks. It leaves the rules tests passing with one test on the fixture for each sentence a player could state: a unit with no tile in its reach and no unit in its attack's reach can do nothing; a unit of the neutral's at peace in its reach changes that only where the war is counted, and a hostile one either way; a unit in fog changes nothing.
2. `src/ui/look.ts` and its three readers (`src/ui/map.ts`, `src/ui/map-marks.ts`): the one map dim becomes three entries at today's value. It leaves the screen unchanged.
3. `src/ui/map.ts`: the dim reads the question, the war not counted, with the worker's action and the settle phase laid over it; the pointer's following and the drag read it with the war counted. It leaves the map dimming by the new rule.
4. `e2e/`: `e2e/move.spec.ts` proves it on the screen: a unit that spends its last move points with no unit in its attack's reach stands dimmed, and a worker in the same place holding its action stands lit. `e2e/attack.spec.ts` reads the unit's dim off its new entry.
5. `docs/CHRONICLE-SCREEN.md` and `docs/LOOK.md` as the Spec writes them.
6. The ship session, with the line's deletion: in `workflow/LOOK.md`, strike the two sentences saying the one `mapDim` entry paints three meanings and that the first line to touch one splits it (_The pieces on the map_, the marks on a unit; _The glyphs_, the yield overlay's dim).

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/move.spec.ts`. CI proves on the push: `attack`, `unit-ring`, `path`, `archer`, `embark`, `heal`, `settle`, `worker-instants`, `neutral`, `pillage`, `city-mode`, `yields`, `map-order`.
