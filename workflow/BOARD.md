# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

The look's pool — the ideas each rung takes, the fits and colour readings accepted until this version, the cursor finding — is [`LOOK.md`](LOOK.md), read at each rung's cut and deleted at the close.

- **The pieces on the map** — units, buildings, sites, improvements (his painted icons or a change to the tile's own drawing, mocked up at its intake), the city badge, a health bar on units, a building's reach drawn.
- **The glyphs** — the resource glyphs and every icon the game reads, drawn through one glyph renderer from licensed glyphs in the locked style, on the cards, the yield overlay, the resource bar, the infopanel and the meta screens alike.
- **The cards and the windows** — the face, the deal window with answers as text, buildings and improvements shown as cards, a minimize button on the scrim's windows, and the fits accepted until now.
- **The chrome** — bar, panels, buttons, plates, piles, menu, and the cursor pass.
- **The meta screens** — the launch screen with its region stills, the tree with its ages' grounds, the Stone ground among them, the collection, the ending.
- **The palette** — the colours of what code still tints, read against every tileset and icon pack bought by then: the clashes measured, then the colour schemes for colour-blindness through the one look file; taken or dropped once the glyphs carry every meaning by shape.
- **Motion** — easing, flourish, idle, income flying in from the tiles, a unit walking its path, a transition into a chronicle and out of it, and the unit legibility readings.
- **The Nomadic tutorial** — a tutorial teaching the Nomadic Age, city mode among what it explains, its first chronicle's goal being to capture a site.
- **Sound and music** — last, so a version closed early still looks whole.

## Lines

- **The rings and the marks** — the borders, the selection ring, the lit glow, the city-mode marks, the culture threshold and the badge re-read against his ground, the pool's three map fits among them, each colour pitched by its meaning.
- **A minicard's tooltip closes on the way** — hovering a minicard's tooltip, the pointer crossing another reference closes it, and it should not.
- **Nomadic sites near the city** — in the Nomadic Age the sites spawn near the city, or are forced closer; balancing, taken any time.
