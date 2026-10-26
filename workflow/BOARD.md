# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The events pass** — are the events good: measured with everything back on; the rival band's answer both personas take and the player never, the Flood taking the village when nothing else stands, and a review of the Nomadic events among its questions.
- **The goals pass** — are the technologies' goals good: each checked for whether a player going for it reaches it, on which turn, and whether it asks more than a chronicle played as usual gives; Domestication's goal, which a worker standing on one herd reaches, first among them.

## Lines

- **The fighting gambits weighed** — both personas attack from as far as their range reaches, pull a hurt unit inside the border where a card in hand heals it, refresh and walk away a unit that has attacked where an enemy could reach it, a unit that has attacked walking nowhere else, and walk toward the ring from inside a deep border, measured on the cells [`CAMPS.md`](CAMPS.md) names with one set left out at a time. Done when both walks hold the range reading, the pull-back and heal pair, the refresh-and-withdraw pair with the holding-its-action rule, and the widened way home, each held by a test on the fixture, `docs/SIMULATOR.md`'s persona paragraphs say so, and the hand-back carries the six cells against the baseline with one row per set left out. Doc-impact: `docs/SIMULATOR.md`. [board/the-fighting-gambits-weighed.md](board/the-fighting-gambits-weighed.md)
- **The neutral helped** — the neutral gets a little help against the camps, a warrior standing at its opening first among the ways, measured on the pass's cells.
- **The camp roll retried** — the camps' entry rate and method retried on the pass's cells: the flat rate at several values, a rate rising with the turn, and a cooldown after a roll so two early rolls never land together.
