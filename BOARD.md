# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **No city mode without a city** — city mode is not entered while the city stands nowhere: on turn 0 before the settle the city key and the culture and population readings do nothing, and once the city stands, on turn 0 or any turn after, each of them enters it as today. Doc-impact: `docs/CHRONICLE.md`. [board/no-city-mode-without-a-city.md](board/no-city-mode-without-a-city.md)
- **A free claim instead of a held ring** — the city's content names no ring and the settle holds the city's tile alone, one inhabitant on it, from no map argument and with no off-map corner case; the stand-in's settle sections hold six `PH_Claim` besides the settle, each claiming a tile the city may claim and bringing an inhabitant to work it; the e2e openers claim the six tiles around the city unless a spec asks for the bare city, and the culture threshold counts every tile held beyond the city's own. Doc-impact: `docs/CHRONICLE.md`, `docs/GLOSSARY.md`. [board/a-free-claim-instead-of-a-held-ring.md](board/a-free-claim-instead-of-a-held-ring.md)
- **The throwaway selection page** — the game boots on a page choosing a region, a schedule, a deck and a seed and feeding the chronicle its generated map and timeline; it is wholly replaced in v0.0.5, and the rules never learn the word scenario.
- **The nomadic age designed, number-less** — its page in `docs/`: how the age settles — the site chosen, the city keeping the terrain it lands on, water and mountain refused, one inhabitant working its tile — the starting collection of cards with few or no buildings, the units, the events, the capstone and the camp's reward.
- **The nomadic age implemented** — the real catalogue replaces the stand-ins with provisional numbers at last, a scout among the units, and the camp's reward a real card.
- **The biome rework** — a growth weight per biome, the spread growing per biome instead of per frontier, the city's first ring dealt as its own biome, and the bigger map.
- **The balance pass** — numbers measured on the real content, edits uncommitted until the user says they hold.
- **Close v0.0.4** — the changelog entry and the tag.
