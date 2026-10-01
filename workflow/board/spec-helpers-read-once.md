# The spec helpers read the page once

**Line:** **The spec helpers read the page once** — `e2e/` converts a camera's point to the page in one place and reads a named object in one place, both installed by `readNames` and asked by `readings` and by every single-name helper of `e2e/chronicle-screen.ts`; `e2e/browse.spec.ts`, `e2e/collection.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/deck-editing.spec.ts` and `e2e/launch.spec.ts` ask the page no question per stack, row or face and never re-ask a spot they just read; `readings`' docstring carries no reason; `DOGMAS.md` _Testing_ says a spec reads what stands together in one question; and no assertion is removed or loosened. Doc-impact: none.

**Spec:** `DOGMAS.md` is the spec, and the line adds one rule to it. No `docs/` page and no player-facing entry changes.

`DOGMAS.md`, _Testing_, a new line after "A spec rests before it presses or measures what just changed.", written out:

- "**A spec reads what stands together in one question to the page**, never one question per object. Why: a question waits out a drawn frame, and a frame slows as the screen fills."

The rules the line applies, already standing: _Code_, "Single source of truth for facts; repetition for shape" for the conversion and the reader; _Code_, "Comments are for traps only" for the docstring; _Testing_, "A test is never weakened to make it pass" for every assertion the line moves onto a batch.

**Doc-impact:** none — the line lands in `e2e/` and in `DOGMAS.md`; no design page speaks of how a spec reads the page beyond `docs/PHASER.md` _Under a Playwright spec_, whose entries stay true.

**Scope:**

In, the helpers (`e2e/chronicle-screen.ts`):

- One in-page reader of a named object, installed by `readNames` beside `window.named` and `window.counted`. `readings` asks it for a list of names in one question; `standing`, `counted`, `textOf`, `stackDimmed`, `cardOnFace` and `placeOf` ask it for one name. The reading of a name's standing, count, text, dimmed, card and place stands in that reader and nowhere else in `e2e/`.
- One in-page conversion of a point in a camera's world to the page, installed the same way. `onScreen`, `nameOnScreen`, `kindLabelOnScreen` and the bounds reading `e2e/browse.spec.ts` holds as `boundsOnScreen` all go through it: `getWorldPoint` stands at one site in `e2e/`.
- The batch answers what the five specs' loops ask per object today, so each loop becomes one question: beside what a `Reading` holds today, whether a card face is ringed (`ringed`), whether it draws a name (`drawsName`), where an object, a face's name and a face's kind label stand on the page (`onScreen`, `nameOnScreen`, `kindLabelOnScreen`), and an object's bounds across in design units (`acrossOf` in `e2e/civilization-mode.spec.ts`). A reading a batch lacks is added to the reader, never asked beside it.
- `readings`' docstring loses its last sentence, "Each question to the page waits out the frame being drawn."

In, the five specs, every per-object loop and re-ask found:

