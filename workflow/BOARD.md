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

- **The screen takes the window's shape** — the chronicle screen is laid out on the window's shape at 100% (or the largest size holding 1280 by 720 units), its pieces at their edges, the map's frame filling the rest, the scrim over the whole window with its windows centred, the meta screens fitted as today, and `e2e/window.spec.ts` proves it. Doc-impact: `docs/PHASER.md`. [board/screen-takes-window-shape.md](board/screen-takes-window-shape.md)
- **Interface size in Graphics** — the Graphics window's third row reads 100%, 125%, 150%, 200% or Largest, a press moves it to the next and redraws the chronicle screen at once, the size is kept in the browser, and `e2e/graphics.spec.ts` proves it. Doc-impact: none. [board/interface-size-in-graphics.md](board/interface-size-in-graphics.md)
- **The resource bar in glyphs** — each reading as its glyph and its number with no word, and a tooltip naming it.
- **Piles and buttons as icons** — the draw, discard and exhaust piles, End turn, Menu and Icons: what wears an icon and what keeps its word.
- **The pinned achievements** — their look on the chronicle screen, changed further than the new paper changes it.
- **The menu's windows** — Menu, Settings, Controls, Graphics, Manage Save and the warnings laid out again on the new paper; deleted at its intake if the paper leaves nothing to lay out.
- **The windows on the scrim** — the deal window, the capstone's, a browse and the ending screen on the new paper, and the answers' two looks left unanswered.
- **A minimize button on the scrim's windows, as a test** — a button setting the deal window, a browse or the capstone's window aside so the map is read and moved under it, built for the user to judge in play and kept or taken out on their word.
- **A short info window on selection** — a small window in a corner reading the most useful facts of the selected unit or building.
- **The combat log** — a readable record of what the end of turn did, for a player who missed the motion or wants it in words.
- **Credits and licences in the game** — a screen off the menu reading the packs' licence record and the build's dependency notices.
- **The cursor** — the cursor saying what a press would do now, and whether the game draws a cursor of its own.
- **A minimap with the map's toggles, as a try** — a minimap with the map's toggles as buttons on it, the Icons button among them, mocked on the real screen at its intake and taken or sent back to the ideas.
