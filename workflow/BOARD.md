# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **The deck-cycle test hangs on its seed** — "every card of the deck is in exactly one pile through a full cycle" opens on a chronicle that deals nothing, on ground the test authors, names no launch seed and wants no deal, and `npm test` passes. Doc-impact: none. [board/deck-cycle-test-seed.md](board/deck-cycle-test-seed.md)
- **Close v0.0.4** — the changelog entry and the tag.
