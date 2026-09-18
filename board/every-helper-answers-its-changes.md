# Every helper answers its changes

**Line:** Every helper answers its changes — every rules helper that changes the chronicle answers the changes it raised and every closure content composes them into does the same, the pairs that answer a bare chronicle beside a landing (`gained` and `stockGained`, `terraformed` and `terraformedOn`) become one helper each, and a card play and a hazard's strike group what their effect and their strike raised, one `strike` per hazard. Doc-impact: none.

**Spec:** `docs/DOGMAS.md` → _Code_, the three bullets "The flow is a tree of stages", "A group is a name for why, over stages" and "A rules helper that changes the chronicle answers the changes it raised". `BRANCH.md` → _The design_: the change vocabulary by row, `runtime-error` among them as the one change that moves no row, as the tree bullet of the dogmas says, and the group list's sentences on `played` and `strike` — "`played` over the card leaving the hand, `discarded` or `left`, then the cost as one `stock`, absent where the card is free, then the effect's changes; one `strike` per hazard in hand order, carrying the hazard's card, over what its strike raised". No sentence of any `docs/` page changes, and there is no player-facing sentence.

**Doc-impact:** none — the rule is the Code dogmas as they stand, the vocabulary lives in `src/rules/stages.ts` by the dogma's own pointer, and `docs/CHRONICLE.md`'s hazard sentence, "it strikes at the end of any turn it is still in the hand", stays true of one strike per hazard.

**Scope:**

This line lands on the shape `board/stage-tree-stands.md` leaves: a stage is a change or a group over stages, both carrying the chronicle they leave; the two closed sets; `Landed` as a list of changes with `unchanged`, `landedAs` and `followed`; the pre-order walk with its cue rule. The plan below is written against that dossier, not against the code as it stands before it ships.

In: every helper below answers `Landed`, the changes it raised in the order it made them and none where it moved nothing; every closure content composes them into does the same, so `Aim`'s effect and the hazard's `strikes` answer `Landed` as `Answer`'s and `Capstone`'s already do; the card play and the strike become the two groups. The grain, settled here:

