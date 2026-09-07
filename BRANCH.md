# Branch: unified-presses

The board of this branch alone. It holds the design the branch exists to make true, then the
lines that make it true, in order; **priority is order, completion is deletion**, exactly as
[`BOARD.md`](BOARD.md). Each line ships as a board line does — `/ship` names it from this file —
with the same trinity and the same review. The branch merges into `main` when no line is left,
and this file goes with the merge. Nothing durable cites it.

## The design

The chronicle screen has three presses: the left click selects, the right click inspects, the
inspection key inspects the selection.

**The selection is one thing, a tile or a card, and the left click makes it.** On a tile it
selects the tile. On a card in the hand it selects the card, whether or not the city can pay for
it. On a card in a browse it selects that card. Off the map, or beside the cards of a browse, it
drops the selection. Making a new selection drops the old one, whatever it was. A selected card
that aims at a tile is **being aimed** from the moment it is selected: the map is already there,
and lights the tiles its aim admits. A card that aims at the discard pile is being aimed only
once its window stands, and the window waits for the second click: a window would stand over the
hand, and a card is inspected from the hand before it is played.

**A left click on the selection plays it.** A selected tile clicked again stays selected, except
the city's own tile: clicked again it enters city mode, as the city key does, and the selection
goes as city mode always takes it. A selected card clicked again is played where it stands: a card that aims at nothing is played, and
refused over the card with its reason when the city cannot pay; a card that aims at a tile lands
nowhere, so it stays selected; a card that aims at the discard pile raises the pile's window, and
is being aimed from then. This is the design's "a card aimed at nothing lands nowhere".

**A card being aimed filters every left click by its target kind.** A press on a thing of that
kind is the play attempted there, and the rules answer it, refusing over the tile with the reason
and leaving the card selected. A press on anything else lets the card go and then lands as it
would on a clean screen, in the one press: a tile is selected, another card is selected, the map
off-click drops everything. The target kind of a farm or a march is a drawn tile, of a recall a
card of the discard pile's window, of a future card aimed at the hand another card of the hand.

**The drag is the two clicks in one gesture.** Lifting a card past the play height and releasing
it selects and plays it. A card that aims at a tile stays selected, being aimed; one that aims at
the discard pile raises the window. A card the city cannot pay for comes home under the refusal
note.

**The right click inspects and never selects.** On a tile it inspects that tile in the infopanel,
first card first, and pressed again on the same tile it steps on. On a card — in the hand, in a
browse, in the aim window — it inspects the card: the card shown large. Off the map, or beside the
cards, it drops the inspection. It does this in every state: on a clean screen, in city mode,
while a card is being aimed, so a tile can be read before a card is placed on it. A pile is not a
card: a right click on one does nothing.

**The inspection key inspects the selection.** On a selected tile it steps that tile's cards,
moving the inspection there if a right click had put it elsewhere. On a selected card, in the hand
or in a browse, it shows the card large. With no selection, or under a window, it does nothing.

**The back key walks back one step per press**: a window or a card shown large — the aim window
among them, its card staying selected in the hand — the inspection, the selection — a card being
aimed at a tile is let go of as the selection it is — city mode, then the menu.
A browse keeps a selection of its own that dies with the window, and the chronicle screen's
selection waits under it.

Two verbs cover it all. **Select** is the tile ringed or the card lifted, in the hand or in a
browse. **Inspect** is the tile in the infopanel and the card shown large; "zoom" stays the map's
word. "Armed" goes: it meant a payable card waiting for its target, and a card is selected before
the city's purse is asked.

## Lines

- **The city's tile clicked twice enters city mode** — a left click on the city's tile while it is
  the selection enters city mode as the city key does; a second click on any other selected tile
  changes nothing. E2e on `e2e/city-mode.spec.ts`. Doc-impact: none.
- **The hand selects by click** — a left click selects any card of the hand, payable or not, and a
  card that aims at a tile is being aimed from then; a second click plays a selected no-aim card,
  or raises the refusal note over one the city cannot pay for, or raises the discard pile's window
  for a card that aims there; a card being aimed at a tile clicked again stays selected; a left click on anything not of the aimed card's target kind lets it go and lands as on
  a clean screen, another card of the hand included; the inspection key shows the selected card
  large; the drag is unchanged. A click on the card being aimed no longer lets it go, and the code
  says *selected* where it said *armed*. E2e on `e2e/press.spec.ts` and `e2e/refuse.spec.ts`.
  Doc-impact: none.
- **The right click shows a hand card large** — a right click on any card of the hand, selected or
  not, while a card is being aimed or not, shows it large; the left click no longer does. E2e on
  `e2e/press.spec.ts`. Doc-impact: none.
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
