# The pinned achievement

**Line:** **The pinned achievement** — a left click on an available technology's plate pins it, the pin kept in the save, and a chronicle that reads the pinned technology's achievement shows it in the map's top left corner: the technology's name, its goal, its count over its need, a check mark once reached; `e2e/pin.spec.ts` is green. Doc-impact: `docs/GLOSSARY.md`, `docs/META.md`, `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`.

**Spec:** the sentences below are the spec, verbatim; a rephrase is authored.

- `docs/GLOSSARY.md`, a new row under **unknown technology**: `| **pin** | To hold one available technology in view: while a chronicle reads its achievement, the chronicle screen shows it. | track (for an achievement), follow (for an achievement), watch (for an achievement), bookmark |`
- `docs/META.md`, _The campaign_, a new paragraph after the first: "The player **pins** one available technology at most, and the pin is the campaign's, kept in the save. Pinning another technology moves the pin, and a technology that is learned is pinned no longer. A chronicle that reads the pinned technology's achievement shows it on its screen, as [`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md) says; any other chronicle shows nothing of it. The pin changes nothing a chronicle reaches or pays."
- `docs/META.md`, _The campaign_, second paragraph: "A tally is its achievement's alone and is shown nowhere." becomes "A tally is its achievement's alone and is shown nowhere: what a screen reads of an achievement is its count." The provisional sentence on what fails an achievement stands as it is.
- `docs/META-SCREENS.md`, _The campaign screen_, second paragraph: the clause "; the rest of a plate answers no press." becomes "; a left click anywhere on the plate of an available technology pins that technology, a name in its text included, and a left click on the pinned plate takes the pin off. The pinned plate is edged in the pin's colour. The plate of a learned technology and of an unknown one answers no left click."
- `docs/META-SCREENS.md`, _The campaign screen_, third paragraph, after "a press held on the room drags it.": "A press that drags the tree pins nothing."
- `docs/CHRONICLE-SCREEN.md`, a new subsection `### The pinned achievement` between _The piles_ and _The windows_: "While the campaign pins a technology whose achievement the chronicle reads, that achievement stands in the map's top left corner, as far from the map's top and left edges as a mode's chip stands from its top and right ones, on the panel's paper and as wide as a plate of the tree. It reads the technology's name; at the right end of the name's line, the achievement's count over its need, which a need of one does not read; and under the name the goal as the plate reads it, wrapped onto as many lines as it takes, the paper as tall as they stand. Once the achievement is reached it is sunk in a well, a check mark before the name, and reads no count. A name in the goal answers the rest and the right click as on a plate. It answers no press, and a press on it reaches no tile under it; the wheel over it zooms the map, as over the resource bar. It stands on the settle phase and in city mode as on any turn. A chronicle that does not read the pinned technology's achievement, and a campaign that pins nothing, show nothing there."
- `docs/INTERFACE.md`, _What stands over what_: "the frame and chip of a mode over it," becomes "the frame and chip of a mode and the pinned achievement over it,".
- Player-facing entries, both without a period: the count, `{count}/{need}`; the reached name, `✓ {achievement}`, the one entry the ending screen's rows and Continue's readings read too, in place of the two they read today.

No page calls the thing on the chronicle screen a ledger: the ending screen's ledger keeps that word, and this is "the pinned achievement".

**Doc-impact:** `docs/GLOSSARY.md`, `docs/META.md`, `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`.

**Scope:**

In:

- The pin is one technology of the campaign, or none. The rules pin an available technology and refuse any other; pinning the pinned one is the screen's way to take it off, and the rules hold a way to pin nothing.
- An ended chronicle's payment that learns the pinned technology leaves nothing pinned.
- The save writes the pin and reads it back. A save with no pin reads as nothing pinned, which is all the care a save written before this line gets. A pin the campaign cannot hold — a technology the catalogue does not name, one learned, one unknown — is dropped at the reading with its reason, as anything else the campaign cannot resolve; a save file, an import and a clear follow the save with nothing of their own.
- The campaign screen: the left click pins, takes off and moves; the pinned plate's edge, the precedent being the selected region's edge on the launch screen; the pointer is a hand over an available plate, as over anything that answers a left click.
- The chronicle screen: the pinned achievement as the Spec says, redrawn as each stage of a play-out settles, with no motion of its own.
- The one reached entry, read by the pinned achievement, the ending screen's rows and Continue's readings.

Out: what fails an achievement and its cross mark, which the design keeps provisional and this line does not build; a second pin; pinning from the chronicle screen or the launch screen; a tooltip on the pinned achievement; any motion when the count moves or the achievement is reached.

Corner cases, decided:

- The chronicle screen reads the pin as it opens and never again: the pin moves on the campaign screen alone, so moving it mid-chronicle (Menu, Campaign, a press, Continue) is seen at the next opening, and under the ending screen the pinned achievement stands as it stood although the payment has just dropped the pin.
- A technology the chronicle in progress has reached and not yet been paid for is still available on the tree, so it is pinned like any other, and the chronicle screen shows it reached.
- A chronicle of another age than the pinned technology's achievement shows nothing: a chronicle reads its own age's achievements alone.
- A count at or over the need on an achievement not yet recorded reads as it is, between two stages; nothing clamps it.
- A left click on a name in an available plate's goal pins, as anywhere else on the plate; the name's right click and rest are unchanged.
- Under a scrim the tree pins nothing: the press is the scrim's.
- A right click on the pinned achievement beside a name does nothing and reaches no tile.

