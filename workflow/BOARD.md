# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **Specs open on a fabricated save** — a spec loads a save it wrote and plays from the state it needs instead of settling through the screen and ending turns to reach it; every spec is reviewed on the way: opened on the state it needs, shortened, and deleted where it tests a remnant of the stand-in or a code path that no longer exists.
- **One catalogue** — every age's content in one catalogue, an age a slice of it, so a deck and its settle section hold cards of any age.
- **The campaign and its screen** — the meta's state as a pure module a chronicle's ending pays into, victory or defeat alike: the technology tree, each technology needing the ones before it and the age transitions among its nodes, influence, the collection, the civilization's deck, saved beside the chronicle; the ending screen reads what was paid; the campaign screen is the home, with the tree, the influence, Continue reading what the chronicle in progress holds, New chronicle, Collection, and the menu's Campaign entry; a launch over a chronicle with achievements reached raises a warning, since an abandoned chronicle pays nothing.
- **The launch screen** — age, region, civilization and deck, replacing the launch page; the address stays the developer's door.
- **The collection screen** — the collection with the copies owned, the deck and its settle section edited from it, the settle card that settles the city fixed in the section, a copy bought for influence.
- **The Stone Age** — the age page and its content, the age the Nomadic victory unlocks: its settle, land, units, cards and buildings, events, capstone and camps, and its achievements with the technologies they unlock, cards and settle cards among them; with it the achievement reading, a condition read on the chronicle after every change and recorded in it, folded into the campaign's seam once done.
- **Pin an achievement** — one achievement pinned on the campaign screen shows on the chronicle screen as a ledger: its goal in words, a count against its need where it has one, a check mark once reached, a cross mark once failed.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.

## Lines

- **A resumed chronicle's openings, proven** — a spec for a resumed chronicle that has ended, which opens on its ending screen, and one for a resumed chronicle waiting on a deal, whose deal's window rises once the capstone's window closes: a save and a reload must never dodge an event.
