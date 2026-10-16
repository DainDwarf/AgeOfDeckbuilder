# The collection's scrollbar

**Line:** **The collection's scrollbar** — every panel holding more than its frame wears a scrollbar down its right edge, a track the frame's height and on it a bar as long as the room's share of what the panel holds, standing as far down the track as the panel is scrolled, answering no press of its own; a panel the room holds whole wears none; `e2e/collection.spec.ts` proves it on the collection panel. Doc-impact: `docs/META-SCREENS.md`.

**Spec:** `docs/META-SCREENS.md` _The collection screen_, the paragraph beginning "A panel holding more than its room shows scrolls". After its first sentence, add: "Such a panel wears a scrollbar down its right edge, inside the frame: a track as tall as the panel, and on it a bar as long as the share of what the panel holds that the room shows, standing as far down the track as the panel is scrolled; a panel the room holds whole wears none. The bar answers no press of its own: a press on it is a press on the panel." Nothing else on the page changes: the launch screen's browse paragraph and `docs/INTERFACE.md` _What stands over what_ already say a browse scrolls as a panel of the collection screen does, which carries the bar to every browse. No player-facing text entry: the bar reads no word.

**Doc-impact:** `docs/META-SCREENS.md`.

**Scope:**

- In: every panel the panel module makes — the collection screen's panels in its three modes, the civilization's browse on the launch and collection screens, the chronicle screen's pile browses, and the windows laid as a panel on the overlay, which today hold less than their frame and so wear none. One mechanism in the panel; no panel is flagged in or out.
- Out: the technology tree, which moves left and right and is no panel; a horizontal bar of any kind.
- The bar's measures, settled on the mockup over the real screen: 8 units wide, its right edge 4 units inside the frame's right edge, both ends rounded at half its width, the track running from the frame's top to the frame's bottom. The thumb's length is the frame's height times the frame's height over what the panel holds, the holding measured as the scroll's reach is (the frame's height plus the reach); its top is the frame's top plus the offset's share of the reach times the room the thumb leaves on the track. No minimum length: today's thumbs are 273 units in the deck editing mode and 412 in the collection mode, and a collection of 25 lines would still give 64. Whole units: the thumb's length and top are rounded.
- The bar reads only. It is not interactive and takes no cursor; a press, a drag and the wheel on it reach the panel's frame zone beneath, as they do anywhere on the panel.
- Two entries in the look, named for what they paint, each borrowing a value the look already holds: the scrollbar's track borrows the panels' divide's value, `0x2c3340`; the scrollbar's thumb borrows the deck's grey counts' value, `0x9aa1a9`. No new value; whether either gets a value of its own waits on the look pass.
- The bar follows every move of the scroll — the wheel, a key, a drag, a fling's every frame, a panel laid again at the offset it stood at — through the scroll's one `moved` door, and goes down with its panel. A panel laid again after an edit, a card added or a copy bought, is a new panel with a new bar: a panel that gains or loses its overflow across an edit gains or loses its bar then.
- Reconcile: nothing in the tree reads a share as a track and a thumb; the rounded pills the browse's badge and the piles' count draw are a resemblance and stay apart. The bar reads the standing scroll's offset and reach as they are and computes nothing of its own about the panel's holding: the spec's `overflow` reading and the bar read one reach.
- Clearance, measured on the real screen at 1280 by 720 with the Stone Age's technologies learned: the bar's column, x 868 to 876 in the deck editing mode's collection panel, stands clear of the stacks, whose unders reach 807; collection mode 1108 to 1116 against 1071; the civilization's panel 1268 to 1276 against rows ending at 1256; the civilization mode's panel 1268 against stacks ending at 1217; the civilizations panel 1268 against the pile's 1258; the civilization's browse 1244 to 1252 against the badge's 1237. The chronicle screen's pile browses are laid by the same browser on the same frame as the civilization's browse.

**Traps:**

- The panel's root is the thing that scrolls and is cut at the frame by a mask filter; the bar stands outside it, on the panel's stratum, laid by its own geometry inside the frame, and never joins the root. It is added to the layer after the root, so it draws over the cards: a Layer draws by depth first and by add order among equal depths (`docs/PHASER.md` _Scenes and stacking_).
- A hit test skips an object that is not interactive (`docs/PHASER.md` _The pointer's readings_), so the bar left non-interactive leaves the frame zone hearing every press and the wheel; making it interactive would take the wheel from the zone (`docs/PHASER.md`, an object's wheel reaches the topmost interactive object alone).
- A Graphics object has no bounds component (`node_modules/phaser/src/gameobjects/graphics/Graphics.js:89-97`), so the e2e harness's `boundsOnScreen` throws on one and its `place` reads the object's own transform. The proof spec reads where the thumb stands by `place`, so the thumb's object stands at the thumb's top-left corner with its shape drawn from its own origin, and follows the scroll by its position; the thumb's length is not read on screen, the Vitest test proves it.
- The panel's `moved` callback runs from inside Phaser's dispatch for the wheel and the drag; what it does to the bar is a position write, never a hit test (`docs/PHASER.md`, a hit test inside an input handler refills the list being walked).
- `panel.ts`'s comment on the stencil is a trap comment and stays; the bar needs none of its own.
- The scroll's fling reads the scene's frame clock and runs on CI never (`docs/PHASER.md` _The pointer's readings_, last entry); the proof spec moves the panel by the wheel alone and asserts no fling.
- The rounded rectangle's precedent is the browse's badge (`fillRoundedRect` in `src/ui/browse.ts`), drawn from a top-left corner; a `Phaser.GameObjects.Rectangle` has square corners and is not what was chosen.
- The thumb computation is a pure function on the UI side and gets its Vitest beside the scroll's (`DOGMAS.md` _Testing_, "Rules tests are Vitest, in Node").

**Plan:**

1. `src/ui/look.ts`: the two entries, the track and the thumb, borrowing the values named above.
2. `src/ui/scroll.ts` (or beside it, the implementer's call): the pure computation of the thumb from the frame's height, what the panel holds and the offset — length and top, whole units, none where the panel holds no more than its frame; its Vitest in `src/ui/scroll.test.ts`: no thumb where the room holds the panel whole; the thumb's length is the frame's share of the holding; its top is the frame's top at the first line, its bottom the frame's bottom at the last line, and between the two it stands at the offset's share.
3. `src/ui/panel.ts`: the track and the thumb drawn on the stratum's layer for a panel whose reach is above zero, named `<name>-track` and `<name>-thumb`, following the scroll's `moved`, destroyed in `down()`. Every panel gets it; no caller changes.
4. `docs/META-SCREENS.md`: the sentences above.
5. `e2e/collection.spec.ts`: the scrolling test on the Stone Age campaign extended — the collection panel's thumb stands and the civilizations panel's does not; the thumb's `place.y` equals the collection frame's top at offset 0; after the wheel to the reach it stands lower; after the wheel back to 0 it stands at the frame's top again. Read in one `readings` call per state with what the test already reads.
6. The board line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/collection.spec.ts`.
- The `visual-check` skill on the running app: the collection screen in its three modes on a campaign with the Stone Age's technologies learned (`npm run forge` writes one; `--list stone` prints the ids), the civilization's browse from the collection screen, and a chronicle's discard pile browse holding more than its frame — the bar inside the frame, clear of every card, over nothing it should not be over, the thumb at the top and at the end.
- CI's, listed at the hand-back and never run here: `e2e/browse.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/launch.spec.ts`, `e2e/controls.spec.ts`, `e2e/press.spec.ts`, `e2e/pointer-sweep.spec.ts`, `e2e/hover.spec.ts`, `e2e/hand-aim.spec.ts`, `e2e/deal.spec.ts`, `e2e/capstone.spec.ts`.