Reconcile, each chosen by the user:

- The goal's text goes through the plate's drawing as it is, the wrap width its parameter: 156 beside the plate's GOAL word, the whole inner width on the chronicle screen, where no GOAL word stands.
- The reached check mark: the ending screen's rows, Continue's readings and the pinned achievement become one entry. The learned plate's entry stays apart: learned is reached and paid.
- The sunk look once reached goes through the standing well, the one a learned plate is sunk in.
- The pin stays apart from the selection: its own verb, and its own entry in the look, which borrows the selection's value until the colours are discussed for v0.0.6.
- The count stays apart from the resource bar's stock over a threshold and the collection's copies held over owned: an entry of its own.
- Where it stands goes through the mode chip's clearances, mirrored to the left; how the pin is kept goes through the shape a copy bought or a card added has, a campaign in and a campaign out, the refusal the rules'.

**Traps:**

- `writeSave` (`src/rules/save.ts`) refuses a campaign its own reading would drop anything of. A pin left on a technology the payment has just learned makes the ending's write throw, so the pin is dropped where the technology is learned, never at the write.
- `readSave` leaves unread a field no shape names: the campaign's shape has to name the pin, and an absent one is nothing pinned, never a refusal.
- `src/ui/tree.ts` draws a goal through `addRun` and `drawRun`, both closed over the tree's own small cards, names and carry state. The chronicle screen needs the same drawing with its own; a second copy beside `src/ui/card-face.ts`'s is a re-copy the review blocks.
- The chronicle screen keeps one small-card chain for its whole surface (`faces.small` in `src/ui/chronicle-scene.ts`, and the comment over it): the names of the pinned achievement raise through it, and a second chain would stand two small cards at once.
- On the chronicle screen only an interactive object keeps a press from the map under it (`stopsThePointer`, `src/ui/design-space.ts`; `docs/PHASER.md`, _Input across scenes_), so the paper is interactive; it is not marked as answering a press, or the pointer would be a hand over it.
- The tree's drag starts on the scene's own `pointerdown`, not on a plate. A plate's click has to stay within the drag slack, as the names' right click does, or a drag released on a plate pins it. The names' zones stand over the plate and take the press ahead of it (`docs/PHASER.md`, _Input across scenes_).
- The mode chip's clearances are private to `src/ui/standing.ts`; the well is `createWell` and `placeWell` in `src/ui/resource-bar.ts`, with `SUNK` for what stands in it.
- `e2e/chronicle-screen.ts`: `plant` writes a new campaign beside the chronicle, and `launchedOn` and `settledOn` launch the first age. The spec needs a chronicle of the second age beside a campaign that pins. `onDeer` places a deer beside the city for a Hunt, as `e2e/trapping.spec.ts` uses it.
- `e2e/ending.spec.ts` reads the ending's reached entry by its key.
- Comments are for traps only; the docs hold the why.

**Plan:**

1. `src/rules/campaign.ts`, `src/rules/save.ts` and their tests: a campaign holds a pin, pins and unpins by the rules, loses it at the payment that learns it, and the save carries it. Leaves the rules tests green and nothing changed on screen.
2. The five `docs/` pages, as the Spec writes them.
3. `src/ui/look.ts`, `src/ui/tree.ts`, `src/ui/campaign-screen.ts`: an available plate pins, the pinned plate is edged, the save is written at each press. Leaves the campaign screen whole.
4. The goal's drawing out of `src/ui/tree.ts`, to where both screens reach it, the tree reading it unchanged.
5. `src/ui/text.ts`, `src/ui/chronicle-scene.ts` and a module for the pinned achievement beside it; `src/ui/ending-screen.ts` and `src/ui/launch-screen.ts` on the one reached entry. Leaves the chronicle screen showing the pinned achievement.
6. `e2e/pin.spec.ts` and what it needs of `e2e/chronicle-screen.ts`; `e2e/ending.spec.ts` on the entry's key.
7. The board line and this file deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The rules tests the line adds, on the fixture: a pin is held, moved by a second pin and taken off, and a technology learned or unknown is pinned by nothing; an ended chronicle that pays the pinned technology leaves nothing pinned; a campaign's pin writes as a save and reads back, and a save whose pin the campaign cannot hold reads with nothing pinned and the reason said.
- The proof, `npx playwright test e2e/pin.spec.ts`, each number read from the rules: on a campaign that has learned the first age's technology, a left click on an available plate pins it in the save and edges the plate, a second takes the pin off, and a click on another plate moves it; a chronicle of the second age opened beside a campaign pinning a technology it reads shows the name, the goal and the count over the need, and a card played on screen that moves the count moves the reading; one opened having reached it shows the check mark and no count; a chronicle of the first age beside that same pin shows nothing.
- CI's, on the push: `e2e/tree.spec.ts`, `e2e/campaign.spec.ts`, `e2e/launch.spec.ts`, `e2e/continue.spec.ts`, `e2e/ending.spec.ts`, `e2e/resume.spec.ts`, `e2e/manage-save.spec.ts`, `e2e/boot.spec.ts`.
