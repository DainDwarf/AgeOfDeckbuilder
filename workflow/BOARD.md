# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **Card kinds explain themselves** — a card's kind label, `SETTLE`, `UNIT`, `BUILDING`, `INSTANT`, `HAZARD`, `EVENT` and `CAPSTONE`, answers the rest with a one-line tooltip beside it saying what the kind is, on every surface a card face stands on — the hand, a browse, the aim window, the deal and capstone windows, a card shown large, a small card — and the right click on it stays the card's own; the two stand-in unit entries stop repeating what the kind says; `docs/INTERFACE.md` says so, and `e2e/hover.spec.ts` proves the label on the hand and on the deal window. Doc-impact: `docs/INTERFACE.md`. [board/card-kinds-explain-themselves.md](board/card-kinds-explain-themselves.md)
- **Hunger is forged by its event** — the hazard's amount is fixed on the card and shown on its face; it is the event that forges the card that grows with the turns, forging stronger Hungers on later turns.
- **Events carry lore** — an event's window says in a short text what is happening to the city, since most answers make no sense by themselves; the user's lore pitches for the five Nomadic events wait in `board/events-carry-lore.md` for the intake.
- **Event animations** — when an event's answer lands, what it changes on the map — burned tiles, killed population and units, anything an answer does — is animated rather than simply redrawn; the tile The herd's _Follow it_ charts is one of them, wherever it lies on the map, and nothing draws the eye to it until then.
- **A failed boot says so** — when the game fails to boot, WebGL missing for one, the player sees an error message instead of a blank page with the error only in the console.
- **Merge elevation and river lift** — test if a terrain's elevation and its river lift can be the same data: they only diverge on forest, and both represent the same idea of terrain elevation.
- **Close v0.0.4** — the changelog entry and the tag.
