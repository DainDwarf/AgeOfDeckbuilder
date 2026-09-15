# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **The city's entry holds its content** — the city's sight, how far out the settle holds and the idle inhabitants it opens with are three fields of the catalogue's city entry with today's numbers, read by the rules, no constant left for any of them and no chronicle playing differently. Doc-impact: `docs/CHRONICLE.md`. [board/the-citys-entry-holds-its-content.md](board/the-citys-entry-holds-its-content.md)
- **Turn 0, the settle** — a chronicle opens on turn 0 with the city standing nowhere, the map's centre part in sight and the deck's settle cards in hand; a card of the new settle kind puts the city on a charted tile that takes one; ending the turn is refused until it stands, and its end brings turn 1 with none of the cycle run and the settle cards gone; the stand-in settles as it founded, and every spec opens through the settle. Doc-impact: `docs/CHRONICLE.md`, `docs/GLOSSARY.md`. [board/turn-0-the-settle.md](board/turn-0-the-settle.md)
- **The throwaway selection page** — the game boots on a page choosing a region, a schedule, a deck and a seed and feeding the chronicle its generated map and timeline; it is wholly replaced in v0.0.5, and the rules never learn the word scenario.
- **The nomadic age designed, number-less** — its page in `docs/`: how the age settles — the site chosen, the city keeping the terrain it lands on, water and mountain refused, one inhabitant working its tile — the starting collection of cards with few or no buildings, the units, the events, the capstone and the camp's reward.
- **The nomadic age implemented** — the real catalogue replaces the stand-ins with provisional numbers at last, a scout among the units, and the camp's reward a real card.
- **The biome rework** — a growth weight per biome, the spread growing per biome instead of per frontier, the city's first ring dealt as its own biome, and the bigger map.
- **The balance pass** — numbers measured on the real content, edits uncommitted until the user says they hold.
- **Close v0.0.4** — the changelog entry and the tag.
