# The change carries the chronicle before

**Line:** The change carries the chronicle before — every stage, a change or a group, carries the chronicle it was raised on beside the one it leaves; the three achievement tallies that walked the stages keeping a chronicle of their own read it off the stage instead; one test on the fixture holds the invariant across a command's stages. Doc-impact: none — the stage's shape is `DOGMAS.md`'s.

**Spec:** `DOGMAS.md`, _Architecture_, the second bullet. Its opening sentence, "**The flow is a tree of stages, every one carrying the chronicle it leaves, and a change is one row of the chronicle moved.**", becomes:

> **The flow is a tree of stages, every one carrying the chronicle it was raised on and the one it leaves, and a change is one row of the chronicle moved.**

Same bullet, the sentence "A change is named for the fact that moved, its direction and amount read off the chronicles before and after, and carries only what those cannot say." becomes:

> A change is named for the fact that moved, its direction and amount read off the two chronicles it carries, and carries beside them only what those cannot say; a group's two are the chronicle it was handed and the one its last stage leaves, one and the same where it holds nothing. Why both: a listener reads what moved off the one stage, and no reader keeps a walk of its own.

No player-facing sentence: nothing reaches the screen.

**Doc-impact:** none — the stage's shape is stated in `DOGMAS.md` and on no `docs/` page.

**Scope:**

- In: the stage's shape gains the chronicle it was raised on, on a change and on a group alike; every place that raises a change hands it in, the three constructors in `src/rules/stages.ts` and the three places that build a change as a literal (`src/rules/chronicle.ts` the unit crossing, `src/rules/city.ts` the population taken past nothing, `src/rules/cards.ts` the step of an embark); a group's is its first stage's, or the chronicle it was handed where it holds none, which is also the one it leaves. The three achievement helpers in `src/rules/chronicle.ts` that walk the stages keeping a `before` of their own — the units killed by a kind, the resource gained from a terrain, the draw pile emptied — read it off the stage, their walks gone; their existing tests stay as they are and stay green. One test on the fixture: a command raising many stages, an end of turn, walked in order, every stage's chronicle before being the one the leaf before it left, the first being the chronicle the command was applied to, and a group's being its first stage's, a refused command's group carrying the one chronicle twice.
- Out: any reader outside the rules; the chronicle screen's play-out loop, which tracks the chronicle it stands on to render in order and reads no before; the simulator, whose row reads the before in its own line; the save, which serialises the state and never a stage.
- Corner cases: a `runtime-error` moves no row and is raised on the chronicle it leaves, so its two chronicles are one object, as a group holding nothing carries one object twice; every other change moves a row and carries two. A group's before is derived from what it holds, never passed by the caller.

**Traps:**

- `change`, `changeOn` and `changeFrom` in `src/rules/stages.ts` have 66 call sites across `src/rules/` (`cards.ts` 17, `chronicle.ts` 18, `city.ts` 13, `enemies.ts` 4, `schedule.ts` 9, `stages.ts` 4, `catalogue.ts` 1); `save.test.ts` matches the pattern with a parameter named `change`, not a constructor. At every site the chronicle the change was raised on is the one spread into the new one, `{ ...chronicle, … }`, `{ ...left, … }`, `{ ...paid, … }`: it is at hand, never computed.
- `change('runtime-error', chronicle)` is raised at fourteen sites across `cards.ts`, `city.ts`, `chronicle.ts`, `enemies.ts` and `schedule.ts`, each on the chronicle it leaves: there the one chronicle is handed in twice. `moved` in `src/rules/chronicle.ts` already takes both chronicles; `fall` in `src/rules/stages.ts` takes the one it ends and spreads it; `landedAs` takes a built change and reads its chronicle; `grouped(head, over)` builds the group from a sequence whose `chronicle` is the one handed in where `stages` is empty.
- `followed(first, next)` hands each step the chronicle the one before left, so a step's argument is the before of every change it raises. `unchanged(chronicle)` raises no stage and needs nothing.
- The scene's loop at `src/ui/chronicle-scene.ts:311` sets `current` on each leaf to render in order; it is not a before-walk and is left alone. `src/ui/map.ts`, `hand.ts` and `piles.ts` switch over every change name and read `stage.chronicle`; a field added breaks none of them, and the closed-set switches need no new case.
- `reckoned` in `src/rules/chronicle.ts` walks the strikes' stages reading the `uncovered` cost off `population` changes and needs no before.
- No test builds a stage by hand or asserts a stage object whole; tests read names through helpers like `namesOf` and `heldBy`. Vitest's `toEqual` on a whole stage would be the shape to avoid in the new test: assert identity of the chronicles, `toBe`.
- A hook flags a comment block longer than three lines touched under `src/`; the constructors' docblock in `stages.ts` is re-shaved when edited.
- `docs/PHASER.md` holds nothing this line needs: no file under `src/ui/` or `e2e/` changes.

**Plan:**

1. `src/rules/stages.ts` — the shape: a change and a group each carry the chronicle they were raised on; the three constructors take it; `grouped` derives the group's. `npm run check` red at every call site, which is the list of step 2.
2. `src/rules/` — every call site and the three literal constructions hand the chronicle in; `npm run check` and `npm test` green, behaviour unchanged.
3. `src/rules/chronicle.ts` — the three achievement helpers read the before off the stage, their own walks gone; their tests green unchanged.
4. The test on the fixture, beside the module it covers, as the Scope says.
5. `DOGMAS.md` — the two sentences above.
6. `workflow/BOARD.md` — the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Spec: none — the change is a field on a rules value the screen already reads past; no behaviour reaches the screen. CI proves on the push every spec that plays a stage tree, the whole suite, listed for the hand-back and never run.
