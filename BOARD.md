# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **Units join the catalogue** — the rules receive a catalogue holding the unit kinds, the enemy scripts and what a camp enters, threaded from the boot through the founding and every rule that reads them; the chronicle names its catalogue's version and `apply` refuses any other; a fixture catalogue serves the rules tests, and a coherence test checks the stand-in's kinds against the UI's names and marks. Doc-impact: `docs/DOGMAS.md`. [board/units-join-the-catalogue.md](board/units-join-the-catalogue.md)
- **The map joins the catalogue** — the layer tables and the map compositions move in, a region being a composition, and the founding takes a fully generated map instead of dealing it, so a test hands in a hand-made map such as a radius 8 all-plain disc.
- **Cards join the catalogue** — cards and decks move in, each card carrying its aim and effect closures signed once against the catalogue, and the "data owns its behaviour" dogma returns.
- **The schedule is a timeline** — the founding takes a pre-rolled list of deals, rolled from the schedule's entries and tempo numbers, each landing still reading the chronicle as it stands; the fixture timeline replaces the walkers and their bound so the e2e reaches the victory screen in three turns, and the coherence checks land with the two remaining deferred dogmas.
- **Turn 0, the settle** — a chronicle opens unsettled and its first command puts the city on a tile of a small centre part of the map, the empowering choice of a settling site; later ages may add steps to turn 0.
- **The throwaway selection page** — the game boots on a page choosing a region, a schedule, a deck and a seed and feeding the chronicle its generated map and timeline; it is wholly replaced in v0.0.5, and the rules never learn the word scenario.
- **The nomadic age designed, number-less** — its page in `docs/`: the starting collection of cards with few or no buildings, the units, the events, the capstone and the camp's gift.
- **The nomadic age implemented** — the real catalogue replaces the stand-ins with provisional numbers at last, a scout among the units, and the camp's gift a real card.
- **The biome rework** — a growth weight per biome, the spread growing per biome instead of per frontier, the city's first ring dealt as its own biome, and the bigger map.
- **The balance pass** — numbers measured on the real content, edits uncommitted until the user says they hold.
- **Close v0.0.4** — the changelog entry and the tag.
