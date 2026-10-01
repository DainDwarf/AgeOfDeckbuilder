# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The Stone Age's technologies** — the age's technology tree and every card it unlocks, buildings, improvements, units and settle cards among them, each technology with its achievement, cut from the pool in [board/stone-age-pool.md](board/stone-age-pool.md); with it one achievement pinned on the campaign screen showing on the chronicle screen as a ledger: its goal in words, a count against its need where it has one, a check mark once reached, a cross mark once failed; the warning a launch over a chronicle with achievements reached raises, since an abandoned chronicle pays nothing; and the spec that proves the collection scrolls, its cards being the first to fill the room, and a drag that runs on fired inside the page, since Playwright's own mouse moves come too far apart to set a panel running.
- **The Stone Age's schedule** — the age's own events, its capstone and its victory with the technology it earns, on a chronicle longer than the Nomadic one, hard to impossible on the deck the age opens with and beatable once its tree is climbed; with it the ending's scaled pay.
- **New enemies** — the enemy units the Stone Age adds, the scripts they follow and the camps they enter from.
- **Neutrals and sites** — the neutral faction, and the sites that belong to no faction and pay a reward once.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.
- **The balance pass** — the Stone Age's numbers, measured through the simulator and felt in play.

## Lines

- **The Stone Age's region** — the Stone Age owns a temperate region of its own, written whole in its module: a disc of radius 12, six camps no nearer the centre than 7 and 4 apart, the centre part reaching 3, and the Nomadic composition otherwise; the catalogue's coherence test passes and `docs/ages/STONE.md` opens with the land. Doc-impact: `docs/ages/STONE.md`, `docs/index.md`. [board/stone-age-region.md](board/stone-age-region.md)
- **A biome keeps away from the kinds it names** — a biome kind may name kinds it keeps away from, and takes, of the origins already scattered, the one furthest from every origin of those kinds; it draws nothing, so a region naming none deals the maps it deals today; one test on the fixture.
- **The desert** — the Stone Age's temperate region deals one desert biome beside its two woodlands, spreading as the land does and keeping away from the seas: its tile gives nothing, walks and sees as plain does and gives food along a river; the oasis, a feature on it, gives food and is dealt as rarely as the others; the city, the camps and the Shelter do not stand on it; it is painted a pale sand of its own, `0xd6c08a`.
