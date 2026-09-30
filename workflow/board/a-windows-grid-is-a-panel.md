# A window's grid is a panel

**Line:** A window's grid is a panel — the aim, deal and capstone windows lay their cards through the panel a browse is laid through, keeping their layout to the pixel, the deal its ring and its refusal note; the overlay holds no grid of its own, and its gestures go to the one panel standing. Doc-impact: none.

**Spec:** `docs/INTERFACE.md`, _The presses_ and _What stands over what_, and `docs/META-SCREENS.md`, _The launch screen_, as they stand: the panel and the windows already behave as the pages say, and the one visible change brings the windows to the page — "The pointer is a hand over a thing that answers a left click or a rest, and an arrow beside the things and over the map and a scrim." No sentence changes. No player-facing text.

**Doc-impact:** none — the pages describe the behaviour that stands; the code follows them.

**Scope:**

- In: the three windows lay their cards through the panel a browse is laid through: the frame and its mask, the drag and its fling, the wheel and the pan keys through the scrim's door, the per-frame re-read of what the pointer is on, a name and a kind label answering the rest, the right click on a name or on a card, the left click on a card, and either press beside the cards doing what the window's back does.
- In: the windows keep their layout to the pixel: their card width, their gaps, the cards centred in the frame while they fit, the lore just over the first row, the names `<window>-card-<n>` with their `at` and `card` data, the root named after the window with its `overflow` data, the frame named `<window>-frame`.
- In: the deal keeps its ring and its refusal note, the note placed over the card as the panel stands scrolled; the capstone its close on a left click; the aim its choice.
- In: the pointer between a window's cards is the arrow, as it is beside a browse's stacks. Today the grid makes it the hand over its whole frame, against the interface page.
- In: a card rising large stops a fling running under it, on the browse as on a window. Today a window's does and the browse's does not; the pages say a card shown large holds it still.
- Out: the ending screen, which scrolls nothing; the ring's look; any text.

**Traps:**

- The grid (`src/ui/overlay.ts:367-467`), its pointer readers (`:328-361`), its update step (`:833-843`) and `cardAt` (`:946-953`) are a panel written by hand; `createPanel` (`src/ui/panel.ts:191-340`) with `Held` (`:34-39`) and `Answers` (`src/ui/stack.ts:259-266`, `answersOf` `:272-295`) does each of those things. A `Filled` (`panel.ts:147-151`) is any parts, held boxes and a foot; `linesOf` (`src/ui/collection-stack.ts:71-97`) is one way to fill it and not the only one — its spacing is the stacks' (`UNDER_REACH` and `STACKS_APART`), not the grid's `GRID_GAP`, and it centres nothing vertically — so the windows lay their own cells at their own spacing.
- A held box is in the panel's unscrolled space and `heldAt` (`src/ui/scroll.ts:144-153`) carries the pointer up by the offset; a card face is positioned about its bottom centre, so a card's box is its top left corner, not its anchor.
- The refusal note is placed from the card's place under the scroll (`overlay.ts:518-521`), which the panel's `offset` gives.
- The grid's `rise` (`overlay.ts:228-232`) stands the scroll where it is, stopping a fling, as a card rises large; the panel exposes no way to stop a fling, and the fling is the scroll's own (`src/ui/scroll.ts:116-122`). The panel gains that one door for the scope's fling stop to hold on both; a shape that resists is reported.
- `ring` (`overlay.ts:470-473`) re-selects every drawn face through the card face's `select`; the cells keep their faces for it.
- The hand over the grid's whole frame comes from `answersPress(frame)` with no `where` (`overlay.ts:388`); the panel's zone answers the hand only over a thing that presses or rests (`panel.ts:236-240`).
- The specs read a window's root by its name (`standing`, `titleOf`, `loreOf` in `e2e/chronicle-screen.ts`), the deal's cards as `deal-card-<n>` and their ring through `ringed` (`e2e/deal.spec.ts:79-113`), the capstone's card as `capstone-card-0` (`e2e/chronicle-screen.ts:161-163`); every name stays.
- The wipe (`overlay.ts:261-273`) destroys what the scrim carries and takes the browse's panel down; a window's panel goes the same way, and after this line there is one panel standing or none, so the gestures' routing loses its grid-or-browse branch.
- `docs/PHASER.md` for anything else Phaser: read, never remembered.

**Plan:**

1. `src/ui/overlay.ts`: the three windows laid through `createPanel`, their layout kept as cells of their own; the grid, its readers, its update step and `cardAt` gone; the scrim's gestures handed to the one panel standing. `src/ui/panel.ts`: what the windows need of it and the browse lacked, the fling held as a card rises large. Leaves standing: the three windows as they stood, the arrow between their cards, the overlay about a hundred and fifty lines shorter.
2. `e2e/deal.spec.ts`: a step in the existing deal test — between two cards the pointer is the arrow, over a card the hand. Leaves standing: the proof.
3. `workflow/BOARD.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/deal.spec.ts`. CI's on the push: `camps.spec.ts`, `capstone.spec.ts`, `landing.spec.ts`, `boot.spec.ts`, `continue.spec.ts`, `resume.spec.ts`, `ending.spec.ts`, `victory.spec.ts`, `refuse.spec.ts`, `press.spec.ts`, `browse.spec.ts`, `menu.spec.ts`, `hover.spec.ts`, `pointer-sweep.spec.ts`, `inspect.spec.ts`, `reference.spec.ts`.
