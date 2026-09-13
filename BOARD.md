# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one
sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the
line's design with the user and gives it a done-condition, machine-verifiable where possible, its
doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan —
written once, on the settled state, and deleted with the line. A line with a dossier link is ready
to ship; one without waits for intake. A line that cannot be completed is documentation — it
moves to `docs/`.

Before intake: `- **Title** — what it is about.`
After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **The wrap linter** — every markdown file in the repo is one line per paragraph, `npm run lint` fails on a hand-wrapped paragraph in any of them, and `npm run fmt` unwraps it. Doc-impact: DOGMAS.md, CLAUDE.md. [board/the-wrap-linter.md](board/the-wrap-linter.md)
- **The design page split** — `docs/DESIGN.md` keeps the pitch, `docs/INTERFACE.md` holds how any screen is worked, `docs/CHRONICLE.md` holds what exists only inside a chronicle, every moved paragraph lands verbatim, and every reference to the spec names the design pages. Doc-impact: DESIGN.md, INTERFACE.md, CHRONICLE.md, index.md, DOGMAS.md, ROADMAP.md, CLAUDE.md. [board/the-design-page-split.md](board/the-design-page-split.md)
- **Sentences authored by the implementer** — the implementer's report carries an *Authored* section listing every player-facing entry and every `docs/` sentence the dossier did not write out verbatim, the ship session checks it against the diff and quotes each back to the user at the hand-back, and the dossier template writes the player-facing sentences a line foresees out at intake. Doc-impact: DOGMAS.md. [board/sentences-authored-by-the-implementer.md](board/sentences-authored-by-the-implementer.md)
- **Seeds dealt no camp** — seed 6 of PH_Deck, and twelve more seeds under a thousand, are dealt no camp though the composition asks for three; undiagnosed whether placement fails or no tile legitimately takes one.
- **City-mode click beside the tiles** — in city mode a left click beside the tiles drops nothing, though the presses section of `docs/DESIGN.md` writes no city-mode exception.
- **An enemy script touching a fellow enemy** — `enemyPhase` re-seeds each enemy from the start-of-phase snapshot, so a script touching a fellow enemy would be reverted; possibly fixed already, to check.
