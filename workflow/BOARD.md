# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The Stone Age** — the age page and its content, the age the Nomadic victory unlocks: its settle, land, units, cards and buildings, events, capstone and camps, and its achievements with the technologies they unlock, cards and settle cards among them; with it the warning a launch over a chronicle with achievements reached raises, since an abandoned chronicle pays nothing; and the spec that proves the collection scrolls, its cards being the first to fill the room, and a drag that runs on fired inside the page, since Playwright's own mouse moves come too far apart to set a panel running.
- **Pin an achievement** — one achievement pinned on the campaign screen shows on the chronicle screen as a ledger: its goal in words, a count against its need where it has one, a check mark once reached, a cross mark once failed.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.

## Lines

- **The last single reads join the reader** — the in-page reader `readNames` installs answers whether a name is shown, the reference its face carries, the colour it is filled and the reference of each name a face draws, and `shows`, `referenceOnFace`, `namedOn`, `fillOf` and `endTurnFill` of `e2e/chronicle-screen.ts` and `firstNamed` of `e2e/launch.spec.ts` hold no in-page reading of their own; in `e2e/browse.spec.ts`, `e2e/collection.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/deck-editing.spec.ts` and `e2e/launch.spec.ts`, reads of what the reader answers that stand at one moment — no gesture, `rested` or poll between them — are one question; and no assertion is removed or loosened. Doc-impact: none. [board/last-single-reads.md](board/last-single-reads.md)
