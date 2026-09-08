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

- **Population drags in city mode** — an inhabitant dragged from the tile it works to a tile the
  city holds and nobody works moves there in the one gesture; let go anywhere else it comes home
  and nothing changes. E2e on
  `e2e/city-mode.spec.ts`. Doc-impact: `docs/DESIGN.md`.
