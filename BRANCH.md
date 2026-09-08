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

- **The claim's cost stands on the tile** — a tile the city may claim, selected in city mode, shows
  the culture threshold in its middle as a minus, the number and culture's glyph, and raises no
  note; a claim the city cannot pay for is refused over the tile with one sentence saying the
  claim is unaffordable, in the note a refused card raises, and the note over a tile says what a
  refused card's does. E2e on `e2e/city-mode.spec.ts`. Doc-impact: `docs/DESIGN.md`.
- **Population drags in city mode** — an inhabitant dragged from the tile it works to a tile the
  city holds and nobody works moves there in the one gesture; let go anywhere else it comes home
  and nothing changes. E2e on
  `e2e/city-mode.spec.ts`. Doc-impact: `docs/DESIGN.md`.
