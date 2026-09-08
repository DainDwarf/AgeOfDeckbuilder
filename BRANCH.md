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

- **A card being aimed says so** — the design settles how a card being aimed reads on the card
  itself, apart from a card selected and waiting to be played, and the face draws it, so the map
  lighting nothing is no longer the only tell; an e2e on `e2e/press.spec.ts` tells the two
  apart by that mark. Doc-impact: `docs/DESIGN.md`.
- **The browse selects** — a left click on a browsed card selects it, ringed; a right click or the
  inspection key shows it large; a press beside the cards drops the selection, and with none
  standing closes the browse; the back key walks the same steps; the selection dies with the
  window. E2e on `e2e/browse.spec.ts`. Doc-impact: none.
- **City mode selects, then acts** — a left click in city mode selects the tile as anywhere else,
  lighting no unit and moving none; a second click on the selection is the city's act on it: a
  claim, after which the tile stays selected, or an inhabitant assigned and unassigned by turns,
  the city's own tile among the tiles it works; a claimable tile selected shows its culture cost
  over it in the refusal note before anything is paid, and a refused act adds its reason there; a
  press beside the tiles drops the selection and the inspection with it. E2e on
  `e2e/city-mode.spec.ts`. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
- **Population drags in city mode** — an inhabitant dragged from the tile it works to a tile the
  city holds and nobody works moves there in the one gesture; let go anywhere else it comes home
  and nothing changes. E2e on
  `e2e/city-mode.spec.ts`. Doc-impact: `docs/DESIGN.md`.
