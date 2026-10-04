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

- **The parked crumbs** — the camps' placement and capture raise their tile change through the door `src/rules/cards.ts` holds; one fixture test proves a card aimed at a unit counts the terrain its unit stands on; `WARRIOR`, `WORKER`, `HUNT` and `paidOnDeer` are each declared once, in `e2e/chronicle-screen.ts`; the launch warning's none-reached test asserts no warning stands after the press; no test asserts `SURVEY_NEED`; Nomadic's Gather reads played through a worker; `npm test` green and `e2e/pin.spec.ts` proves it. Doc-impact: `docs/ages/NOMADIC.md`. [board/parked-crumbs.md](board/parked-crumbs.md)
- **The tree's columns** — re-thinking either how the tree is put in columns, or how the tree is displayed in general: the skeleton's next column holds seven technologies, and seven plates need 776 units of the room's 672 at today's plate height, more once a goal wraps.
- **The field's climb** — Irrigation, Grinding stone and Bread, each technology with its achievement and every card it unlocks.
- **The wild's climb** — Bow and arrow, Fishing, Domestication, Clothmaking and Raft, each technology with its achievement and every card it unlocks.
- **The hearth's climb** — Pottery, Dyes and Bartering, and Granary, which needs Pottery, each technology with its achievement and every card it unlocks.
- **The sky's climb** — Burial rites, Calendar and Megalith, each technology with its achievement and every card it unlocks.
- **The collection scrolls** — the spec that proves the collection scrolls, its cards being the first to fill the room, and a drag that runs on fired inside the page, since Playwright's own mouse moves come too far apart to set a panel running.
