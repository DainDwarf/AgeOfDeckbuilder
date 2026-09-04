# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Worker actions** — two stand-in action cards, one laying an improvement and one terraforming, each aimed at a tile where a worker stands. Doc-impact: none.
- **Rivers** — a high biome, rivers rising in it and flowing to sea, and the feature-versus-edge decision made on the design page. Doc-impact: `docs/DESIGN.md`.
- **Income flies in from the tiles** — at the income stage each yielding tile sends its resource to the bar. Doc-impact: none.
