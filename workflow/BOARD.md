# Board

A shrinking list whose goal is zero, in two sections. **Rungs** are the version's deliverables, in order, each a title and one sentence: they land when the version opens, or through `/todo` on the user's order, and when a rung's turn comes `/intake` cuts it into lines and deletes it, the lines being its trace. **Lines** are one item each; **priority is order; completion is deletion.** A line reaches this file only through `/todo`, on the user's order, or a rung's cut, as a title and one sentence; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead. `/intake` then settles the line's design with the user and gives it a done-condition, machine-verifiable where possible, its doc-impact, and a dossier `board/<slug>.md` holding its contract — spec, scope, traps, plan — written once, on the settled state, and deleted with the line. A line with a dossier link is ready to ship; one without waits for intake. A line that cannot be completed is documentation — it moves to `docs/`.

Before intake: `- **Title** — what it is about.` After intake: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [dossier]`

## Rungs

- **Neutrals and sites** — the neutral faction, and the sites that belong to no faction and pay a reward once.
- **The Stone Age's schedule** — the age's own events, its capstone and its victory with the technology it earns, on a chronicle longer than the Nomadic one, hard to impossible on the deck the age opens with and beatable once its tree is climbed; with it the ending's scaled pay, a Nomadic chronicle replayed paying no influence, the Nomadic Age being the tutorial.
- **The headless simulator** — a consumer of the rules that runs only when asked and reports numbers, not diagnoses, tuned across the two ages; the reachability cache and the end of turn's cost per `apply` are looked at when it is made.
- **The balance pass** — the Stone Age's numbers, measured through the simulator and felt in play; Domestication's goal, which a worker standing on one herd reaches, made a focus, Tanning's need of two herds inside the border weighed, Fishing's need of 50 food from coast and the Fishery's gain on the coast around it weighed, and Trapping, Irrigation, Pasture and Clay pit, four improvements of one price and one gain, weighed against one another; and a trial of where military and culture come from: both taken off the Nomadic city's yield, flint giving military in place of production, and sites that pay culture once.

## Lines

- **Enemies cross the water** — a script's walk runs over ground and water, the enemy embarking where the ground ends and disembarking where it begins, each the last thing it does that turn, on the embarked move its age's camp names; with it the fog snapshot keeps the embarked flag, so a remembered embarked enemy is drawn on its hull.
- **A raid's door across the water** — a raid through a camp the ground does not link to the city enters on the camp's island and crosses from there, and the outer-ring door is the edge of any land the city is reached from over ground and water, so a raid finds a door with every camp captured on an inland island.
- **Archers at the camps** — the Stone camp names the kinds it enters with their weights, the archer among them, and its own odds, so the opening, the camp's roll and a raid draw among them.
- **The pillager** — a third script, a warrior that goes for the player's workers and for the improvements and the buildings, pillaging what it stands on; the pillage the chronicle page designs and the rules do not hold yet rides inside as its inert commit.
- **Camps that prepare** — a camp whose guards have gathered to the number its content names sends some of them off together as raiders or pillagers, so a raid out of a camp comes as a group and not one warrior at a time.
- **A console line enters a unit** — a debug console entry that reopens the chronicle screen on the chronicle with a unit entered through the rules' own helper, kind, tile, faction and script named, the way the seed entry relaunches; the specs keep planting their own.
