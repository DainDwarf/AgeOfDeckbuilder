# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **An event names what it needs** — an event may name what it needs of the chronicle to be dealt: on its due turn an event whose need is not met is not dealt, nothing is dealt that turn, and the next deal is rolled from that turn — held by a rules test on a fixture event. Doc-impact: `docs/CHRONICLE.md`. [board/event-need.md](board/event-need.md)
- **Wildfire** — the nomadic schedule's third event: _Let it burn_ starts a fire on a forest tile drawn within 4 of the city and burns every forest tile within 1 of it to plain, killing the population on them and damaging the units on them, its card reading the exact price; _Cut a firebreak_ costs production and changes nothing; it weighs nothing before turn 8 and is not dealt with no forest to start on — held by rules tests on the nomadic catalogue. Doc-impact: `docs/ages/NOMADIC.md`. [board/wildfire.md](board/wildfire.md)
- **Departure** — the fourth event, and the helper that takes an inhabitant from the city, idle first and the last assigned else: an inhabitant leaves, never the city's last, or culture keeps them; Hunger's strike then kills one when the food stock cannot cover it.
- **The herd** — the fifth event, and the helper that deals a feature onto a tile: food now, or game dealt onto the forest near the city; the reach is that intake's fork, and so is whether it names the need Wildfire does, with no forest near the city to deal game onto.
- **Victory on the act** — check the win condition on player actions, so that building the shelter finishes right away instead of at the end of turn.
- **The biome rework** — a growth weight per biome, the spread growing per biome instead of per frontier, the city's first ring dealt as its own biome, and the bigger map.
- **The balance pass** — numbers measured on the real content, edits uncommitted until the user says they hold. First playtest of the nomadic age: the enemy hits too hard; the settlement and the economy expand way too fast, so gathering is not much needed after a few turns — a victory on 74 food, 22 production, 15 culture — which leaves Hunger biteless and the camps' stocks useless as loot.
- **Close v0.0.4** — the changelog entry and the tag.
- **Card references** — a card named in another text is displayed like a link: hovering it shows a miniature of the card, inspecting it zooms on the card; the details come at intake.
