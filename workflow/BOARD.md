# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **A failed boot says so** — when the boot throws, before the first screen stands, the page shows that the game could not start and the error's own words in place of the blank page, the error still reaching the console, and `e2e/failed-boot.spec.ts` proves it in a Chromium without WebGL. Doc-impact: `docs/INTERFACE.md`. [board/failed-boot.md](board/failed-boot.md)
- **Merge elevation and river lift** — a terrain carries one height, its elevation, and the river layer reads it where it read the terrain's lift, at a relief of 1.0 in both content regions; `docs/MAP.md` and `docs/GLOSSARY.md` say so, and `npm test` is green. Doc-impact: `docs/MAP.md`, `docs/GLOSSARY.md`. [board/merge-elevation-and-lift.md](board/merge-elevation-and-lift.md)
- **Close v0.0.4** — the changelog entry and the tag.
