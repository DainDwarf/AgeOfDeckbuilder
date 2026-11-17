# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

The look's pool — the ideas each rung takes, the fits and colour readings accepted until this version, the cursor finding — is [`LOOK.md`](LOOK.md), read at each rung's cut and deleted at the close.

- **The chrome** — bar, panels, buttons, plates, piles, menu, a minimize button on the scrim's windows if play finds the map held still under them blocking, and the cursor pass.
- **The meta screens** — the launch screen with its region stills, the tree with its ages' grounds, the Stone ground among them, the collection, the ending.
- **The palette** — the colours of what code still tints, read against every tileset and icon pack bought by then: the clashes measured, then the colour schemes for colour-blindness through the one look file; taken or dropped once the glyphs carry every meaning by shape.
- **Motion** — easing, flourish, idle, income flying in from the tiles, a unit walking its path, a transition into a chronicle and out of it, and the unit legibility readings.
- **The Nomadic tutorial** — a tutorial teaching the Nomadic Age, city mode among what it explains, its first chronicle's goal being to capture a site.
- **Sound and music** — last, so a version closed early still looks whole.

## Lines

- **A unit's card reads its unit** — a card that places a unit, the two settle cards among them, reads its unit's damage and its health on the pack's crossed swords and heart at the foot's two corners and its move, action, range and sight as glyphs and numbers in its text box, in place of a sentence naming it, each stat raising its name and its sentence under the pointer; `e2e/card-reads.spec.ts` passes. Doc-impact: `docs/LOOK.md`, `docs/INTERFACE.md`. [board/a-units-card-reads-its-unit.md](board/a-units-card-reads-its-unit.md)
- **The other cards' texts** — a number of population reads in a text as the number and population's glyph, on a card, an answer and a plate; a card doing two things reads a line to each; a trophy reads Gain before its amounts; Floodplain and Tribute read their shorter texts; `e2e/bad-air.spec.ts` passes. Doc-impact: `docs/LOOK.md`. [board/the-other-cards-texts.md](board/the-other-cards-texts.md)
- **Embarking changed** — the way a unit embarks and disembarks is changed, on feedback the user holds, and the Embark and Disembark cards leave.
- **The texts overflowing the card face** — the card texts that still pass the three lines a face's text has and a name wider than its plate ("Misunderstandings") are inspected one by one, and the text is rewritten, the box changed or given a scroll, through mockups.
- **The card types reviewed** — a card's type does not say its family, a settle card placing a building and an action card placing an improvement or nothing, which is a design issue of the card types: review them.
- **The Nomadic cards' paintings** — every card of the Nomadic Age wears one painting of his in its art box.
- **The Stone cards' paintings** — every card of the Stone Age wears one painting of his in its art box.
- **A building on the infopanel as its card** — an inspected building, with its tile's improvements, is shown on the infopanel as the face of its card.
- **A unit on the infopanel as its card** — an inspected unit is shown on the infopanel as the face of its card, reading what it holds now.
- **A small card's tooltip closes on the way** — hovering a small card's tooltip, the pointer crossing another name closes it, and it should not.
- **The look page names its artist throughout** — `docs/LOOK.md` names David Baumgart once and then says "his" about forty times; reword it so the artist is named wherever a reader could lose whose hand is meant.