| Helper | Answers |
| --- | --- |
| `entered` (the one way a unit enters) | `enter` on the tile; `campUnitEntered` is this with the camp's unit, and folds into it |
| `enters` (a unit card's aim) | `population`, then `enter` on the city's tile |
| `entersOn` (a settle card's unit) | `enter` on the tile |
| `throughWorker` | `action-spent` on the worker's tile, then the effect's changes |
| `settled` | `retiled`, `settled`, `held`, `population`, `assigned`, all on the city's tile, in that order |
| `built`, `improved` | `retiled` on the tile |
| `terraformed`, absorbing `terraformedOn` | `retiled`, then `killed` on the tile where the unit standing there cannot stand on the new terrain; nothing where the tile is left as it stands, the city's tile into a terrain its building does not stand on |
| `refreshed` | `refreshed` on the tile; nothing where its move points were already full |
| `recalled` | `recalled` |
| `gained`, absorbing `stockGained` | one `stock`; nothing where the gain is nought on every resource |
| `shocked` | one `stock`; nothing where the stock was already at nought |
| `yielded` | one `stock`; nothing where the tile yields nothing |
| `arrived` | `population` |
| `bordered` | `held` on the tile, then `assigned` on it where an idle population stands on it |
| `populationKilled` | `assigned` on the tile, then `population`; nothing where nobody works it |
| `populationTaken` | `assigned` on the last tile where none is idle, then `population`; nothing at no population |
| `unitDamaged` | `damaged` on the tile, or `killed` where the health falls to nought |
| `laid` | `laid` |
| `tileCharted` | `charted` on the tile |
| `featureDealt` | `retiled` on the tile |
| `besieged` | `retiled` per camp placed, then `enter` per camp, as today |
| `reinforced`, `enteredAround` | `enter` each |
| `raided`, `encamped`, `burned` | composed of the above; `runtime-error` where their contracts say so today |
| `struck` | one `strike` group per hazard in the hand, in hand order, each on the chronicle the one before left, carrying `card`, the hazard's id, over the changes its strike raised, and holding nothing where the strike moved nothing |
| the play | the `played` group, carrying nothing: `discarded` or `left` by `leavesChronicle`, then `stock` unless the card is free, then the effect's changes |

`population-lost` is gone, split as the table says. Whether the cost's `stock` is raised by `paid` answering `Landed` or by the play itself is the implementer's; so is which helper survives when two say the same thing, with one rule: the simpler name stays, `gained` and `terraformed`. The change set after this line: `enter`, `move`, `damaged`, `killed`, `refreshed`, `action-spent`, `retiled`, `charted`, `held`, `settled`, `stock`, `population`, `assigned`, `laid`, `drawn`, `discarded`, `recalled`, `shuffled`, `left`, `rolled`, `ended`, `runtime-error`. The group set is the stands line's, `strike` now carrying `card`.

Corner cases: a free card raises no `stock`; a settle card, a single-use card and a hazard raise `left` where the others raise `discarded`; a hazard played is `played` over `left` and its `stock`, its effect raising nothing; a hand holding no hazard raises no `strike` at all, and the end of turn stages every `strike` the hand raises, empty or not, where today it drops the step that changed nothing; a card whose effect moved nothing is `played` over its leaving and its cost; the settle's five changes sit under `played`, no group of the settle's own; `enters` on a city standing nowhere still refuses, a throw, as today. The stages `apply` answers stay in the order the design gives them: "none where it moved nothing" is judged on the row the helper moved — the stock by its amounts, the population by its count, a unit by its points and health — and `retiled` is raised whenever the helper relayers the tile.

Out: the cycle's helpers and the commands the third line groups — `income`, `grow`, `assign`, `reassign`, `claim`, `draw`, `discard`, `shuffle`, `rewarded`, `paid` under `answered` and `claim`, the move and the attack by hand, `enemyPhase`, `campsRolled`, `captures`, the tick, `events`. Where one of them calls a helper of the table, `income` calling `yielded`, it reads the chronicle off the landing and drops the change until the third line groups it: a transitional drop named here, not a defect to fix. The fall stays on the stands line's top-level scan, one level deeper: where the stage the scan finds is a group, `played` or `strike`, its children are cut at the first whose chronicle leaves the population at nought, the fall is set on that child, and the group closes on it, so the last leaf the screen commits is the fallen chronicle and the overlay rises on it as today. The third line takes the fall into the tree for every group; this is the design's rule applied to the two groups this line fills. No content file changes in what it does, only in how its closures compose. The e2e harness and the debug console read the stages through `apply` and the walk as the stands line leaves them.

**Traps:**

- The stands line is dossiered, not shipped, when this dossier is written. If it shipped a shape other than its dossier names — the `Landed` list, the walk, the sets — the report says so before anything is built on it.
- `resolved` finds the fall by scanning the top level for the first stage whose chronicle falls and replaces that stage's chronicle with the fallen one. Left so, a fall inside `played` or `strike` would mark the group and leave its children standing: the last leaf committed would show a standing city while `outcome` says ended, and the overlay, which rises on a stage whose chronicle has ended, would find none among the leaves. Hunger's strike taking the last population is the live case; the Scope says how the scan cuts the group's children.
- Two content closures drop a change today: `hunger` in `src/content/nomadic.ts` and `PH_Drought` in `src/rules/fixtures.ts` read `.chronicle` off `populationTaken`. They compose through `followed` after `shocked`; nothing else in content reads a landing's chronicle.
- `src/content/stand-in.ts`, `src/content/nomadic.ts` and `src/rules/fixtures.ts` nest helpers — `settled(catalogue, terraformed(...), at)`, `bordered(arrived(paid), at)`; each becomes a `followed` chain. `featureDealt`'s `at` and `besieged`'s `placed` ride on `Landed` and stay.
- `withUnits` in `src/rules/fixtures.ts` reads the chronicle off `entered` to author a unit's state: a fixture, allowed to.
- The hand and the piles answer today's `discard`, which the stands line renames `discarded`; under this line a card play raises one too. The hand's motion flies every slot to the discard pile and the piles' landing waits a block length read off the hand's count. Both generalise to the cards the chronicle no longer holds: the whole hand at the end of turn, the one card at a play. The hand's `letGo` slot is the one flying at a play; its render destroys the let-go card, which is why the card leaves before the cost — the first leaf's chronicle no longer holds it. `left` renders as today, the card gone.
- The map animates `enter` from `arrivals`, the units the chronicle draws live on tiles it shows none on; a unit played from a card now raises `enter` and grows onto its tile, on purpose. A settle unit played on turn 0 enters on a centre tile, which the map draws live on turn 0.
- Every switch over the closed sets — the six UI switches and `chartedOn` — must list the new names and lose `population-lost`; `strike` and `played` are groups, and a part that answers nothing for a group renders nothing for it.
- Tests assert stage-name sequences in `chronicle.test.ts`, `enemies.test.ts`, `city.test.ts`, `schedule.test.ts`, `sight.test.ts`, `units.test.ts` and `cards.test.ts`, and through `stagedBy` in `fixtures.ts`, which reads the top level: a play reads `['played']` there, and its children are read through the walk, as the stands line has tests read them. `cards.test.ts` imports `terraformedOn` and reads chronicles off `terraformed`, `gained` and the rest; each assertion takes the table's grain, none is weakened.
- `e2e/end-of-turn.spec.ts` reads `drawn` and `shuffled` at the top level; `e2e/map.spec.ts` reads `move` and `deal`. Neither changes here. Specs that assert after a card play wait on `playedOut`, and the play-out now holds more leaves and a flight to the discard pile: a spec that reads before it is a bug in the spec's wait, not a timeout to widen.
- Three parts answer a stage by its chronicle alone, and once a group holds stages they answer the group and then its children, which the `Part` contract forbids: a part plays a group or the stages it holds, never both. The overlay's `play` rises on any stage whose chronicle has ended, so on a `played` or `strike` closing on the fall it would raise the ending at the group's cue, before the children play. The map's `staged` renders the stage itself when it panned and had nothing to animate, so at a group's cue it would draw the group's last chronicle before the children. The resource bar tweens to the chronicle of `income` and `grow`, then renders the `stock` and `population` leaves under them as every part that answers nothing for a leaf does; it meets them filled on the third line only, but the rule is the same one. Each answers leaves only, or answers the group and nothing under it; which is the implementer's, per part, and the report names the choice.
- `cause: 'capture'` in a chronicle's ending is a `DefeatCause`, not a stage name.
- `npm run e2e` is refused from a session; the specs run one at a time by name.

**Plan:**

1. `src/rules/stages.ts`: the change set gains `killed`, `refreshed`, `action-spent`, `held`, `settled`, `population`, `assigned`, `recalled`, `left` and loses `population-lost`; `strike` carries `card`. Leaves `npm run check` failing on every switch and every helper.
2. `src/rules/catalogue.ts`: `Aim`'s effect and the hazard's `strikes` answer `Landed`, `entered` answers its change. `src/rules/cards.ts`, `src/rules/city.ts`, `src/rules/enemies.ts`, `src/rules/schedule.ts`: every helper of the table, the pairs merged, `population-lost` split. Leaves the helpers typed and their callers failing.
3. `src/rules/chronicle.ts`: the `played` group, one `strike` per hazard staged by the end of turn, the fall's scan cutting a fallen group's children as the Scope says, `chartedOn` over the new set, the cycle's callers reading the chronicle off the helpers they call. Leaves `npm run check` passing on the rules.
4. `src/content/nomadic.ts`, `src/content/stand-in.ts`, `src/rules/fixtures.ts`: every closure composing through `followed`, the two dropped changes among them. Leaves `npm run check` passing everywhere but the UI and the tests.
5. The rules tests: the assertions on the table's grain, and the new ones on the fixture — the `played` group's children on a free card, a costed card and a card that leaves the chronicle; the settle's five; one `strike` per hazard with its changes, holding nothing at a stock already at nought, and the population change a strike takes no longer dropped; the fall under a `strike` that takes the last population, the group closing on its fallen last child. Leaves `npm test` passing.
6. `src/ui/chronicle-scene.ts` and the six parts: the switches over the new set; the hand's and the piles' `discarded` motions generalised to the cards gone. Leaves `npm run check` and `npm run lint` passing.
7. The e2e specs named below, run one by one. Leaves them passing.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then `npx playwright test e2e/play-out.spec.ts`, `npx playwright test e2e/settle.spec.ts`, `npx playwright test e2e/harvest.spec.ts`, `npx playwright test e2e/building.spec.ts`, `npx playwright test e2e/worker-instants.spec.ts`, `npx playwright test e2e/recall.spec.ts`, `npx playwright test e2e/end-of-turn.spec.ts`, named in the report as the specs that walk a card play and the turn's discard.
