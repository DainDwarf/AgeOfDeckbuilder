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
selects the tile. On a card in the hand it arms the card, which is the card's way of being
selected, whether or not the city can pay for it. On a card in a browse it selects that card. Off
the map, or beside the cards of a browse, it drops the selection. Making a new selection drops the
old one, whatever it was.

**A left click on the selection plays it.** A selected tile clicked again stays selected. An armed
card clicked again is played where it stands: a card that aims at nothing is played, and refused
over the card with its reason when the city cannot pay; a card that aims lands nowhere, so it
stays armed. This is the design's "a card aimed at nothing lands nowhere".

**An armed card that aims filters every left click by its target kind.** A press on a thing of
that kind is the play attempted there, and the rules answer it, refusing over the tile with the
reason and leaving the card armed. A press on anything else lets the card go and then lands as it
would on a clean screen, in the one press: a tile is selected, another card is armed, the map
off-click drops everything. The target kind of a farm or a march is a drawn tile, of a recall a
card of the discard pile's window, of a future card aimed at the hand another card of the hand.

**The drag is the two clicks in one gesture.** Lifting a card past the play height and releasing
it arms and plays it. A card that aims stops armed. A card the city cannot pay for comes home
under the refusal note.

**The right click inspects and never selects.** On a tile it inspects that tile in the infopanel,
first card first, and pressed again on the same tile it steps on. On a card — in the hand, in a
browse, in the aim window — it inspects the card: the card shown large. Off the map, or beside the
cards, it drops the inspection. It does this in every state: on a clean screen, in city mode,
while a card is armed, so a tile can be read before a card is placed on it. A pile is not a card:
a right click on one does nothing.

**The inspection key inspects the selection.** On a selected tile it steps that tile's cards,
moving the inspection there if a right click had put it elsewhere. On an armed card or a selected
browse card it shows the card large. With no selection, or under a window, it does nothing.

**The back key walks back one step per press**: a window or a card shown large, the armed card,
the inspection, the selection, city mode, then the menu. A browse keeps a selection of its own
that dies with the window, and the chronicle screen's selection waits under it.

One verb, **inspect**, covers the tile in the infopanel and the card shown large; "zoom" stays
the map's word.

## Lines

- **The design writes the presses** — `docs/DESIGN.md` carries the design above as the chronicle
  screen's presses: the hand's presses, which the design never wrote; the right click's one rule
  in place of the three at *City mode* and *Cards*; the aim window's presses; the back key's list
  with the armed card and the card shown large. `docs/GLOSSARY.md` widens *select* and *inspect*
  to cards. No code changes; the lines below make the code agree. Doc-impact: `docs/DESIGN.md`,
  `docs/GLOSSARY.md`.
- **The hand arms by click** — a left click arms any card of the hand, payable or not; a second
  click plays an armed no-aim card, or raises the refusal note over one the city cannot pay for;
  an armed aim card clicked again stays armed; a left click on anything not of the armed card's
  target kind lets it go and lands as on a clean screen, another card of the hand included; the
  inspection key shows the armed card large; the drag is unchanged. A click on the armed card no
  longer lets it go. E2e on `e2e/press.spec.ts` and `e2e/refuse.spec.ts`. Doc-impact: none.
- **The right click shows a hand card large** — a right click on any card of the hand, armed or
  not, while a card is armed or not, shows it large; the left click no longer does. E2e on
  `e2e/press.spec.ts`. Doc-impact: none.
- **The right click never selects** — on a tile it inspects without selecting, and pressed again
  on the same tile steps on; off the map it drops the inspection and leaves the selection standing;
  the inspection key moves the inspection to the selection when they differ. E2e on
  `e2e/inspect.spec.ts` and `e2e/press.spec.ts`. Doc-impact: none.
- **The right click inspects while a card is armed** — it no longer lets the card go: on a tile it
  inspects the tile, on a card it shows the card large, off the map it drops the inspection, and
  the card stays armed through all three. E2e on `e2e/building.spec.ts`. Doc-impact: none.
- **The aim window follows the presses** — a press beside its cards lets the aimed card go, the
  window with it; a right click on one of its cards shows it large; the Cancel button goes. E2e on
  `e2e/recall.spec.ts`. Doc-impact: none.
- **The browse selects** — a left click on a browsed card selects it, ringed; a right click or the
  inspection key shows it large; a press beside the cards drops the selection, and with none
  standing closes the browse; the back key walks the same steps; the selection dies with the
  window. E2e on `e2e/browse.spec.ts`. Doc-impact: none.
