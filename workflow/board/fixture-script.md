# The fixture's own script

**Line:** **The fixture's own script** — `src/rules/` imports nothing from `src/content/`, the fixture catalogue runs on a script of its own, and the default script's decisions are held by a content test beside it. Doc-impact: `DOGMAS.md`, `docs/CHRONICLE.md`.

**Spec:**

`DOGMAS.md` → _Stack_, the rule "`src/rules/` never imports Phaser, never touches the DOM and never imports `src/content/`" is the spec for the import: it names no exception, and the comment in `src/rules/fixtures.ts` claiming a test-only one goes with the import.

`DOGMAS.md` → _Testing_, the bullet "A mechanism gets one test on synthetic content; content gets coherence checks, never a gameplay test" gains the cut for content that decides. The bullet, in full, becomes:

> - **A mechanism gets one test on synthetic content; content gets coherence checks, never a gameplay test.** A rule is proven through the fixture catalogue on numbers of the fixture's own; a real card, unit, event or schedule gets its ids resolved, its text found and its closures answered on a launched chronicle, and nothing more. A test that reads its oracle from the content's own table, or seeds exactly a real card's price, is a content test wearing a mechanism title. Why: a content test breaks at every tuning, and a rule proven on real numbers is proven for those numbers alone. **Content that decides is the exception.** An enemy script carries no number, only choices the rules do not make — which target, which landing, whether it strikes from the city's tile — and each choice gets one test beside the script, the real closure played on the fixture's ground; content that only lays numbers over the rules' helpers decides nothing and gets the coherence checks alone. Why: a coherence check notices no decision changing, and a decision changed is the game playing differently.

`docs/CHRONICLE.md` → _The turn_, step 7 **Enemy phase**: the sentence "An enemy standing on the city's tile attacks nothing: it is there to capture." is removed from the step. The step then reads: "🔧 Neutrals move; each enemy in turn, on the chronicle as the enemy before it left it, moves by its script and then attacks a unit of the player's within its range, spending its action as any unit does. The enemies that act are those standing when the phase begins: one a fellow has killed before its turn acts no more, and one entered during the phase waits for the next. Once the enemies have acted, each camp whose tile is free rolls whether a warrior enters on it. An attack declared a turn before it lands was rejected: …" — the rest unchanged.

`docs/CHRONICLE.md` → _Events and the capstone_, the paragraph **Enemies enter from camps**: the sentence "The enemy follows its script — the default one moves toward the nearest of the player's units or the city and attacks it." becomes "The enemy follows its script — the default one moves toward the nearest of the player's units or the city by the cheapest way, attacks it, and attacks nothing from the city's tile: it is there to capture. Whether a script strikes from there is content."

No player-facing sentence: nothing on screen changes.

**Doc-impact:** `DOGMAS.md` (the Testing clause), `docs/CHRONICLE.md` (one sentence moved from the phase to the default script).

**Scope:**

In:

- The fixture catalogue carries a script written in `src/rules/fixtures.ts`, under an id of the fixture's `PH_` convention; the fixture's camp and the fixture's enemy-standing helper name that id. The script decides as little as it can: it steps to the landing nearest the city by plain hex distance, out of the tile it stands on and the landings the rules list for it, ties falling to the first the rules list; and it attacks what the rules' least-health helper names, from the city's tile like any other.
- The import of `src/content/scripts` leaves `src/rules/fixtures.ts`, and the comment excusing it with it.
- Four tests leave `src/rules/enemies.test.ts` for `src/content/scripts.test.ts`, beside the script, keeping their assertions: the forest on the enemy's way; the river weighed as its whole move and turned away from; the nearest of the player's units chosen over the city; attacking nothing from the city's tile. The content test builds its catalogue as the fixture catalogue with the default script under the fixture's script id, so the fixture's camp and enemy helpers resolve, and plays it on the fixture's ground through the fixture's helpers.
- The city-tile test splits: its mechanism half — an enemy that reaches the city's tile stands there with no ending, and captures it at the next enemy phase — stays in the rules on the fixture's script, without the worker beside the city and without the assertions on attacks and health; its decision half — the default script attacks nothing from the city's tile, the unit beside it unharmed — is the content test.
- One rules test, "a unit killed in the enemy phase captures the camp it stood on no longer", pins its enemy with no move: on the fixture's script it would walk toward the city instead of standing beside the worker it kills. The fixture changes, the assertion does not.
- The two page edits above.

Out:

- The default script's behaviour: it changes nowhere, and keeps its own city-tile check.
- The nomadic and stand-in coherence tests: neither asks its scripts anything, and that gap is a line of its own if the user wants one.
- Any lint or hook enforcing the import rule.

Corner cases decided here:

- The fixture's script is the only script the fixture catalogue carries; a rules test that wants the default script's decisions is a content test and moves.
- A rules test whose expectation held only through the default script's tie order or target choice is re-read against the fixture's script; where the fixture's script gives a different landing, the fixture is adjusted — never the assertion. The intake traced every kept enemy-phase test and found exactly the one pin above.

**Traps:**

- The fixture's enemy-standing helper hard-codes the script id the enemies enter with, and the fixture's camp names its script separately; both must name the fixture's script id, and the fixture catalogue's validation refuses a camp whose script id does not resolve.
- The rules list a unit's landings in the order the chronicle lists its tiles, and the fixture's disc lists them by q then r ascending; "the first the rules list" is that order, and it is the order the default script falls back on too.
- The test "the enemy phase holds each enemy's move and attacks, then the warriors the camps roll" stages a move from an enemy already adjacent to the worker it then attacks. On the fixture's script the move is still staged, because the landing nearest the city is one step on and still adjacent to the worker; the test holds unchanged.
- The helpers the moved tests use to read moves and attacks off the staged end of turn are local to the rules' enemy-phase test; a helper two test files use moves to `src/rules/fixtures.ts`, and a content test imports the fixture module as the coherence tests already do.
- The enemy-phase paragraph of the design page is one line; the sentence leaves mid-paragraph, and Prettier refuses a wrapped one.

**Plan:**

1. `DOGMAS.md`, `docs/CHRONICLE.md` — the Testing clause added, the city-tile sentence moved from the phase to the default script. Leaves the spec saying what the code is about to do.
2. `src/rules/fixtures.ts` — the fixture's script written and named by the camp and the enemy-standing helper; the content import and its comment gone; the staged-move and staged-attack readers the content test will share moved in. Leaves `src/rules/` importing nothing from `src/content/`, and the four decision tests failing on the fixture's script.
3. `src/rules/enemies.test.ts` — the three route tests out, the city-tile test cut to its mechanism half, the one enemy pinned with no move. Leaves the rules tests green on the fixture's script.
4. `src/content/scripts.test.ts` — the four decision tests, on the fixture catalogue carrying the default script under the fixture's id. Leaves the default script's every decision held beside it.
5. `workflow/BOARD.md` — the line deleted.

**Verify:**

- `npm run check`
- `npm test`
- `npm run lint`
- A search for `content/` under `src/rules/` finds nothing.
- No Playwright spec: nothing on screen changes, and the default script the stand-in plays on is untouched.
