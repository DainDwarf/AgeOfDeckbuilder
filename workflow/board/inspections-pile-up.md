# Inspections pile up

**Line:** **Inspections pile up** — a card named on a card shown large stands over it, on top of a stack the newest card of which alone answers its names, a new copy each time and none past twelve, and `docs/INTERFACE.md` says so in place of the row. Doc-impact: `docs/INTERFACE.md`.

**Spec:** `docs/INTERFACE.md`, _The presses_ and _What stands over what_. Three edits, each replacing the sentence it names and nothing around it:

1. The paragraph "A card named in a card's text stands in brackets", its sentence beginning "A right click on a name shows the named card large" becomes: "A right click on a name shows the named card large; while a card stands large, a right click on a name — on that card, or on a small card raised from it — stands the named card over it, on top of the stack, a new copy whether or not that card stands in it already. Each card beneath the newest peeks out by a thin band, up and to the left, and the stack stands centred as the one card does, so a deep one covers the resource bar; a stack holds twelve, and once twelve stand a right click on a name adds nothing, the rest on it still raising its small card. Only the newest card's names answer a press or a rest."
2. The back key's paragraph: "the thing shown large, the last of them where several stand" becomes "the thing shown large, the newest of them where several stand".
3. _What stands over what_, its last sentence: "Cards shown large stand where the one does, however many stand in the row." becomes "Cards shown large stand where the one does, however many stand in the stack."

No other page changes: `docs/CHRONICLE-SCREEN.md`'s sentences on the card shown large over the deal and the capstone windows stay true, the newest card being what a press beside it or the back key takes down. "Stack" is prose, as "row" was, and no glossary row: "pile" stays the draw and discard piles' word.

The one player-facing sentence the line foresees, in the stand-in content, `src/ui/text.ts`, for the spec to press a name that stands in a stack: the entry `rules.PH_Hunger` becomes `Empties the food stock. Names [card:PH_Hunger]`. The stand-in's texts are the suite's, and the card naming itself is what lets one spec walk the copy and the cap on the content the suite plays.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- In: the cards shown large laid as a stack — the newest whole, each earlier card offset up and left by one band, the stack's whole extent centred on the design space as the lone card is centred today, so one card stands exactly where it stands now; a name on the newest card standing a new copy of its card on top, the card already standing or not; the cap of twelve, past which a right click on a name adds nothing while the rest still raises the small card; only the newest card's names answering a rest or a right click; the back key, the right click on the scrim and a press beside taking the newest down, onto the card beneath or onto the window the first was taken off, as today.
- In: a right click on a name on a small card while a card stands large stacks the named card the same way. Today it shows the named card alone over the window, dropping what stood; the decided rule is one sentence: while a card stands large, a right click on any name stands the named card on top. A right click on a name on a small card while no card stands large is unchanged: the named card alone, over whatever window stands.
- In: a press on the band of a card beneath does nothing, as any press on a card shown large does but on its names — it reaches neither the scrim nor a name beneath.
- Out: what a right click on a small card itself does (the next board line); a name resolving to anything but a card (the line after); any change to the browse, the deal, the capstone or the aim window's own rows, whose cards are not the stack's.
- Corner cases decided: the stack keeps each card's own refusal drawing, as the row did; a copy is drawn as the card it copies. The cap counts cards in the stack, copies included. The band is 14 design units each way, a constant of the overlay; the docs say "a thin band" and no number. The mockup the design was chosen on: https://claude.ai/artifact/RN1TvAXcfyNTqKarauAUTp — the band preset, the stack centred.

**Traps:**

- `docs/PHASER.md`, _Input across scenes_, the entry on the topmost hit being the latest in the camera's render list: a card shown large is interactive over its whole rectangle, and its container is added to the layer after the cards beneath and their name zones, so the newest card's rectangle takes every press and every rest off the names it covers. The band a card beneath shows is 14 units, narrower than the card's own inner pad (27 at the shown-large width), so no name of a covered card lies in the band: nothing beneath the newest card can answer, by geometry, and nothing has to be disabled. The band does still hit the covered card's own rectangle, which answers nothing — that is the press on the band doing nothing.
- The same entry says an object not yet rendered counts as the bottom: the stack is redrawn whole at every change, and a press landing in the frame of the redraw reads the previous frame's list. Nothing to do; known.
- The specs find the newest card as `inspection` and the earlier ones as `inspection-0`, `inspection-1`, … earliest first, and read the card a face stands off its `card` data (`e2e/chronicle-screen.ts`, `cardOnFace`, `nameOnScreen`). Keep those names; `browse.spec.ts`, `capstone.spec.ts`, `deal.spec.ts`, `press.spec.ts`, `recall.spec.ts` read `inspection`.
- The small cards are taken down at every wipe (`small.down()` in the overlay), so a stack redrawn takes the chain down with it, as the row did.
- A card face is drawn about its bottom centre; the stack's centring is on the extent of the whole stack, `width + 14·(n−1)` by `height + 14·(n−1)`, the newest card at its bottom-right.

**Plan:**

1. `src/ui/text.ts`: the stand-in's `rules.PH_Hunger` entry as written above. Leaves the stand-in's coherence test passing on a text that names a card of its own catalogue.
2. `src/ui/overlay.ts`: the row becomes the stack — the layout, the copy on top, the cap, and the name on a small card stacking while an inspection stands. Leaves the app typechecking and the stack drawn and walked as the spec says.
3. `docs/INTERFACE.md`: the three edits. Leaves the design page saying what the code does.
4. `e2e/reference.spec.ts`: the one test extended past its row assertions — the named card standing above and left of the card it was named on, both up; a right click on the newest card's self-naming name standing a copy on top, `inspection-1` then standing the first Hunger; the stack reaching twelve and a thirteenth right click adding nothing; the back key taking the newest down one at a time. Leaves the proof spec green.
5. `workflow/BOARD.md`: the line deleted, and this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof is `npx playwright test e2e/reference.spec.ts`. CI proves on the push: `browse.spec.ts`, `capstone.spec.ts`, `deal.spec.ts`, `press.spec.ts`, `recall.spec.ts`, `hover.spec.ts`.
