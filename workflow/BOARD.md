# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **The balance pass** — the Stone Age's numbers, measured through the simulator and felt in play, the findings kept in [`BALANCE.md`](BALANCE.md) first among them; Domestication's goal, which a worker standing on one herd reaches, made a focus, Tanning's need of two herds inside the border weighed, Fishing's need of 50 food from coast and the Fishery's gain on the coast around it weighed, and Trapping, Irrigation, Pasture and Clay pit, four improvements of one price and one gain, weighed against one another; a trial of where military comes from: military taken off the Hearth's yield and flint giving it in place of production.

## Lines

- **The road cut** — no layer names its tile's movement cost or bridges a river edge: the two layer fields, the two map helpers that read them and the validator line on a layer's cost are gone, the fixture's three roads are gone and one plain improvement stands in their place, the tests on a layer's cost and on the bridge are gone, and the design pages describe a tile's movement cost as its terrain's. Doc-impact: `docs/MAP.md`, `docs/CHRONICLE.md`, `docs/GLOSSARY.md`. [board/road-cut.md](board/road-cut.md)
- **The siege's span cut** — the trial passed by turns ticking past its landing goes with the several-camp placement: the helper and the rules sentence, the camp placing narrowed to one camp, and the fixture siege re-authored to pass by something else.
- **The kill on a tile cut** — the helper killing the population working one tile goes with the fixture's answer and its tests; the content kills through the idle-first helper.
