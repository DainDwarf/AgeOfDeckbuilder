# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **Event animations** — every change on a tile the map draws — `retiled`, `charted`, `killed`, `damaged`, and `assigned` where the tile is left — plays as a motion after the pan that holds the tile, the difference between the face drawn and the face the change leaves, and `e2e/landing.spec.ts` proves a stand-in answer's charted tile, pushed out of the frame, is brought in and drawn. Doc-impact: none. [board/event-animations.md](board/event-animations.md)
- **A failed boot says so** — when the boot throws, before the first screen stands, the page shows that the game could not start and the error's own words in place of the blank page, the error still reaching the console, and `e2e/failed-boot.spec.ts` proves it in a Chromium without WebGL. Doc-impact: `docs/INTERFACE.md`. [board/failed-boot.md](board/failed-boot.md)
- **Merge elevation and river lift** — test if a terrain's elevation and its river lift can be the same data: they only diverge on forest, and both represent the same idea of terrain elevation.
- **Close v0.0.4** — the changelog entry and the tag.
