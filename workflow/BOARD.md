# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The launch screen** — age, region, civilization and deck, replacing the launch page; the address stays the developer's door.
- **The collection screen** — the collection with the copies owned, the deck and its settle section edited from it, the city section's card shown at the head of the settle section, a copy bought for influence.
- **The Stone Age** — the age page and its content, the age the Nomadic victory unlocks: its settle, land, units, cards and buildings, events, capstone and camps, and its achievements with the technologies they unlock, cards and settle cards among them; with it the achievement reading, a condition read on the chronicle after every change and recorded in it, folded into the campaign's seam once done, and the warning a launch over a chronicle with achievements reached raises, since an abandoned chronicle pays nothing.
- **Pin an achievement** — one achievement pinned on the campaign screen shows on the chronicle screen as a ledger: its goal in words, a count against its need where it has one, a check mark once reached, a cross mark once failed.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.

## Lines

- **The campaign screen** — the bare address boots on the campaign screen, on the save's campaign or a new one; the campaign screen and the launch page wear the navbar — the game's name, Campaign and Chronicle, the screen standing sunk in a well — and the bar reading the influence; Chronicle opens the launch page, the back key there opens the campaign screen; the menu lists Campaign over a chronicle and its ending screen and no New chronicle, and Campaign leaves the chronicle standing in its save; `e2e/campaign.spec.ts` passes. Doc-impact: `docs/META.md`, `docs/INTERFACE.md`. [board/campaign-screen.md](board/campaign-screen.md)
- **The campaign's tree** — every achievement on the campaign screen with its condition and its technology, in three states — its technology unlocked, within the next chronicle's reach, waiting on a technology before it — on a surface that pans and zooms as the map does, by drag, wheel and keys.
- **The address loses its doors** — remove the developer's doors of deck, age, region and seed on the address: the specs that open through them open on a planted save, one test launches through the meta's screens, and the `ui-check` agent and the `run` skill follow.
- **The ending pays** — a chronicle is launched on the campaign's deck, its ending pays into the campaign once and the save keeps it, a chronicle that has paid leaves the save, and the ending screen reads the influence and the achievements under the outcome; the launch page loses its deck row.
- **Conditions read on the charted chronicle** — the capstone's and the achievements' conditions are read before the charting, so a condition on what the chronicle has charted reads one command late; swap the two passes.
- **Warn when the game cannot save** — the game should warn the user when it cannot save, as when the browser's storage refuses a write.
