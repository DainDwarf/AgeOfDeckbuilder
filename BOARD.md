# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **Wildfire** — the third event: the forest near the city burns to plain with the game, the trapping, the inhabitant and a unit's health on it, or production pays for a firebreak; the reach, whether all or a roll, and the city's own forest tile are that intake's forks.
- **Departure** — the fourth event, and the helper that takes an inhabitant from the city, idle first and the last assigned else: an inhabitant leaves, never the city's last, or culture keeps them; Hunger's strike then kills one when the food stock cannot cover it.
- **The herd** — the fifth event, and the helper that deals a feature onto a tile: food now, or game dealt onto the forest near the city; the reach is that intake's fork.
- **Victory on the act** — check the win condition on player actions, so that building the shelter finishes right away instead of at the end of turn.
- **The biome rework** — a growth weight per biome, the spread growing per biome instead of per frontier, the city's first ring dealt as its own biome, and the bigger map.
- **The balance pass** — numbers measured on the real content, edits uncommitted until the user says they hold. First playtest of the nomadic age: the enemy hits too hard; the settlement and the economy expand way too fast, so gathering is not much needed after a few turns — a victory on 74 food, 22 production, 15 culture — which leaves Hunger biteless and the camps' stocks useless as loot.
- **Close v0.0.4** — the changelog entry and the tag.
- **Card references** — a card named in another text is displayed like a link: hovering it shows a miniature of the card, inspecting it zooms on the card; the details come at intake.
