# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Assignment** — in city mode a tile click assigns an idle inhabitant to a held tile or unassigns one; at income only assigned tiles yield, the city's tile no exception; rules tests cover both. Doc-impact: `docs/DESIGN.md`.
- **Claiming with culture** — in city mode a click on a tile adjacent to the border claims it for culture, at a cost rising in steps with the tiles held; an unaffordable claim is refused with its reason. Doc-impact: none.
- **Population eats and grows** — at income every inhabitant consumes food, the surplus accumulates toward the next inhabitant at steps that widen, a deficit starves one, and population reaching zero is a defeat the defeat screen names. Doc-impact: `docs/DESIGN.md`.
- **Assigned and idle shown** — the population chip shows assigned and idle inhabitants apart, with its tooltip. Doc-impact: none.
- **The four-layer tile** — a tile carries feature and improvement layers, income sums all four, the generator deals one feature, and the infopanel reads the four layers. Doc-impact: none.
- **Worker actions** — two stand-in action cards, one laying an improvement and one terraforming, each aimed at a tile where a worker stands. Doc-impact: none.
- **Rivers** — a high biome, rivers rising in it and flowing to sea, and the feature-versus-edge decision made on the design page. Doc-impact: `docs/DESIGN.md`.
- **Income flies in from the tiles** — at the income stage each yielding tile sends its resource to the bar. Doc-impact: none.
