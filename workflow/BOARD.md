# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The Stone Age's schedule** — the age's own events, its capstone and its victory with the technology it earns, on a chronicle longer than the Nomadic one, hard to impossible on the deck the age opens with and beatable once its tree is climbed; with it the ending's scaled pay, a Nomadic chronicle replayed paying no influence, the Nomadic Age being the tutorial.
- **New enemies** — the enemy units the Stone Age adds, the scripts they follow and the camps they enter from.
- **Neutrals and sites** — the neutral faction, and the sites that belong to no faction and pay a reward once.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.
- **The balance pass** — the Stone Age's numbers, measured through the simulator and felt in play.

## Lines

- **Irrigation** — the field's technology that needs Agriculture and Herbalism, with its achievement and every card it unlocks; with it the four doors re-declared in the order the tree stands them in, Herbalism first.
- **Bread** — the field's technology that needs Irrigation, with its achievement and every card it unlocks, if it is kept.
- **Domestication** — the wild's technology that needs Trapping and Agriculture, with its achievement and every card it unlocks.
- **Bow and arrow** — the wild's technology that needs Trapping, with its achievement and every card it unlocks.
- **Clothmaking** — the wild's technology that needs Domestication, with its achievement and every card it unlocks.
- **Fishing** — the wild's technology that needs Bow and arrow, with its achievement and every card it unlocks.
- **Raft** — the wild's technology that needs Fishing, with its achievement and every card it unlocks.
- **Pottery** — the hearth's technology that needs Fire, with its achievement and every card it unlocks, if it is kept.
- **Bartering** — the hearth's technology that needs Clothmaking and Bread, with its achievement and every card it unlocks.
- **Burial rites** — the sky's technology that needs Herbalism, with its achievement and every card it unlocks, if it is kept.
- **Calendar** — the sky's technology that needs Irrigation and Burial rites, with its achievement and every card it unlocks.
- **Megalith** — the sky's technology that needs Calendar, with its achievement and every card it unlocks, if it is kept.
- **The collection scrolls** — the spec that proves the collection scrolls, its cards being the first to fill the room, and a drag that runs on fired inside the page, since Playwright's own mouse moves come too far apart to set a panel running.
