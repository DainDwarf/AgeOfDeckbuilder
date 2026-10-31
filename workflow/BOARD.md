# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

The look's pool — the ideas each rung takes, the fits and colour readings accepted until this version, the cursor finding — is [`LOOK.md`](LOOK.md), read at each rung's cut and deleted at the close.

- **The glyphs** — the resource glyphs and every icon the game reads, drawn through one glyph renderer from licensed glyphs in the locked style, on the cards, the yield overlay, the resource bar, the infopanel and the meta screens alike.
- **The map** — terrain, features, rivers, fog, the Stone ground, the rings and the marks, in the locked style.
- **The pieces on the map** — units, buildings, sites, the city badge, a health bar on units, a building's reach drawn.
- **The cards and the windows** — the face, the deal window with answers as text, buildings and improvements shown as cards, a minimize button on the scrim's windows, and the fits accepted until now.
- **The chrome** — bar, panels, buttons, plates, piles, menu, and the cursor pass.
- **The meta screens** — the launch screen with its region stills, the tree, the collection, the ending.
- **Motion** — easing, flourish, idle, income flying in from the tiles, a unit walking its path, a transition into a chronicle and out of it, and the unit legibility readings.
- **Sound and music** — last, so a version closed early still looks whole.

## Lines

- **The art style** — the style settled against real packs dressed on the real screen: three grounds, Kenney's flat tiles, Baumgart's painted tiles and bare geometry, each under the same licensed glyphs, on one tile, one unit and one card, shot in the game; opens the look's design page.
- **The render factor** — the backing store regrown while the game runs, for the fullscreen button, a render-scale setting, a monitor hop and a resize after boot, under the locked style.
- **The bundled font** — the UI face shipped with the build and loaded before the first text, so CI, the player and the developer lay out one game, and the bar's ticking numbers settled as bitmap text or not.
- **The type-size floor** — the smallest size the UI may use, verified readable at the smallest window we care about, and the check run at that size.
- **The palette** — several colours for several meanings, read against the locked ground's own colours, each held reading answered, and the page's rule that colour never carries gameplay meaning alone.
- **The second theme** — a colour-blind-friendly theme as content through the ledger, every entry given its second value, and the way it is switched.
