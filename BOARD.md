# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **The schedule is a timeline** — the events and the schedules join the catalogue, the weights and the tempo numbers on the schedule and a second script on the event for the turns of its span; the launch rolls the schedule into a timeline the founding takes as an argument and the chronicle carries, every landing still reading the chronicle as it stands; the walkers and their bound go, a fixture timeline in their place; the boot takes a schedule id and the stand-in's short schedule brings the e2e to the victory screen in three turns; the stand-in's coherence test covers the events, the schedules and the victory line; and the two remaining deferred dogmas return. Doc-impact: `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/DOGMAS.md`. [board/the-schedule-is-a-timeline.md](board/the-schedule-is-a-timeline.md)
- **The road's movement lives in its improvement** — `src/rules/map.ts` stops naming `PH_Road`: the half-move-point cost and the bridge become properties of the road improvement in the catalogue.
- **Turn 0, the settle** — a chronicle opens unsettled and its first command puts the city on a tile of a small centre part of the map, the empowering choice of a settling site; later ages may add steps to turn 0.
- **The throwaway selection page** — the game boots on a page choosing a region, a schedule, a deck and a seed and feeding the chronicle its generated map and timeline; it is wholly replaced in v0.0.5, and the rules never learn the word scenario.
- **The nomadic age designed, number-less** — its page in `docs/`: the starting collection of cards with few or no buildings, the units, the events, the capstone and the camp's reward.
- **The nomadic age implemented** — the real catalogue replaces the stand-ins with provisional numbers at last, a scout among the units, and the camp's reward a real card.
- **The biome rework** — a growth weight per biome, the spread growing per biome instead of per frontier, the city's first ring dealt as its own biome, and the bigger map.
- **The balance pass** — numbers measured on the real content, edits uncommitted until the user says they hold.
- **Close v0.0.4** — the changelog entry and the tag.
