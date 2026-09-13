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
- **The design page split** — DESIGN.md's interface prose leaves the Systems section for a page of
  its own.
- **Sentences authored by the implementer** — a player-facing sentence or a design sentence the
  implementer wrote is put to the user at the hand-back, never left unconfirmed.
