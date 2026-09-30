# The specs read a screen in one question

**Line:** The specs read a screen in one question — `e2e/deck-editing.spec.ts` reads a whole deck editing screen in one question to the page, each of its per-card walks with it, so that on the branch's padded content its tests at `:307` and `:351` each pass locally in under 15 s; the pan-keys test of `e2e/browse.spec.ts` right-clicks the card standing nearest the frame's middle after its tap; and CI's run on the push is green. Doc-impact: none.

**Spec:** none — the specs change how they read the screen, not what they assert. No player-facing text, no `docs/` sentence.

**Doc-impact:** none: no design page states how a spec reads the screen.

**Measured (2026-10-01, local, CPU at 18%):**

|  | Before the padding (5a4d5f5) | Padded (c3f0f0f) |
| --- | --- | --- |
| deck-editing `:307` | 10.9 s | 38.5 s |
| deck-editing `:351` | 11.8 s | 30.9 s |
| Stacks in the collection | 8 | 28 |
| Objects on the running scenes | 232 | 572 |
| One frame, deck editing mode | 32 ms | 46 ms |
| `page.evaluate(() => 1)` | 29 ms | 41 ms |
| `window.named` inside the page | 0.01 ms | 0.02 ms |

Playwright's Chromium draws WebGL on SwiftShader, on the CPU: the page is busy drawing every frame, and each question to it waits behind the frame being drawn, so a question costs a frame. `readsAs` (`deck-editing.spec.ts:87-118`) asks ~3 questions per row and 2–3 per stack, ~40 unpadded and ~140 padded, and `:307` runs it 5–6 times: questions × frame ≈ the time measured. Questions grow with the cards and frames with the objects, so the time grows with their product; the Stone Age's cards reach it on real content.

**Scope:**

- In: `readsAs` reads every name it checks — the two counts, `deck-empty`, `deck-section-cards`'s place, each row's count, copies text and place, each stack's copies text and dimming — in one `page.evaluate`, and checks the answers in Node, asserting exactly what it asserts today. The per-card walks of the opening test (`:182-192`, `:202-209`) and the return-to-collection test (`:264-268`) read the same way.
- In: the reader is one helper handed a list of names and answering, per name, what the helpers it replaces answer (count, text, place, dimming, card on face), so a later spec with a per-card walk reuses it. Where it lives is the implementer's; `e2e/chronicle-screen.ts` beside `textOf` and `counted` is the obvious home. Its answers must be what `textOf`, `counted`, `placeOf`, `stackDimmed` and `cardOnFace` answer for the same name, read the same way.
- In: `browse.spec.ts`'s pan-keys test (`:233-235`): after the tap, the right click goes to the browse card whose spot stands nearest the frame's middle (the file's `nearest` helper, `:58-70`), not `browse-card-0`.
- Out: every other spec, any change under `src/`, the Playwright config, the test timeout, and the padding. No assertion is dropped or loosened.

**Traps:**

- The browse failure on CI (runs 36779306930, 36780872807, `browse.spec.ts:235` at 8c105a1): a held pan key moves a browse by `PAN_SPEED × delta` (`src/ui/scroll.ts:99`), `delta` being the frame's, so a tap scrolls one or two frames' worth. On a slow runner past Phaser's first 120 frames that is far enough to scroll the top row's middle out of the frame, and the right click lands on the scrim, which backs the browse out (the implementer's local run saw the browse closed there). Locally on an idle machine the test passes (15.7 s).
- A press or a move is never batched: only readings. `pressed`, `saved`, `rested` and every gesture stay one call each, in order.
- `window.named` and `window.counted` (`e2e/chronicle-screen.ts:168-205`) are installed by `readNames`; the batched reader calls them inside its one `page.evaluate`, and a name that stands nowhere answers what the single helper answers for it (`undefined`, 0), never a throw where the single helper does not throw.
- `placeOf` answers a design-space place; the rows' order and the settle/cards split compare those, so the batched answer must be the same kind of place, not a page point.
- Comments are for traps only.

**Plan:**

1. The batched reader, beside the single-name helpers it mirrors.
2. `e2e/deck-editing.spec.ts`: `readsAs` and the three per-card walks read through it; every assertion kept.
3. `e2e/browse.spec.ts`: the pan-keys test right-clicks the card nearest the frame's middle after the tap.
4. `workflow/BRANCH.md`: the line deleted, this file with it.

**Verify:** `npm run fmt`, `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/deck-editing.spec.ts`, with `:307` and `:351` each under 15 s in its report (`--reporter=list` prints each duration). CI's on the push: `browse.spec.ts` (its pan-keys test fails only on CI's runner), `collection.spec.ts`, `civilization-mode.spec.ts` and every spec importing `e2e/chronicle-screen.ts`.
