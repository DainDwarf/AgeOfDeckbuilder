# Branch: unified-presses

The board of this branch alone. It points at the design the branch exists to make true, then holds
the lines that make it true, in order; **priority is order, completion is deletion**, exactly as
[`BOARD.md`](BOARD.md). Each line ships as a board line does — `/ship` names it from this file —
with the same trinity and the same review. The branch merges into `main` when no line is left,
and this file goes with the merge. Nothing durable cites it.

## The design

The design this branch exists to make true is written in [`docs/DESIGN.md`](docs/DESIGN.md), under
Interface → *The presses* and Systems → *The chronicle screen*. The lines below make the code agree
with it.

## Lines

- **The right click never selects** — on a tile it inspects without selecting, and pressed again
  on the same tile steps on; off the map it drops the inspection and leaves the selection standing;
  the inspection key moves the inspection to the selection when they differ. E2e on
  `e2e/inspect.spec.ts` and `e2e/press.spec.ts`. Doc-impact: none.
- **The right click inspects while a card is being aimed** — it no longer lets the card go: on a
  tile it inspects the tile, on a card it shows the card large, off the map it drops the
  inspection, and the card stays selected through all three. E2e on `e2e/building.spec.ts`.
  Doc-impact: none.
- **The aim window follows the presses** — the window opens on the second click or the drag, not
  on selection; a press beside its cards or the back key closes it and leaves the card selected in
  the hand; a right click on one of its cards shows it large; the Cancel button goes. E2e on
  `e2e/recall.spec.ts`. Doc-impact: none.
- **The browse selects** — a left click on a browsed card selects it, ringed; a right click or the
  inspection key shows it large; a press beside the cards drops the selection, and with none
  standing closes the browse; the back key walks the same steps; the selection dies with the
  window. E2e on `e2e/browse.spec.ts`. Doc-impact: none.
