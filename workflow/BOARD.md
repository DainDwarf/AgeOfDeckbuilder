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

- **The attack on a unit** — a unit the selected unit can attack wears the unit's ring in the attack's colour in place of the red hexagon over its tile, and the marked unit the pointer is on, or a unit is dragged over, reads the attack as a lit tile reads the path: an arrow from the unit to it and the health the attack would remove over it; `e2e/attack.spec.ts` proves the ring, the reading and its handing over to the path, and the pages say so. Doc-impact: `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`, `docs/GLOSSARY.md`. [board/the-attack-on-a-unit.md](board/the-attack-on-a-unit.md)
- **A step and an attack in one press** — an enemy out of a unit's range that a step brings in range wears the attack's mark, reads the path to the tile the blow comes from with the move points left there and then the attack, and one press does both.
- **A unit's own states** — a unit whose turn is done and a unit that has prepared wear their marks on the unit itself, a unit kept in fog as last seen among them, read beside its ring and the attack's mark.
- **A health bar on units** — a unit on the map shows its health; the health an attack would remove, read as a number over the unit attacked, is looked at again once a bar can show it.
- **The city badge** — a city's badge on his building says what population is, and tries a progress bar for the food growth and one for the culture threshold; its place too, the badge lying with the buildings where the unit on the city's tile covers part of it.
- **A building's reach drawn** — a building that gives to the tiles beside it shows which, when its tile is selected and when its card is aimed.
