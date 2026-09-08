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

- **The aim window names its card** — the aim window's title says which card is being aimed at the
  discard pile and what it is played at, in place of the pile's count title the browse uses; the
  verb is settled at the pitch against the glossary. An e2e on `e2e/recall.spec.ts` reads the title.
  Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md` if the verb is new.
- **A right press beside the card shown large drops it** — a right click on the scrim while a card
  stands large takes the card down as the back key would, leaving what it stood over — the browse
  with its selection, the aim window, the card selected in the hand — as it stands; a right click
  on the scrim with nothing shown large does nothing. E2e on `e2e/press.spec.ts`. Doc-impact: none.
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
