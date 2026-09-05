# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **The bar's readings never overlap** — the seven readings and the Menu button are laid out in one flow whose gaps close together rather than letting the left group and the right one meet, so no reading's press zone reaches into another's however wide the font measures; a test lays the bar out under a font deliberately wider than the one the design was measured in and finds every zone disjoint, and `e2e/yields.spec.ts` passes on CI. Doc-impact: none.
- **Biome edge smoothing** — a fourth generator layer between the biome spread and the terrain scatter: a tile of a biome that touches another biome draws from that biome's edge table instead of its interior one, so a mountain biome's edge is hills and a sea biome is deep water with coastal water at its edge; the design page says four layers and names the tables. Doc-impact: `docs/DESIGN.md`.
- **Rivers** — rivers rising in the mountain biome and flowing to sea, and the feature-versus-edge decision made on the design page. Doc-impact: `docs/DESIGN.md`.
- **Income flies in from the tiles** — at the income stage each yielding tile sends its resource to the bar. Doc-impact: none.
