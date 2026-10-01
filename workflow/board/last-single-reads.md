# The last single reads join the reader

**Line:** **The last single reads join the reader** — the in-page reader `readNames` installs answers whether a name is shown, the reference its face carries, the colour it is filled and the reference of each name a face draws, and `shows`, `referenceOnFace`, `namedOn`, `fillOf` and `endTurnFill` of `e2e/chronicle-screen.ts` and `firstNamed` of `e2e/launch.spec.ts` hold no in-page reading of their own; in `e2e/browse.spec.ts`, `e2e/collection.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/deck-editing.spec.ts` and `e2e/launch.spec.ts`, reads of what the reader answers that stand at one moment — no gesture, `rested` or poll between them — are one question; and no assertion is removed or loosened. Doc-impact: none.

**Spec:** `DOGMAS.md` _Testing_, "A spec reads what stands together in one question to the page, never one question per object.", and _Code_, "Single source of truth for facts; repetition for shape". No `docs/` page, no `DOGMAS.md` line and no player-facing entry changes.

**Doc-impact:** none — the line lands in `e2e/` alone; `docs/PHASER.md` _Under a Playwright spec_ stays true.

**Scope:**

In, the reader (`e2e/chronicle-screen.ts`):

- Four readings join it: whether the object is shown (its `visible`), the reference its face carries (its `reference` data), the colour it is filled (its `fillColor`), and the reference each name the face draws carries, beside that name's spot.
- `shows`, `referenceOnFace`, `fillOf` and `endTurnFill` read through it; `namedOn` asks one question for the card and the reference both; `firstNamed` in `e2e/launch.spec.ts` reads through it. None of them reads the page on its own.

In, the five specs: every run of reads the reader answers, at one moment, is one batch. Found today:

- `e2e/civilization-mode.spec.ts`: the remove/add test — the copies, the section count and the count after each press of the loop; the dimmed and the two fills after the loop; the copies, count, dimmed and fill after the add; the `onScreen` handed to `cursorAt` read from the batch of its moment. The buy test — the influence, price and fill at opening, the three texts after the buy, the fill and spot of the unaffordable button. The deck-editing test's `standing` and `textOf` before its batch join it.
- `e2e/browse.spec.ts`: `standing`, `nameOnScreen` and `onScreen` after the quarter wheel; `kindLabelOnScreen` and `onScreen` after the second.
- `e2e/collection.spec.ts`: the two `standing` before the first test's batch join it; the three texts after the buy; the runs of `cardOnFace`/`standing` after a press.
- `e2e/deck-editing.spec.ts` and `e2e/launch.spec.ts`: any such run found.

What stays a single question: a poll; a read with a gesture, a `rested` or a poll between it and the next; a lone read; a read the reader does not answer (`titleOf`, `tooltipUp`, `tooltipText`, `cursorAt`, `cursorOverCanvas`, `heldSave`, `offsetOf`, `scrolled`) — it stays its own question beside the batch of its moment, never added to the reader by this line.

Corner cases, decided:

- Every `expect` of today stands, on the same value and the same oracle. The order of assertions may follow the batch.
- A helper answers as it does today for a name nothing stands under: `shows` and `fillOf` their throw, `endTurnFill` its throw, `referenceOnFace` and `namedOn` nothing, `firstNamed` nothing; `firstNamed` answers nothing for a face that draws no name.
- `fillOf` on an object that carries no fill answers what it answers today.

Out, each found and left standing: the single reads of the other specs, `shows` in `e2e/settle.spec.ts`, `e2e/yields.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/console.spec.ts`, `e2e/boot.spec.ts`, `e2e/fog.spec.ts`, `e2e/reference.spec.ts` among them (they go through the reader, one name at a time, unchanged in the spec); `pileSelected` in `e2e/launch.spec.ts` and `optionSelected` in `e2e/menu.spec.ts`; `wellFill`, which reads a parent's visibility; the helpers that read inside a named container; the in-spec readers of `e2e/campaign.spec.ts`, `e2e/console.spec.ts`, `e2e/ending.spec.ts`, `e2e/map.spec.ts` and `e2e/tree.spec.ts`.

What the reconcile chose:

- `endTurnFill` and `fillOf` read the same thing: `endTurnFill` goes through the reader's fill.
- `firstNamed` and the reader's names read the same data: the reader's names carry the reference.
- `referenceOnFace` and the reader's data reading: one reading, through the reader, which reads data without giving an object a data manager.
- `pileSelected` and `optionSelected` stay apart: one-off reads the previous line left standing.

**Traps:**

- `readNames` installs through `page.addInitScript`: the function is serialised and closes over nothing of the module; what the readings need stands inside it, and their types beside `PageReading`.
- Every reading is computed for every name a helper asks; a reading the object cannot give is answered as a complaint and throws only when read (`owed`). A Layer carries no bounds, a Graphics no `getBounds`, a Text no `fillColor`, and every named object passes through every reading.
- `getData` creates a data manager on an object that holds none (`node_modules/phaser/src/gameobjects/GameObject.js:519-526`); the reader's `data` avoids it, and `referenceOnFace` today does not.
- `docs/PHASER.md` _Under a Playwright spec_: "A named object is found by walking every running scene".
- `e2e/` docstrings say what a helper answers, in a line or two; a hook flags a comment block longer than three lines under `e2e/`.

**Plan:**

1. `e2e/chronicle-screen.ts`: the four readings in the reader; the helpers read through it.
2. `e2e/launch.spec.ts`: `firstNamed` reads through the reader; its runs are batches.
3. `e2e/civilization-mode.spec.ts`, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/deck-editing.spec.ts`: their runs are batches.

**Verify:** `npm run fmt`, `npm run check`, `npm run lint`, `npm test`. The proof spec is `e2e/civilization-mode.spec.ts`: it walks the fill and the most runs. CI proves on the push: `e2e/browse.spec.ts`, `e2e/collection.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/launch.spec.ts`, `e2e/reference.spec.ts`, `e2e/settle.spec.ts`, `e2e/yields.spec.ts`, and every other spec, each reading through the reshaped helpers. The report states, for each of the five specs, that no `expect` was dropped or reworded, and names any that was reordered.
