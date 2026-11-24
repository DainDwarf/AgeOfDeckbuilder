# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

The look's pool — the ideas each rung takes, the fits and colour readings accepted until this version, the cursor finding — is [`LOOK.md`](LOOK.md), read at each rung's cut and deleted at the close.

- **City mode and the settle phase** — how the two are shown: the map's frame and the chip naming the mode, the growth and culture bars and the population in city mode, and the claimable tiles shown once an extend button is pressed.
- **The meta screens** — the launch screen with its region stills, the tree with its ages' grounds, the Stone ground among them, the collection.
- **The palette** — the colours of what code still tints, read against every tileset and icon pack bought by then: the clashes measured, then the colour schemes for colour-blindness through the one look file; taken or dropped once the glyphs carry every meaning by shape.
- **Motion** — easing, flourish, idle, income flying in from the tiles, a unit walking its path, a transition into a chronicle and out of it, and the unit legibility readings.
- **The Nomadic tutorial** — a tutorial teaching the Nomadic Age, city mode among what it explains, its first chronicle's goal being to capture a site.
- **Sound and music** — last, so a version closed early still looks whole.
- **The deliverable** — optimising the deliverable and its workflow: how the build is packaged, how it is sent to itch, and the rest of that road, thought through once the graphics and the sound are finished.

## Lines

- **A minimize button on the deal window, as a test** — a button at the end of the deal window's ribbon minimizes the window, the ribbon and the sunk button alone left standing, the chronicle screen read under it and nothing commanded, and a click on the button or the ribbon, or the back key, brings the window back whole; `e2e/minimize.spec.ts` proves it. Built for the user to judge in play, and kept or taken out on their word. Doc-impact: `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`. [board/a-minimize-button-on-the-deal-window.md](board/a-minimize-button-on-the-deal-window.md)
- **The Menu button under every scrim** — under a browse, the deal window, the capstone's window, a card shown large and the ending screen, on the chronicle screen and on the meta screens alike, the Menu button is dimmed with the screen and reacts to nothing, a press there being a press on that scrim, as it already is under a scrim of the menu; the back key raises the menu wherever it did; `e2e/menu.spec.ts` proves it. Doc-impact: `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`. [board/the-menu-button-under-every-scrim.md](board/the-menu-button-under-every-scrim.md)
- **A short info window on selection** — a small window in a corner reading the most useful facts of the selected unit or building.
- **The combat log** — a readable record of what the end of turn did, for a player who missed the motion or wants it in words.
- **Credits and licences in the game** — a screen off the menu reading the packs' licence record and the build's dependency notices.
- **The cursor** — the cursor saying what a press would do now, and whether the game draws a cursor of its own.
- **A minimap with the map's toggles, as a try** — a minimap with the map's toggles as buttons on it, the Icons button among them, mocked on the real screen at its intake and taken or sent back to the ideas.
