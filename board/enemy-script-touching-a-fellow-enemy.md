# An enemy script touching a fellow enemy

**Line:** **An enemy script touching a fellow enemy** — the enemy phase reads each acting enemy live from the units the enemy before it left, so what a fellow's script did to it stands, and one killed before its turn acts no more. Doc-impact: `docs/CHRONICLE.md`.

**Spec:** `docs/CHRONICLE.md`, _The turn_, item 7 **Enemy phase**. Its clause "each enemy moves by its script and then attacks a unit of the player's within its range, spending its action as any unit does." is replaced, verbatim, by: "each enemy in turn, on the chronicle as the enemy before it left it, moves by its script and then attacks a unit of the player's within its range, spending its action as any unit does. The enemies that act are those standing when the phase begins: one a fellow has killed before its turn acts no more, and one entered during the phase waits for the next." Nothing else on the page changes. No player-facing sentence: no script today touches a fellow, so nothing on screen changes.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:** In: the hardening of the enemy phase and the design clause. Out: any script that touches a fellow enemy (none exists; the one script moves the enemy itself and attacks a unit of another faction only), any test — decided by the user: the defect is latent, no fixture can reach it without a spy or a seam, and the first script that touches a fellow brings its own test. The done-condition is checked by reading the phase: the acting enemy comes from the threaded list, never from the start-of-phase snapshot, and an enemy absent from the threaded list is skipped.

Corner cases decided: the roster is the enemies standing when the phase begins, in unit order. Each is looked up live in the units the enemy before it left: one killed by a fellow is absent and skipped; one moved by a fellow acts from where it stands; one hurt by a fellow keeps its wounds. An enemy a fellow's script enters mid-phase is not on the roster and waits for the next phase, so nothing acts twice. The capture check at the top of the phase, and the stages a move or an attack push, are unchanged.

**Traps:**

- The defect: `enemyPhase` in `src/rules/chronicle.ts` iterates the start-of-phase `chronicle.units` and takes `acting` from that iteration, then writes `acting` back over the threaded `units` on every move and attack. That write-back is what reverts a fellow's change and would resurrect a killed enemy on its own move. The scripts already receive the threaded list; only the acting enemy's own state is stale.
- A killed unit is removed from the list by `attacked`; there is no dead flag. "Absent from the threaded list by id" is the whole test for killed.
- Unit `id` is the identity; the write-back by id stays as it is.
- No current script touches a fellow, so every existing fixture yields exactly the same stages; any change in `npm test` is a defect of the change, not a fixture to update.
- The design paragraph is one line inside a numbered list item; `npm run lint` refuses a wrapped one.
- Another session may be shipping the seeds-dealt-no-camp line in the same tree. This line touches `src/rules/chronicle.ts`, the enemy-phase item of `docs/CHRONICLE.md` (the seeds line edits the camps paragraph of the same page, further down), `BOARD.md`'s own line and this dossier. Stage those alone; leave any other change in the tree where it is.

**Plan:**

1. `src/rules/chronicle.ts`, `enemyPhase`: the loop keeps iterating the start-of-phase list for the roster and the order, but resolves each roster entry to the unit of that id in the threaded `units` before acting, and skips an entry no longer there. The rest of the body — the capture check, the move, the attacks, the stages — stays. The doc comment's "every enemy acts in unit order, on the chronicle the one before it left" gains "as it stands there; one killed before its turn acts no more".
2. `docs/CHRONICLE.md`: the clause swap written out under _Spec_.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then `npx playwright test e2e/attack.spec.ts` (the spec that walks the enemy phase's attacks) and `npx playwright test e2e/end-of-turn.spec.ts`, one at a time.
