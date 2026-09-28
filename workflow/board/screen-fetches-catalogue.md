# The screen fetches the catalogue, the pieces receive it

**Line:** The screen fetches the catalogue, the pieces receive it — in `src/ui/`, outside the tests, `CATALOGUE` is read only inside the methods of a scene class and in `src/ui/save-entry.ts`: `src/ui/tree.ts` and `src/ui/stack.ts` no longer import it, the launch screen's helpers outside its class take it as an argument, and the campaign screen reads it and hands it down; `DOGMAS.md` carries the rule; `npm run check`, `npm test`, `npm run lint` and `e2e/tree.spec.ts` pass.

**Spec:** `DOGMAS.md` → _Stack_, a new line directly after the one opening "**`src/rules/` never imports Phaser, never touches the DOM and never imports `src/content/`; `src/ui/` never mutates state.**":

> - **In `src/ui/`, `src/content/` is imported by a scene and by `src/ui/save-entry.ts` alone, and a scene reads the catalogue in its own methods only.** Every other function — a piece the scene builds, a helper beside the scene in its file — receives the catalogue as an argument from the one that calls it. Why: a piece that takes the catalogue is tested on the fixture's, and a piece that imports it can never be.

No player-facing entry is added or changed.

**Doc-impact:** none under `docs/` — the rule is how the code is built, and its home is `DOGMAS.md`, written above.

**Scope:**

- In: `src/ui/stack.ts`'s card shown large and `src/ui/tree.ts`'s technology tree, and every function in either file that reads the catalogue, take it as an argument; `src/ui/campaign-screen.ts` imports the catalogue and hands it to both; `src/ui/launch-screen.ts` hands it to the card shown large, and its helpers outside the `LaunchScreen` class that read it today — the Continue text's readings, the time arrow, the regions, the piles — take it as an argument from the scene's methods.
- Out: `src/ui/chronicle-scene.ts` already reads the catalogue in its class's methods alone and is untouched; `src/ui/save-entry.ts` stays an importer; `e2e/` specs and every `*.test.ts` are untouched — the rule is `src/ui/`'s; no lint rule enforces it, the review does.
- Nothing the player sees changes: no screen, no press, no text.

**Traps:**

- The rules test fixture exports a `CATALOGUE` of its own (`src/rules/fixtures.ts`); the rule and the done-condition's check are about the one in `src/content/catalogue.ts`.
- The card shown large is built on two screens, the campaign screen and the launch screen; both call sites change with it.
- The launch screen's `readingsOf` and the tree's `readingsOf` are two unrelated functions of the same name in two files.

**Plan:**

1. `src/ui/stack.ts`, `src/ui/tree.ts`: the catalogue arrives as an argument; `src/ui/campaign-screen.ts` and `src/ui/launch-screen.ts` pass it. Leaves standing: the campaign screen reading the catalogue in its own method and handing it down, neither piece importing it.
2. `src/ui/launch-screen.ts`: the helpers outside the class take the catalogue from the scene's methods. Leaves standing: the launch screen reading the catalogue in its class alone.
3. `DOGMAS.md`: the line above, verbatim.

Done-condition check: a search for `CATALOGUE` under `src/ui/`, test files excluded, finds it only in `chronicle-scene.ts`, `launch-screen.ts` and `campaign-screen.ts` inside their scene class, and in `save-entry.ts`; `src/content/` is imported by those four files alone.

**Verify:** `npm run fmt`, then `npm run check`, `npm test`, `npm run lint`; the proof spec is `npx playwright test e2e/tree.spec.ts` (the campaign screen's tree and its card shown large, both changed). CI proves on the push, for the hand-back: `e2e/launch.spec.ts`, `e2e/continue.spec.ts`, `e2e/boot.spec.ts`, `e2e/campaign.spec.ts`.
