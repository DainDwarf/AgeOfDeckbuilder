# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

The look's pool — the ideas each rung takes, the fits and colour readings accepted until this version, the cursor finding — is [`LOOK.md`](LOOK.md), read at each rung's cut and deleted at the close.

- **Animation speed** — a setting for how fast the staged motions play, and the suite on the fastest.
- **The style lock** — the art style settled against real packs dressed on the real screen, the font bundled, the render factor strategy, the type-size floor, and the colour discussion: several colours for several meanings, the ledger, shape redundancy for anything gameplay-critical; ends in the look's design page.
- **The map** — terrain, features, rivers, fog, the Stone ground, the rings and the marks, in the locked style.
- **The pieces on the map** — units, buildings, sites, the city badge, a health bar on units, a building's reach drawn.
- **The cards and the windows** — the face, the icons through one glyph renderer, the deal window with answers as text, buildings and improvements shown as cards, a minimize button on the scrim's windows, and the fits accepted until now.
- **The chrome** — bar, panels, buttons, plates, piles, menu, and the cursor pass.
- **The meta screens** — the launch screen with its region stills, the tree, the collection, the ending.
- **Motion** — easing, flourish, idle, income flying in from the tiles, a unit walking its path, and the unit legibility readings.
- **Sound and music** — last, so a version closed early still looks whole.

## Lines

- **A card named by its key** — a play command and the hand aim name their card by its key instead of its place in the hand, a key the hand does not hold refused; the personas, the fixtures and the spec helpers build their commands by key, the spec helpers still taking the slot; the simulator's trace names the card a play played, the card a hand aim was aimed at and the entry a take took. Doc-impact: `docs/SIMULATOR.md`. [board/a-card-named-by-its-key.md](board/a-card-named-by-its-key.md)
- **A card face read in place, and the hand** — a face re-reads another card through its objects' setters without being rebuilt, and the hand keeps a pool of faces, one per slot, hidden past the hand's length.
- **The piles' tops retained** — the draw pile's back and the discard pile's top card re-read in place through the face.
- **Cut `src/ui/map.ts`** — the file is past 2,100 lines; cut it into smaller modules.
