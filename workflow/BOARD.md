# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **The window spec's claim wait times out on CI** — `e2e/window.spec.ts` "the design space follows a window that grows after boot" times out on CI at `claimFree`'s wait for the held tile, once on 2026-09-23 and twice in a row on `a883fdf`, while it stays green locally; an unverified suspicion is that the settle moves the camera and `claimFree` presses the tiles without resting first.
- **Hunger is forged by its event** — Lean season lays Hunger with its food counter set by the turn, larger later, at one flat price to be rid of; the face reads the counter, the strike reads nothing off the turn, and the answer's name shows the Hunger as it will be laid, with the Nomadic, chronicle and interface pages saying so. Doc-impact: `docs/ages/NOMADIC.md`, `docs/CHRONICLE.md`, `docs/INTERFACE.md`. [board/hunger-forged-by-its-event.md](board/hunger-forged-by-its-event.md)
- **Events carry lore** — an event's window says in a short text what is happening to the city, since most answers make no sense by themselves; the user's lore pitches for the five Nomadic events wait in `board/events-carry-lore.md` for the intake.
- **Event animations** — when an event's answer lands, what it changes on the map — burned tiles, killed population and units, anything an answer does — is animated rather than simply redrawn; the tile The herd's _Follow it_ charts is one of them, wherever it lies on the map, and nothing draws the eye to it until then.
- **A failed boot says so** — when the game fails to boot, WebGL missing for one, the player sees an error message instead of a blank page with the error only in the console.
- **Merge elevation and river lift** — test if a terrain's elevation and its river lift can be the same data: they only diverge on forest, and both represent the same idea of terrain elevation.
- **Close v0.0.4** — the changelog entry and the tag.
