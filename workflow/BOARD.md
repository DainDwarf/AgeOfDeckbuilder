# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The stand-ins' doors** — the fixture content that opens a door no real content walks through — the recall, the road, the siege capstone with its second script and its span, and whatever else the search finds — reassessed one by one: the door kept for content the design foresees, or the mechanism and its fixture cut together.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.
- **The balance pass** — the Stone Age's numbers, measured through the simulator and felt in play; Domestication's goal, which a worker standing on one herd reaches, made a focus, Tanning's need of two herds inside the border weighed, Fishing's need of 50 food from coast and the Fishery's gain on the coast around it weighed, and Trapping, Irrigation, Pasture and Clay pit, four improvements of one price and one gain, weighed against one another; a trial of where military comes from: military taken off the Hearth's yield and flint giving it in place of production.

## Lines

- **The near draw** — one draw of the rules picks every tile an event or a strike places onto or takes near the player's city, weighted an eighth per tile from the nearest tile the player's city holds and never a tile the neutral holds; no rule reads the border or a span to pick such a tile, but for the camp's three-tile standoff and the flood's buildings; Abandon a herd refused by nothing and Make room while no tile takes a camp; the fixture tests hold the draw, the coherence test passes and `e2e/predators.spec.ts` proves the wolves taking a herd outside the border. Doc-impact: `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`. [board/near-draw.md](board/near-draw.md)
- **The long winter** — the first capstone: for a span the land outside the border gives nothing and hunger strikes every turn; what passes it is this line's question.
- **The monument** — the second capstone: a building raised through a worker, the age ending the moment it stands, as the Shelter does.
- **The siege** — the third capstone: raids every turn for a span, endured; the fixture's siege door walked by real content.
- **The victory** — the age's victory achievement and its technology, which unlocks the Bronze Age once that age exists and nothing until then; the technology's name is this line's question.
- **The archipelago's schedule** — the region's own schedule: what it copies from the temperate one, what is its own, and its capstones.
