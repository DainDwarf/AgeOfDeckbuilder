# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **Every state change gives out its steps** — the rules helpers that change the chronicle always give out the steps they raised, and the caller decides whether it keeps or drops them, so a card play or a hazard's strike keeps only the end state where it resolves as one stage, and the pairs that answer a bare chronicle beside a landing (`gained` and `stockGained`, `terraformed` and `terraformedOn`) become one helper each.
- **The fall is taken too late** — the fall by population is taken after every stage is computed, so `grow` still runs on a city of nought population and a silent guard in `src/rules/city.ts` is all that keeps it from growing one back and undoing the fall; the fall may belong before the stages after it are computed.
- **Victory on the act** — check the win condition on player actions, so that building the shelter finishes right away instead of at the end of turn.
- **Make room can deliver Fight** — where no tile takes a camp, `encamped` resolves the answer as a full raid instead, and it widens the content's distance band ring by ring out to the map's edge, neither of which any design page says; `besieged` entering a warrior on every camp it places is linked to it and settles on the same line.
- **A feature's mark under an improvement's** — the map draws a feature's mark and an improvement's mark on the same spot of a tile, so Trapping on a game forest reads as one mark; fixed in this version, not left to the v0.0.6 visual rework.
- **A hazard's strike resolves as stages** — at the end of turn every hazard still in hand strikes inside the one `strike` stage, so two Hungers' population losses land as one step the screen cannot play apart; each strike should resolve as its own stages, as an answer's landing now does.
- **Event animations** — when an event's answer lands, what it changes on the map — burned tiles, killed population and units, anything an answer does — is animated rather than simply redrawn; the tile The herd's _Follow it_ charts is one of them, wherever it lies on the map, and nothing draws the eye to it until then.
- **The biome rework** — a growth weight per biome, the spread growing per biome instead of per frontier, the city's first ring dealt as its own biome, and the bigger map.
- **The balance pass** — numbers measured on the real content, edits uncommitted until the user says they hold. First playtest of the nomadic age: the enemy hits too hard; the settlement and the economy expand way too fast, so gathering is not much needed after a few turns — a victory on 74 food, 22 production, 15 culture — which leaves Hunger biteless and the camps' stocks useless as loot.
- **Close v0.0.4** — the changelog entry and the tag.
- **Card references** — a card named in another text is displayed like a link: hovering it shows a miniature of the card, inspecting it zooms on the card; the details come at intake.
