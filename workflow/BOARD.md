# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **One home for the colours** — every colour of the screen, the veils' strengths and the worn-down with them, lives in one Phaser-free record under `src/ui/`, no colour literal stands anywhere else under `src/`, and `e2e/chronicle-screen.ts`'s `accent(page)` is gone, the specs reading the accent off the home. Doc-impact: none. [board/one-home-for-the-colours.md](board/one-home-for-the-colours.md)
- **Card references** — a card named in a rules entry is marked by its id and drawn as its name in brackets; the pointer resting on it shows the named card small above it and a right click on it shows the named card large beside the one it was taken off, both cascading; `docs/INTERFACE.md` and `docs/CHRONICLE-SCREEN.md` say so, the catalogues' coherence tests refuse a name that resolves to no card of theirs, and `e2e/reference.spec.ts` asserts it. Doc-impact: `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`. [board/card-references.md](board/card-references.md)
- **The population key is named idle** — `label.population`, `tooltip.population` and the bar's `Reading` member `'population'` now hold the word Idle; the key is renamed across the bar, the map's assigned mark colour and the piles' change switch.
- **Player-facing text polish** — going over every player-facing text for polish.
- **Event animations** — when an event's answer lands, what it changes on the map — burned tiles, killed population and units, anything an answer does — is animated rather than simply redrawn; the tile The herd's _Follow it_ charts is one of them, wherever it lies on the map, and nothing draws the eye to it until then.
- **Close v0.0.4** — the changelog entry and the tag.
