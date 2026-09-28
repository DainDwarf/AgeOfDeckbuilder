# The launch screen chooses no seed

**Line:** The launch screen chooses no seed — the launch page is the launch screen by name in the docs, the code and the specs; it holds no seed slot and hears no key but the back key, every Launch drawing a fresh seed; `npm run check`, `npm test`, `npm run lint` and `e2e/boot.spec.ts` pass.

**Spec:** `docs/INTERFACE.md`.

- The page's opening summary (line 3) reads "the launch screen" where it reads "the launch page".
- _The debug console_ reads "on every screen, the launch screen among them" where it reads "the launch page among them".
- The section _The launch page 🔧_ becomes _The launch screen 🔧_, and its paragraph is replaced whole by:

  > **Chronicle** opens the **launch screen**, which wears the navbar and the bar. The screen is one row per choice — the age, the region and the civilization — the first of each list chosen until another is pressed, the civilization row listing the campaign's civilizations, and **Launch** under the rows, which opens the chronicle on those choices, on a seed drawn fresh at every launch. The screen hears no key but the back key. While the save holds a chronicle, **Continue** stands at the head of the screen, over the rows, reading where that chronicle stands — the settle phase, or its turn — and under that the achievements it has reached, and opens it where it stood; Launch then ends that chronicle, which pays nothing. The address is the developer's door and the test suite's: one that names `continue` opens the chronicle the save holds straight, and the boot fails where the save holds none; any other address boots on the campaign screen, whatever else it names; and the chronicle screen writes nothing into the address.

No player-facing sentence is added. The text entries `launch.seed` and `launch.fresh` are deleted.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- In: the seed slot, its label and its reading gone from the screen; the digits, Backspace and Enter no longer heard by the screen; the rename of the launch page to the launch screen wherever it is named — `docs/INTERFACE.md`, the module `src/ui/launch-page.ts` and its class, the comments and test titles of `e2e/`, and the two harness mentions in `.claude/skills/run/SKILL.md` and `.claude/agents/ui-check.md`; the specs that launched through Enter or read the seed slot.
- Out: every change of look. The rows stay word buttons, the title stays, Continue stays absent while the save holds no chronicle: the next line redraws the screen. The scene's key `launch` and the names the specs press (`navbar-launch`, `launch-button`, `launch-continue`, `launch-<row>-<option>`) stay as they are.
- Out: a seed from the debug console. It is an idea in `workflow/IDEAS.md` and stays one.
- Decided: a chronicle is still launched on a seed the chronicle screen draws where it is handed none, and a resumed chronicle still carries its own; only the launch screen stops handing one.
- Decided, a test's promise changes, agreed with the user at the intake: `e2e/boot.spec.ts` "the console over the launch page takes its digits and its Enter" promised that the console's keys never reach the page under it. The screen hears no digit and no Enter any more, so the test becomes two promises a player could state: Enter on the launch screen launches nothing, and the back key under the console closes the console and raises no menu.

**Traps:**

- `CHANGELOG.md` is never reworded: a past entry naming the launch page or the seed keeps its words.
- The debug console hears its keys through its own reader and stands over every screen; removing the screen's key reader must leave the console's typing, and the back key's menu, working on the launch screen. `docs/PHASER.md` holds how keys cross scenes.
- `e2e/menu.spec.ts` reads the seed slot (`seedReads`, `launch-seed-label`) inside the test "Campaign opens the campaign screen, Chronicle there the page on the firsts, the seed blank, …": the seed assertion and the helper go, the title loses "the seed blank", and the rest of the test stands.
- `e2e/chronicle-screen.ts` holds an `enter` helper that presses Enter for the debug console: it is the console's and stays.
- A spec rests before it presses (`rested`), `DOGMAS.md` _Testing_.

**Plan:**

1. The launch screen's module: the seed slot, its reading and the key reader gone, Launch handing no seed; the module and its class renamed. Leaves the screen launching on a fresh seed by the button alone, `npm run check` passing.
2. The text table: `launch.seed` and `launch.fresh` deleted. Leaves `npm test` passing, the text coherence test among it.
3. The specs: `e2e/boot.spec.ts`'s console test rewritten as the two promises above; `e2e/menu.spec.ts`'s seed assertion removed; "launch page" and "the page" reworded to the launch screen in the specs' titles and comments where they name it.
4. The docs and the harness mentions: `docs/INTERFACE.md` as the Spec writes it, the two `.claude/` files reworded.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/boot.spec.ts`. CI proves on the push: `e2e/menu.spec.ts`, `e2e/continue.spec.ts`, `e2e/campaign.spec.ts`, `e2e/ending.spec.ts`.
