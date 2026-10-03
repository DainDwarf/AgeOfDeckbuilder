# The launch warning

**Line:** **The launch warning** — Launch over a saved chronicle that has reached an achievement raises a warning titled Chronicle, listing those achievements, that Back, the back key or the scrim takes down unchanged and Launch goes through; one with none reached launches at once; `e2e/launch-warning.spec.ts` proves it. Doc-impact: `docs/META-SCREENS.md`.

**Spec:** `docs/META-SCREENS.md` _The launch screen_, the Continue and Launch paragraph. The design is decided there already ("Where that chronicle has reached an achievement, Launch raises a **warning** first, saying that the chronicle and its achievements go with it, and the launch goes through the warning or is backed out of."); this line writes the warning's shape in after that sentence. Replace that sentence with:

> Where that chronicle has reached an achievement, Launch raises a **warning** first, a window of the menu on its scrim: under the title Chronicle, a sentence saying that the chronicle ends and its achievements are not paid, then a line over the achievements it has reached, each read as Continue reads it, then Launch and Back. Back, the back key or a press on the scrim takes the warning down onto the launch screen, the choices and the save as they were; Launch gone through opens the chronicle on the choices as they stand.

`docs/INTERFACE.md` needs no edit: its scrim, back-key and menu-stacking sentences already cover a window of the menu.

Player-facing entries in `src/ui/text.ts`, verbatim:

- The title reads the existing `navbar.chronicle` entry ("Chronicle"), no new key: the window is named after the screen it is raised on, as the import and clear warnings are named after Manage Save.
- `launch.warning`: `Launching ends the chronicle in progress, and its achievements are not paid. This cannot be undone.` It ends in a period, as its two sibling warning sentences do, the user's choice for the window family.
- `launch.unpaid`: `Achievement you will lose:` Singular over a list of any length, as a plate's "Reward" stands over several lines; no plural branch. "lose" is not a forbidden word of `docs/GLOSSARY.md` (the lint matches "lost" and "loss" as whole words), so it needs no glossary-exception marker; the user chose the word knowing its neighbours.
- Each listed achievement reads the existing `achievement.reached` entry (`✓ {achievement}`) under its technology's name, exactly as Continue's lines do.
- The through button reads the existing `launch.button` ("Launch"); Back reads `control.back`.

**Doc-impact:** `docs/META-SCREENS.md`, the one sentence above.

**Scope:**

- In: the warning, raised by Launch alone, only while the save holds a chronicle with at least one achievement reached; its window, its takedowns, its going through; the spec; the reconciles below.
- Out: Continue, unchanged; the import and clear warnings' behaviour, unchanged (they may move onto the shared shape, nothing they show or do changes); the debug console's `seed` entry, which launches over a saved chronicle with no warning (`docs/INTERFACE.md` _The debug console_) and keeps doing so.
- Corner cases decided here:
  - A chronicle on its settle phase that recorded an achievement at the launch (`docs/META.md`: "one met there is recorded at the launch") raises the warning like any other: the condition is an achievement reached, nothing else.
  - A chronicle with none reached launches at once, as today.
  - The warning taken down leaves the selected age, region and civilization as they were, and the save untouched.
  - Gone through, the chronicle opens on the choices as they stand, on a seed drawn fresh, exactly as an unwarned Launch does; it does not land on the campaign screen as the import and clear warnings do.
  - The scrim covers the navbar, the bar and the Menu button, as every window of the menu does; under it the launch screen hears no key.
  - The header line and the achievement lines stand as one block, the lines stacked tight under the header as Continue's lines stack; the block stands one window padding below the sentence, as any line of a window stands below the one before.
