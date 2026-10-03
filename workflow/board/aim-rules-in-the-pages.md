# The three rules in the pages

**Line:** **The three rules in the pages** — `docs/INTERFACE.md` _The presses_ says what a press lands on, the aim and the drag; `docs/CHRONICLE-SCREEN.md` says what each card being aimed is aimed at and that a selected unit is being aimed, and no longer says of one thing after another that a press on it reaches no tile; the glossary's rows for the aim read the unit; `npm run lint` is green. Doc-impact: `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/GLOSSARY.md`.

**Spec:** [`../BRANCH.md`](../BRANCH.md), _The design_, is what the pages come to say. Every sentence is written out here; nothing else on the three pages moves.

`docs/INTERFACE.md`:

1. The page's opening quote: "the three presses," becomes "the three presses, what a press lands on, the aim and the drag,".
2. _The presses_, a new paragraph after the first, the one ending "a scrim that click raises excepted.":

   > **A press lands on the thing the pointer is on, and on nothing under it.** Whatever stands over the map stops a press, whether or not it answers one, a dead button as a live one, so a tile is reached only where nothing stands over it. A tooltip, a refusal's note and the frame a mode draws around the map are see-through: the pointer is on what stands under them. A click is a press landed and let go on the same thing; a press let go on another thing is a drag where it took hold of something, and nothing otherwise.

3. _The presses_, two new paragraphs after the one opening "**The selection is one thing, a tile or a card, and the left click makes it.**":

   > **A selected thing being aimed filters every left click by its aim.** It is being aimed while what its aim admits is offered, and its aim is at one kind of thing. A left click on a thing of that kind is the act attempted there, and the rules answer: an act refused says why over that thing, in the note a refusal raises, and the aim stands. A left click on anything else lets the aimed thing go, selected no more, and then lands, in the one press, as it would on a clean screen. The right click inspects and the aim stands, and the back key lets the aimed thing go as the selection it is.

   > **A thing dragged follows the pointer until its press is let go.** Let go where it lands, it does what landing there does; let go anywhere else, a thing standing over where it would land included, it slides home, as fast whatever it is, and nothing changes, the selection no more than the rest. What is dragged and where it lands is its screen's to say.

4. _What stands over what_, the tooltip's paragraph: "a card, a unit or a population being carried comes home and nothing plays" becomes "a card, a unit or a population being dragged slides home and nothing plays".

`docs/CHRONICLE-SCREEN.md`:

5. _The map's presses_, a new sentence after "a click on a unit glowed is that unit's attack on it, and selects nothing either.":

   > A unit that lights or glows anything is being aimed from the moment its tile is selected, at the tiles it lights and the units it glows: nothing of that kind is refused, and a click on any other tile lets it go and selects that tile.

6. _The veils and the infopanel_, the last paragraph: its last sentence, "A press on the infopanel reaches no tile under it.", is deleted.
7. _The hand and the aim_, the third paragraph, the one opening "**A card being aimed filters every left click by its aim.**", is replaced whole by:

   > **Every card being aimed is aimed at one kind of thing.** A card that aims at a tile or at a unit is aimed at a drawn tile, and one that aims at a unit is refused on a tile no unit of the player's stands on before its own reasons are asked; a card that aims at the hand is aimed at every other card of the hand, and one that aims at the discard pile at a card of the aim window. A play refused says the one reason it is turned down, and the card stays selected. A drag that lifts another card of the hand is a press on anything else, whatever the card it lets go was aimed at.

8. _The pinned achievement_: "It answers no press, and a press on it reaches no tile under it; the wheel over it zooms the map, as over the resource bar." becomes "It answers no press; the wheel over it zooms the map, as over the resource bar."

`docs/GLOSSARY.md`, the definitions of two rows, their forbidden words untouched:

9. **aim**: "What a card is played at, nothing included; for a selected unit, the tiles it lights and the units it glows."
10. **being aimed**: "The state of a selected card or unit while what its aim admits is offered, until it lands or is let go of."

No player-facing entry.

**Doc-impact:** `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/GLOSSARY.md`.

**Scope:**

In: the ten edits above, and nothing else.

Out: every file under `src/` and `e2e/`; `docs/META-SCREENS.md`, whose deck editing paragraph already says where its card lands and that it slides back, and keeps its own words; the end-turn button and the line naming the aim, which get no sentence of their own, the first paragraph added to _The presses_ covering both; the settle phase's "the chip answers no press", which stands.

Corner cases, decided:

- The pages run ahead of the code on this branch until its last line ships: that is the branch's purpose, and no sentence is softened for it.
- The glossary gets no row for the drag: "drag" is plain English here, the player's own word for it.
- `docs/CHRONICLE-SCREEN.md` keeps "comes home" where it says a unit or a population let go anywhere else comes home; how it comes home is `docs/INTERFACE.md`'s.

**Traps:**

- A paragraph is one line: Prettier unwraps, and `npm run lint` refuses a wrapped one. The quotes above are indented for this file alone; on the pages each is a paragraph of its own, unquoted.
- A design sentence names no case list and no piece of content; the sentences above were written to that, so nothing is added to them.
- The glossary lint reads `src/ui/text.ts` and `CHANGELOG.md` alone; the two rows' forbidden words stay as they are.

**Plan:**

1. `docs/INTERFACE.md`: edits 1 to 4. Leaves the three rules said once, for every screen.
2. `docs/CHRONICLE-SCREEN.md`: edits 5 to 8. Leaves the page saying only what is the chronicle screen's own.
3. `docs/GLOSSARY.md`: edits 9 and 10.
4. `workflow/BRANCH.md`: this line deleted; this file deleted.

**Verify:**

- `npm run fmt`, `npm run lint`.
- No spec proves the line: it reaches no screen.
- CI's, on the push: the whole suite, unchanged by the line.
