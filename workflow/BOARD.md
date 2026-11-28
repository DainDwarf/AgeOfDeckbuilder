# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready for delivery; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

The look's pool — the ideas each rung takes, the fits and colour readings accepted until this version, the cursor finding — is [`LOOK.md`](LOOK.md), read at each rung's cut and deleted at the close.

- **The meta screens** — the launch screen with its region stills, the tree with its ages' grounds, the Stone ground among them, the collection.
- **The palette** — the colours of what code still tints, read against every tileset and icon pack bought by then: the clashes measured, then the colour schemes for colour-blindness through the one look file; taken or dropped once the glyphs carry every meaning by shape.
- **Motion** — easing, flourish, idle, income flying in from the tiles, a unit walking its path, a transition into a chronicle and out of it, and the unit legibility readings.
- **The Nomadic tutorial** — a tutorial teaching the Nomadic Age, city mode among what it explains, its first chronicle's goal being to capture a site.
- **Sound and music** — last, so a version closed early still looks whole.
- **The deliverable** — optimising the deliverable and its workflow: how the build is packaged, how it is sent to itch, and the rest of that road, thought through once the graphics and the sound are finished; the boot is measured again there, and the boot's quick wins (each sheet uploaded once, the loose files never made textures, the fronts' recolouring once per file) are kept or replaced.

## Lines

- **Quick wins on the boot** — every sheet the boot draws holds the same frames and pixels as at c76b0a07, each uploaded once after it is painted, the loose files never made textures, the fronts' recolouring read once per pack file, and `drawSheets` at 2.5 s or less under software drawing against 3.5 s. Doc-impact: none (`docs/PHASER.md` only for a Phaser trap the fix leans on). [board/quick-wins-on-the-boot.md](board/quick-wins-on-the-boot.md)
- **Quick wins on the frame** — the shots of the border, the reach, the claim marks and every scrolling panel come out pixel for pixel as before; the border's band and its two likes are drawn only where they paint, a panel's mask stands only while it clips something; the turn-1 settled save's frame under software drawing is at least 12 ms below the before. Doc-impact: `docs/PHASER.md`. [board/quick-wins-on-the-frame.md](board/quick-wins-on-the-frame.md)