- Reconcile, each chosen by the user:
  1. **The warning window** goes through the standing one — the menu's `Warning` windows in `src/ui/menu.ts`, raised by `src/ui/menu-scene.ts`. The three differences are what the shared door takes: lines of its own read from the chronicle (the header and the achievements), what the window's title reads, and where going through lands — today `warn` in `menu-scene.ts` always follows the press with the campaign screen; that landing becomes part of each warning's own going-through, the import and clear warnings keeping theirs. Back, the back key and the scrim are the standing window's, unchanged: the launch warning closes back to nothing.
  2. **The achievement lines**: Continue's reading (`readingsOf` in `src/ui/launch-screen.ts`) and the warning's list are one reading of the reached achievements under their technologies' names; the warning does not re-derive it.
  3. **"Has reached an achievement"** is the same fact Continue's lines filter on (`reached`); the warning is raised on that one reading — the list it would show being empty is the same as no warning.
  4. **The spec's chronicle**: `e2e/pin.spec.ts` builds a second-age chronicle that reaches the agriculture achievement by claims (its `rowOf` and the `firstSeed` loop in "a chronicle of the second age that has reached the pinned technology's achievement…"). That builder moves to `e2e/chronicle-screen.ts` and both specs use it; no re-copy.

**Traps:**

- `warn` in `src/ui/menu-scene.ts` appends `campaignStands()` after every going-through: left as is, the launch warning would open the chronicle and then start the campaign screen over it.
- The launch warning stands on the menu scene's scrim, so `resetMenu` (`src/ui/menu-scene.ts`) on the chronicle screen that rises closes it; the menu scene is never stopped and outlives every screen.
- `WINDOWS[...].from` decides where Back and the back key step: undefined closes the menu altogether, which is what this warning wants.
- The launch screen's own `open` also serves the console's `seed` entry (`offerEntries` in `src/ui/launch-screen.ts`); the warning goes on the Launch button's press, not inside `open`.
- `savedOpening()` is what both Continue and the warning read the save through; read it at the press, as Continue's press reads the opening it was laid with — the save cannot change under the launch screen without the screen being restarted (an import or a clear lands on the campaign screen).
- `docs/PHASER.md` _Under a Playwright spec_ and _Input across scenes_: a window raised on the menu scene answers presses only from the next frame, so the spec rests (`rested`) before every press after the warning rises.
- `e2e/manage-save.spec.ts` holds a local `goneThrough(page, warning)` helper and reads the warning windows by the names `<warning>`, `<warning>-title`, `<warning>-through`, `<warning>-back`; keep the new window's names in that family (`launch-warning`, …) so the same reads serve, and if the new spec needs `goneThrough` it moves to `e2e/chronicle-screen.ts`.

**Plan:**

1. `e2e/chronicle-screen.ts` and `e2e/pin.spec.ts`: the reached-by-claims chronicle builder moved and shared; pin.spec unchanged in what it asserts.
2. `src/ui/menu.ts`, `src/ui/menu-scene.ts`: the warning window shape takes the three differences; the import and clear warnings unchanged on screen and in behaviour.
3. `src/ui/text.ts`: `launch.warning`, `launch.unpaid`.
4. `src/ui/launch-screen.ts`: the reached-achievement reading shared between Continue and the warning; Launch raises the warning where it is non-empty and launches at once otherwise.
5. `e2e/launch-warning.spec.ts`: over a saved second-age chronicle that has reached an achievement (campaign from `wonCampaign()`), Launch raises the warning — the title, the sentence, the header and one line per reached achievement, each line equal to Continue's for that achievement; Back takes it down with the launch screen standing and the saved chronicle unchanged; the back key likewise; a press on the scrim likewise; Launch gone through opens the chronicle screen on a new chronicle of the selected age, region and civilization, the saved one gone. Over a saved chronicle that has reached none (asserted as the precondition), Launch opens the chronicle screen with no warning raised.
6. `docs/META-SCREENS.md`: the sentence in Spec.

**Verify:**

- `npm run check`, `npm run lint`, `npm test`.
- The proof: `npx playwright test e2e/launch-warning.spec.ts`.
- CI's, listed for the hand-back, never run locally: `e2e/continue.spec.ts`, `e2e/launch.spec.ts`, `e2e/manage-save.spec.ts`, `e2e/menu.spec.ts`, `e2e/console.spec.ts`, `e2e/pin.spec.ts`.
