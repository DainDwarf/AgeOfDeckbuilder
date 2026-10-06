# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The Stone Age's schedule** — the age's own events, its capstone and its victory with the technology it earns, on a chronicle longer than the Nomadic one, hard to impossible on the deck the age opens with and beatable once its tree is climbed; with it the ending's scaled pay, a Nomadic chronicle replayed paying no influence, the Nomadic Age being the tutorial.
- **New enemies** — the enemy units the Stone Age adds, the scripts they follow and the camps they enter from; with them how an enemy's attack over a range reads sight, an enemy that attacks a unit it would not see being ruled out; and rafts for the enemies, which go on no water until then: with them a raid through a camp the ground does not link to the city crosses the water, where until then it jumps it and enters on the city's ground nearest that camp, and a raid finds a door where every camp is captured and the city's island does not touch the map's edge.
- **Neutrals and sites** — the neutral faction, and the sites that belong to no faction and pay a reward once.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.
- **The balance pass** — the Stone Age's numbers, measured through the simulator and felt in play; Domestication's goal, which a worker standing on one herd reaches, made a focus, Tanning's need of two herds inside the border weighed, Fishing's need of 50 food from coast and the Fishery's gain on the coast around it weighed, and Trapping, Irrigation and Pasture, three improvements of one price and one gain, weighed against one another; and a trial of where military and culture come from: both taken off the Nomadic city's yield, flint giving military in place of production, and sites that pay culture once.

## Lines

- **Bread** — the technology Bread, its achievement and the card Bread stand in the Stone Age's content, the technology ahead of Tanning's; the catalogue's coherence test passes and `docs/ages/STONE.md` says so. Doc-impact: `docs/ages/STONE.md`. [board/bread.md](board/bread.md)
- **Bartering** — the hearth's technology that needs Tanning and Bread, with its achievement and every card it unlocks; the money the Tannery gives has no cost before it.
- **Burial rites** — the sky's technology that needs Herbalism, with its achievement and every card it unlocks, if it is kept: one of Burial rites and Pottery goes, a fifth plate in the tree's second column standing 56 over the room.
- **Calendar** — the sky's technology that needs Irrigation and Burial rites, with its achievement and every card it unlocks.
- **Pottery** — the hearth's technology that needs Fire, with its achievement and every card it unlocks, if it is kept: one of Pottery and Burial rites goes, a fifth plate in the tree's second column standing 56 over the room.
- **Megalith** — the sky's technology that needs Calendar, with its achievement and every card it unlocks, if it is kept.
- **A save forged at a campaign state** — a CLI that writes a save file holding a campaign with the technologies it is given learned, so a state need not be played to from scratch.
- **The collection scrolls** — the spec that proves the collection scrolls, its cards being the first to fill the room, and a drag that runs on fired inside the page, since Playwright's own mouse moves come too far apart to set a panel running.
