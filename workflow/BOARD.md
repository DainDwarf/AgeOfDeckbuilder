# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **Guarded camps and the enemy scripts** — every camp opens and rolls with a guard on or beside it, a warrior carries the guard or the raider script its entry names, and each script's decisions are held by one test on the fixture. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`. [board/guarded-camps.md](board/guarded-camps.md)
- **An action spends the move points** — by default a unit that spends its action, on an attack or on a card played through a worker, also spends its remaining move points, hit-and-run being a later age's unit trait rather than the nomadic warrior's.
- **The culture curve** — the culture threshold buys six tiles before the capstone, which is not nomadic at all; the age wants one claim needed and a second fought for, while later ages must let a culture-heavy deck play a large land city, so the curve's shape is the question.
- **The population growth curve** — the growth threshold equals the population, so the city grows every turn and food piles up to dozens; a steeper curve is the candidate, with the question of whether units count as population for it, since otherwise a smaller city produces units faster.
- **Production's drain** — production has almost no drain or curve and piles up like food; Shelter, Trapping, the firebreak and Hunger are its only sinks, and what a standing drain or a steeper sink should be is the question.
- **The balance pass** — numbers measured on the real content, edits uncommitted until the user says they hold. First playtest of the nomadic age: the enemy hits too hard; the settlement and the economy expand way too fast, so gathering is not much needed after a few turns — a victory on 74 food, 22 production, 15 culture — which leaves Hunger biteless and the camps' stocks useless as loot.
- **Event animations** — when an event's answer lands, what it changes on the map — burned tiles, killed population and units, anything an answer does — is animated rather than simply redrawn; the tile The herd's _Follow it_ charts is one of them, wherever it lies on the map, and nothing draws the eye to it until then.
- **Card references** — a card named in another text is displayed like a link: hovering it shows a miniature of the card, inspecting it zooms on the card; the details come at intake.
- **Close v0.0.4** — the changelog entry and the tag.
