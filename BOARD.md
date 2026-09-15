# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

---

- **The throwaway selection page** — the game boots on a page choosing the content, a region, a schedule, a deck and a seed and opening the chronicle on them; an address that names a deck opens the chronicle straight and any other opens the page; the rules never learn the word scenario. Doc-impact: `docs/INTERFACE.md`, `.claude/skills/run/SKILL.md`. [board/the-throwaway-selection-page.md](board/the-throwaway-selection-page.md)
- **The nomadic age designed, number-less** — its page in `docs/`: how the age settles — the site chosen, the city keeping the terrain it lands on, water and mountain refused, one inhabitant working its tile — the starting collection of cards with few or no buildings, the units, the events, the capstone and the camp's reward.
- **The nomadic age implemented** — the real catalogue replaces the stand-ins with provisional numbers at last, a scout among the units, and the camp's reward a real card.
- **The biome rework** — a growth weight per biome, the spread growing per biome instead of per frontier, the city's first ring dealt as its own biome, and the bigger map.
- **The balance pass** — numbers measured on the real content, edits uncommitted until the user says they hold.
- **Close v0.0.4** — the changelog entry and the tag.
