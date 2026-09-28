# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The launch screen** — age, region and civilization, replacing the launch page; no seed is chosen, every launch drawing a fresh one.
- **The collection screen** — the collection with the copies owned, the deck and its settle section edited from it, the city section's card shown at the head of the settle section, a copy bought for influence.
- **The Stone Age** — the age page and its content, the age the Nomadic victory unlocks: its settle, land, units, cards and buildings, events, capstone and camps, and its achievements with the technologies they unlock, cards and settle cards among them; with it the achievement reading, a condition read on the chronicle after every change and recorded in it, folded into the campaign's seam once done, and the warning a launch over a chronicle with achievements reached raises, since an abandoned chronicle pays nothing.
- **Pin an achievement** — one achievement pinned on the campaign screen shows on the chronicle screen as a ledger: its goal in words, a count against its need where it has one, a check mark once reached, a cross mark once failed.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.

## Lines

- **Specs build the fresh campaign through freshCampaign** — `rg -n 'newCampaign\(CATALOGUE, firstsOf\(\)\.civilization\)' e2e` finds nothing and `rg -n 'freshCampaign\(CATALOGUE\)' e2e` finds eight sites; `npm run check` and `npm run lint` pass. Doc-impact: none. [board/specs-build-the-fresh-campaign-through-freshcampaign.md](board/specs-build-the-fresh-campaign-through-freshcampaign.md)
- **End chronicle on end screen** - Add an "End chronicle" button on the ending screens, that puts you back onto the meta.
