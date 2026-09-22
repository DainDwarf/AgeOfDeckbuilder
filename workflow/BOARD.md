# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **The spec-run instrument** — how to cut the redundant spec runs, the reviewer repeating the implementer's set and dossiers naming seven or ten specs, without a cap that prices an honest diagnosis or moves a test; to discuss and converge on.
- **A staleness pass over the tests** — fixtures carrying pieces that no longer act, like the worker at `LURE` left after the fixture's own script took over from the default one; the nomadic and stand-in coherence tests, which ask their scripts nothing; and the text entries holding a placeholder outside the answers, the refusals, the aim line, the browse titles, the defeat lines and the panel's, whose filling no test proves.
- **Card references** — a card named in a rules entry is marked by its id and drawn as its name in brackets; the pointer resting on it shows the named card small above it and a right click on it shows the named card large beside the one it was taken off, both cascading; `docs/INTERFACE.md` and `docs/CHRONICLE-SCREEN.md` say so, the catalogues' coherence tests refuse a name that resolves to no card of theirs, and `e2e/reference.spec.ts` asserts it. Doc-impact: `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`. [board/card-references.md](board/card-references.md)
- **References beyond cards** — a name in a rules entry resolves to more than a card: an improvement, a feature, anything with a row in the info panel, shown small as that row.
- **Card kinds explain themselves** — every card kind's label, settle, unit, building, instant, hazard, event and capstone, gets a tooltip or reference stating the kind's own rules, so a card's rules entry stops repeating what its kind already means.
- **Hunger is forged by its event** — the hazard's amount is fixed on the card and shown on its face; it is the event that forges the card that grows with the turns, forging stronger Hungers on later turns.
- **Events carry lore** — an event's window says in a short text what is happening to the city, since most answers make no sense by themselves; the user's lore pitches for the five Nomadic events wait in `board/events-carry-lore.md` for the intake.
- **Event animations** — when an event's answer lands, what it changes on the map — burned tiles, killed population and units, anything an answer does — is animated rather than simply redrawn; the tile The herd's _Follow it_ charts is one of them, wherever it lies on the map, and nothing draws the eye to it until then.
- **A failed boot says so** — when the game fails to boot, WebGL missing for one, the player sees an error message instead of a blank page with the error only in the console.
- **Merge elevation and river lift** — test if a terrain's elevation and its river lift can be the same data: they only diverge on forest, and both represent the same idea of terrain elevation.
- **Close v0.0.4** — the changelog entry and the tag.