- `e2e/browse.spec.ts`: the per-stack loop of the right-click test (card, copies, ring, place, four questions a stack); the per-face `drawsName` loop of the small-card test; `nearest`, which asks one question per face, in its three uses (the pan-key test once, the small-card test twice), and the spot re-asked after each of the three; `boundsOnScreen` asked twice in a row in the Control-wheel test.
- `e2e/collection.spec.ts`, its first test: the count per card of the catalogue, the four questions per stack, the three per civilization's pile.
- `e2e/civilization-mode.spec.ts`: its first test whole (the three modes not standing, the two sections' counts and places, the city card, the three questions per stack, `readOrder` and the three loops of `placeOf` after it); the per-row loop of the Collection » test; the three `acrossOf` per stack of the centred-reading test.
- `e2e/deck-editing.spec.ts`: `namingCard`, one question per stack until one draws a name; the ten single questions its second test asks before its batch, which join the batch.
- `e2e/launch.spec.ts`: the per-stack loop of the browse test.

What stays a single question: a poll, which waits for a change; a read with a gesture, a `rested` or a poll between it and the next, each batch reading one moment; a one-off read of one object. The single-name helpers stay for those, and one of them that nothing asks any more is deleted.

Corner cases, decided:

- Every `expect` of today stands, on the same value and the same oracle, read from a batch instead of from its own question. The order of assertions may follow the batch.
- A single-name helper answers as it does today for a name nothing stands under and on a page `readNames` never reached: `standing` false, `textOf`, `stackDimmed` and `cardOnFace` nothing, `placeOf`, `counted`, `ringed`, `onScreen`, `nameOnScreen` and `kindLabelOnScreen` their throw.
- The small-card test's second `nearest` runs after a scroll and a pointer move: it is its own batch, never merged with the first.
- `nearest` keeps its tie: the first face in the order handed.

Out, each found and left standing: the per-object questions on small fixed sets in `e2e/camps.spec.ts`, `e2e/settle.spec.ts`, `e2e/broken-motion.spec.ts`, `e2e/ending.spec.ts`, `e2e/controls.spec.ts`, `e2e/deal.spec.ts` and `e2e/yields.spec.ts`; the open-ended line loops of `e2e/continue.spec.ts` and `e2e/tree.spec.ts`; `tileOnScreen`'s three questions, `glyphs`' one per resource and `pileTop`'s two; `spanOf` and the inline `standing` of `e2e/tree.spec.ts`, the inline bounds of `e2e/map.spec.ts` and of `e2e/console.spec.ts`; the helpers that read the texts inside a named container; `pileSelected` in `e2e/launch.spec.ts` and `optionSelected` in `e2e/menu.spec.ts`; `HAND` and `PILES` repeated across specs.

What the reconcile chose:

- `readings` and the six single-name helpers read the same six things in two places: they become one, the in-page reader.
- `onScreen`, `nameOnScreen`, `kindLabelOnScreen` and `boundsOnScreen` each carry the camera conversion: they become one conversion. The difference that is meant is the point converted — a bounds' centre, a name's spot, a label's middle, a bounds' corners — and it is the parameter. `mapFrame` stays apart: it reads a camera's viewport, in backing-store pixels, and converts no world point.
- `acrossOf` goes through the reader's batch and leaves `e2e/civilization-mode.spec.ts`.
- `readOrder` in `e2e/civilization-mode.spec.ts` and the same sort written inline in `e2e/collection.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/browse.spec.ts` and `e2e/launch.spec.ts` become one helper in `e2e/chronicle-screen.ts`, over places already read: it asks the page nothing.
- `namingCard` and the small-card test's `drawsName` loop both ask which faces draw a name: both read it off a batch.
- `nearest` takes spots already read and answers the face with its spot, so nothing is re-asked.

**Traps:**

- `docs/PHASER.md` _Under a Playwright spec_: "A camera takes its zoom and scroll at render", "Screen coordinates convert through the canvas's client rect", "A named object is found by walking every running scene".
- `readNames` installs through `page.addInitScript`: its function is serialised and runs in the page at every load, so it closes over nothing of the module and imports nothing; what the reader and the conversion need stands inside it, and their types join the `declare global` block above it.
- Not every named object carries every reading. A Layer mixes in neither a transform nor bounds (`node_modules/phaser/src/gameobjects/layer/Layer.js:83-92`) and several are named: the map's groups in `src/ui/map.ts`, the strata in `src/ui/overlay-scene.ts`. A Graphics carries a transform and no `getBounds` (`node_modules/phaser/src/gameobjects/graphics/Graphics.js:89-97`). Today `readings` calls `getWorldTransformMatrix` on whatever is named and is only ever handed containers and texts; once `standing`, `counted` and `textOf` go through the reader, every named object of every spec passes through it.
- A reading that a single-name helper throws for throws when it is read off the batch, never while the page is asked: `readings` is handed names nothing stands under, on purpose, as `place` shows today.
- `placeOf` answers in design units, `onScreen` on the page. They are two readings and stay two.
- `e2e/` docstrings say what a helper answers, in a line or two; none says why. A hook flags a comment block longer than three lines on an edit under `e2e/`.

**Plan:**

1. `e2e/chronicle-screen.ts`: the reader and the conversion stand in what `readNames` installs; `readings` and the single-name helpers ask them and hold no in-page reading of their own; the reader answers the readings the Scope lists; the order helper stands; `readings`' docstring is cut. No spec changes yet, and every spec still passes through the single-name helpers.
2. `e2e/deck-editing.spec.ts`: `namingCard` and the second test read off a batch.
3. `e2e/browse.spec.ts`: `boundsOnScreen` holds no conversion, `nearest` takes spots read, the three tests' loops are batches.
4. `e2e/collection.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/launch.spec.ts`: their loops are batches, `acrossOf` and `readOrder` are gone from the spec.
5. `DOGMAS.md`: the _Testing_ line, as the Spec writes it.

**Verify:** `npm run check`, `npm run lint`; `npm test` is untouched by the line and runs with them. The proof spec is `e2e/browse.spec.ts`: it walks the conversion through all four of its users and the most batches. CI proves on the push: `e2e/deck-editing.spec.ts`, `e2e/collection.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/launch.spec.ts`, and every other spec, each of which reads the page through the helpers the line reshapes. The report states, for each of the five specs, that no `expect` was dropped or reworded, and names any that was reordered.
