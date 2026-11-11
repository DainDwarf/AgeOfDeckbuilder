# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

The look's pool — the ideas each rung takes, the fits and colour readings accepted until this version, the cursor finding — is [`LOOK.md`](LOOK.md), read at each rung's cut and deleted at the close.

- **The glyphs** — the resource glyphs and every icon the game reads, drawn through one glyph renderer from licensed glyphs in the locked style, on the cards, the yield overlay, the resource bar, the infopanel and the meta screens alike.
- **The cards and the windows** — the face, the deal window with answers as text, buildings and improvements shown as cards, a minimize button on the scrim's windows, and the fits accepted until now.
- **The chrome** — bar, panels, buttons, plates, piles, menu, and the cursor pass.
- **The meta screens** — the launch screen with its region stills, the tree with its ages' grounds, the Stone ground among them, the collection, the ending.
- **The palette** — the colours of what code still tints, read against every tileset and icon pack bought by then: the clashes measured, then the colour schemes for colour-blindness through the one look file; taken or dropped once the glyphs carry every meaning by shape.
- **Motion** — easing, flourish, idle, income flying in from the tiles, a unit walking its path, a transition into a chronicle and out of it, and the unit legibility readings.
- **The Nomadic tutorial** — a tutorial teaching the Nomadic Age, city mode among what it explains, its first chronicle's goal being to capture a site.
- **Sound and music** — last, so a version closed early still looks whole.

## Lines

- **The clay pit** — a clay pit stands in the row as his clay on a pale disc of the feature's size, a unit from a flint's disc, and his worked pit lies on its hill, large about the middle of a tile with no building, small beside a megalith or a shelter, absent under any other building; the infopanel's row reads his clay bare; the clay pit's stone shape gone. Doc-impact: `docs/LOOK.md`. [board/clay-pit.md](board/clay-pit.md)
- **The pasture** — a tile with a pasture shows its cattle on an improved disc in place of the feature's, no disc added beside it, and its art on the tile is settled at its intake against the buildings and the paintings its plain can wear.
- **The irrigation** — an irrigation stands in the feature's row as his icon on a disc like a feature's, and its art on the tile is settled at its intake against the buildings and the paintings a plain or a desert by a river can wear, a pasture's among them.
- **The trapping** — a tile with a trapping shows its deer on an improved disc in place of the feature's, no disc added beside it, and its art on the tile is settled at its intake against the buildings and the paintings its forest can wear.
- **A toggle for the discs** — a button that shows or hides the discs on the map, the features' and the improvements'.
- **The units** — each unit kind is drawn as his painting, a weapon or a tool of the kind or a person holding it, over his boat while embarked, in a frame that tells its faction (a disc, a halo, standing alone), and how much of a building under it shows.
- **A unit's own states** — a unit whose turn is done and a unit that has prepared wear their marks on the unit itself, both decided on one mockup with the two marks of the line after.
- **The screen's answers on a unit** — the enemies a selected unit can attack and a unit a card is aimed at wear their marks on the unit itself, as that mockup settled them.
- **A health bar on units** — a unit on the map shows its health.
- **The city badge** — a city's badge on his building says what population is, and tries a progress bar for the food growth and one for the culture threshold.
- **A building's reach drawn** — a building that gives to the tiles beside it shows which, when its tile is selected and when its card is aimed.
