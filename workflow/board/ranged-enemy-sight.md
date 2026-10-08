# A ranged enemy attacks only what it sees

**Line:** A ranged enemy attacks only what it sees — the rules refuse an enemy's attack on a unit outside its own sight, the line over the ground from its tile, held by one test on the fixture; the guard and the raider choose their striking landings and their target on that sight, each decision tested beside the script.

**Spec:** `docs/CHRONICLE.md` _Sight_, the sentence already standing there: "The enemies read the whole map, no tile uncharted to them, and an enemy attacks only a unit its own sight reaches: within its sight from its own tile, the line over the ground clear, whatever its fellows see. So an enemy of range one attacks beside it as ever, and one of a longer range shoots over no hill it stands under." The line over the ground is the one `docs/CHRONICLE.md` _Sight_ defines for every watcher: a tile between them that is raised and stands at least as high as the watcher's tile stops it, the seen tile's own elevation is never checked, and a line along an edge is clear when either way is. No player-facing sentence: nothing reaches the screen.

**Doc-impact:** none — the sentence landed with the rung's cut.

**Scope:**

- In: a reading of the units an enemy can attack from a tile that answers its own sight — the target within the enemy's sight stat of that tile and the line clear from it — over the terrain as it stands, on top of what range already answers. The enemy phase holds the choke point: a target the script names that the acting enemy's own sight does not reach is a `runtime-error` change and no attack, and the phase goes on. The guard and the raider choose a striking landing and a target through that reading, so an archer enemy walks to where it both sees and reaches, and a guard's "a unit it could attack from inside its radius" reads the same way.
- Out: charting and fog, which the enemies keep ignoring; the player's attack, which keeps reading the faction's sight; the embarked rules, unchanged; any unit's sight blocking another's, which the design does not have.
- Corner cases decided here: the reading is from the tile the enemy would stand on, so a landing is weighed on what is seen from it, not from where the enemy stands now. A unit with a sight of nought attacks nothing, beside it included, since nothing is within its sight; no content fields one. The guard's coarse pre-filter of targets, distance from the camp less the radius, stays on range alone: the per-landing check is what decides.
- Reconcile: the player's targets and the enemy's are two readings of one line over the ground and stay apart above it on purpose: the player's reads what any of their units or the city sees, the enemy's its own eyes alone. The line is shared, nothing else.

**Traps:**

- `src/rules/units.ts` says of its attack helpers "Range alone: sight is not read here", and `src/rules/chronicle.ts` filters the player's targets through `inSight` afterwards. `inSight` is the faction's whole sight, short-circuits on the settle phase and counts every held tile as seen: the enemy's reading must not go through it.
- The line check is private to `src/rules/sight.ts` and carries the two-way nudge along a shared edge, with its tests in `src/rules/sight.test.ts`; reuse it rather than re-deriving a line.
- `src/rules/` never imports `src/content/`: the scripts in `src/content/scripts.ts` call rules helpers, never the other way.
- A script's choice is content that decides: each choice gets one test beside the script in `src/content/scripts.test.ts` on the fixture's ground. The standing tests there, and the enemy-phase tests in `src/rules/enemies.test.ts`, set their ground on the fixture's terrains, four of which are raised; a test that now attacks nothing is reporting a hill the fixture put in the way, not a weakened rule, and is read before it is touched.
- The fixture's units all carry a sight of two with ranges of nought, one and two; the proof needs no new fixture content.
- `runtime-error` is a change that moves no row, raised in place of the change it could not make; `src/rules/stages.ts` holds the closed set of change names.

**Plan:**

1. The rules: the enemy's own-sight reading of its attackable units from a tile, beside the attack helpers or the sight module; the enemy phase refusing an unseen target as a `runtime-error`; the one test on the fixture, a range-two enemy on the plain with a forest between it and a unit two tiles off attacking nothing, and attacking it from the hills. Leaves standing: the rules refuse the unseen attack, and every script still passes where its ground is flat.
2. The scripts: the raider's striking landings and its target, and the guard's, read through the new reading; one test beside each decision. Leaves standing: an archer enemy walks to where it sees and reaches.
3. `npm run check`, `npm test`, `npm run lint`.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — nothing reaches the screen. CI proves on the push the specs that walk the enemy phase: `e2e/attack.spec.ts`, `e2e/archer.spec.ts`, `e2e/camps.spec.ts`, `e2e/fall.spec.ts`.
