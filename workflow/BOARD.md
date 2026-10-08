# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **Neutrals and sites** — the neutral faction, and the sites that belong to no faction and pay a reward once.
- **The Stone Age's schedule** — the age's own events, its capstone and its victory with the technology it earns, on a chronicle longer than the Nomadic one, hard to impossible on the deck the age opens with and beatable once its tree is climbed; with it the ending's scaled pay, a Nomadic chronicle replayed paying no influence, the Nomadic Age being the tutorial.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.
- **The balance pass** — the Stone Age's numbers, measured through the simulator and felt in play; Domestication's goal, which a worker standing on one herd reaches, made a focus, Tanning's need of two herds inside the border weighed, Fishing's need of 50 food from coast and the Fishery's gain on the coast around it weighed, and Trapping, Irrigation, Pasture and Clay pit, four improvements of one price and one gain, weighed against one another; and a trial of where military and culture come from: both taken off the Nomadic city's yield, flint giving military in place of production, and sites that pay culture once.

## Lines

- **A camp's wave** — a camp whose guards ashore within the distance its content names are as many as it names sends as many as it names off together under one of its other scripts, drawn seeded by weight, at the enemy phase's start, the camp's holder leaving last; the Stone camp names a wave and the Nomadic one none, the rules hold it on a fixture test, and the chronicle, Stone and Nomadic pages say so. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/STONE.md`, `docs/ages/NOMADIC.md`. [board/a-camps-wave.md](board/a-camps-wave.md)
- **A console line enters a unit** — a debug console entry that reopens the chronicle screen on the chronicle with a unit entered through the rules' own helper, kind, tile, faction and script named, the way the seed entry relaunches; the specs keep planting their own.
- **The siege and the second script** — the capstone's second-script hook, which no content carries, leaves the rules and the chronicle page, and the siege fixture goes with it.
