# Branch: Aim

The design first, its lines after. The branch merges once no line is left, and one Prep commit deletes this file and the pointer on [`BOARD.md`](BOARD.md) before the merge.

## The design

The design said that a press on anything else lets a card being aimed go, and the screen kept it by enumeration: the bar, the piles, the infopanel and the pinned achievement each let the card go on their own, and whatever was not on that list passed the click to the tile under it. Three rules replace the list, said once in `docs/INTERFACE.md` for every screen, and each screen's page keeps only what is its own: what each aim is aimed at, what is dragged and where it lands.

**A press lands on the thing the pointer is on, and on nothing under it.** Whatever stands over the map stops a press, whether or not it answers one, a dead button as a live one. Three things are see-through, the pointer being on what stands under them: a tooltip, a refusal's note, and the frame a mode draws around the map. A click is a press landed and let go on the same thing; a press let go on another thing is a drag where it took hold of something, and nothing otherwise.

**A selected thing being aimed filters every left click by its aim.** Its aim is at one kind of thing. A left click on a thing of that kind is the act attempted there, and the rules answer: an act refused says why over that thing and the aim stands. A left click on anything else lets the aimed thing go, selected no more, the inspection standing, and then lands, in the one press, as it would on a clean screen. The right click inspects and the aim stands; a key is no press and the aim stands through it; the back key lets the aimed thing go as the selection it is; the menu opens over an aim and the aim waits under it.

**A thing dragged follows the pointer until its press is let go.** Let go where it lands, it does what landing there does; let go anywhere else, a thing standing over where it would land included, it slides home and nothing changes, the selection no more than the rest. Every thing dragged slides home as fast as a card of the hand does.

**What each aim is aimed at:**

| Being aimed | Its kind | On the kind, refused |
| --- | --- | --- |
| A card that aims at a tile | A drawn tile | The card's one reason, the aim stands |
| A card that aims at a unit | A drawn tile | That no unit stands there, else the card's one reason, the aim stands |
| A card that aims at the hand | Another card of the hand | Nothing is |
| A card that aims at the discard pile | A card of the aim window | Nothing is |
| A selected unit that lights or glows anything | The tiles it lights and the units it glows | Nothing is |

A selected unit that lights and glows nothing, and an enemy's tile, are a selection and no aim: a click on the bar leaves them selected. No unit is being aimed in city mode, which lights none.

**What is dragged, and where it lands:** a card of the hand, anywhere clear of the hand, where it is the two clicks in one gesture and a card that aims at a tile or at a unit stops at being aimed; a unit, a tile it lights or a unit it glows, with nothing standing over it; a population in city mode, a tile the city holds and nobody stands on, with nothing standing over it; a card of the deck editing mode, the room on the other side of the line, whatever stands in it.

**What the player sees change:** the end-turn button clicked while a card is being aimed lets the card go and ends the turn, where it was dead and the click reached the tile under it; a click on the line naming the aim lets the card go; the settle phase's chip stops a press; a click on the bar, a pile, the infopanel, the pinned achievement or a chip lets a selected unit go, as it lets a card go; a unit and a population let go off where they land slide home, where they jumped. Everything else plays as it did: a card aimed at a unit still says that no unit stands on a tile that holds none, a drag let go off where it lands still leaves the selection where it was, a refusal's note is still taken down by any press that then lands under it, and a card dragged over a tile still stops at being aimed.

**In the code** one place answers a left click while anything is being aimed, reading what the pointer is on as the hover and the cursor already do; no thing on the screen is handed a way to let a card go. A thing that stops a press and answers none is interactive and not marked as answering, as the infopanel and the pinned achievement are, so the pointer over it stays the arrow.

## The lines

- **The three rules in the pages** — `docs/INTERFACE.md` _The presses_ says what a press lands on, the aim and the drag; `docs/CHRONICLE-SCREEN.md` says what each card being aimed is aimed at and that a selected unit is being aimed, and no longer says of one thing after another that a press on it reaches no tile; the glossary's rows for the aim read the unit; `npm run lint` is green. Doc-impact: `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/GLOSSARY.md`. [board/aim-rules-in-the-pages.md](board/aim-rules-in-the-pages.md)
- **The card's aim through one door** — one place answers a left click while a card is being aimed, and the bar, the piles, the infopanel and the pinned achievement are handed no way to let a card go; the settle phase's chip, the line naming the aim and a dead end-turn button stop a press, and the end-turn button clicked through an aim lets the card go and ends the turn; `e2e/press.spec.ts` is green. Doc-impact: none — the first line says it. [board/card-aim-one-door.md](board/card-aim-one-door.md)
- **The unit's aim through that door** — a left click on the bar, a pile, the infopanel, the pinned achievement or a chip lets go of a selected unit that lights or glows anything, the inspection standing, and leaves selected a unit that lights nothing and an enemy's tile; `e2e/press.spec.ts` is green. Doc-impact: none — the first line says it. [board/unit-aim-one-door.md](board/unit-aim-one-door.md)
- **A unit and a population slide home** — a unit or a population dragged and let go off where it lands slides home as fast as a card of the hand does, whatever let it go; `e2e/map.spec.ts` is green. Doc-impact: none — the first line says it. [board/slide-home.md](board/slide-home.md)
