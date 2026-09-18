# The stage tree stands

**Line:** The stage tree stands — `apply` answers a tree of stages, the one stage type a change or a group over stages, the chronicle screen plays it through one walk in order, and every stage of today is sorted into a change or a group holding nothing, the play-out unchanged to the eye. Doc-impact: none.

**Spec:** `docs/DOGMAS.md` → _Code_, the four bullets "The game is one pure function", "The flow is a tree of stages", "A group is a name for why, over stages" and "A rules helper that changes the chronicle answers the changes it raised": `apply`'s two products, the change, the group and the closed sets `src/rules/stages.ts` holds. `BRANCH.md` → _The design_, for the change vocabulary by row and the group list. No sentence of any `docs/` page changes, and there is no player-facing sentence: nothing on screen reads differently.

**Doc-impact:** none — the Code bullets already state the tree, and `docs/CHRONICLE.md`'s one sentence on the ending screen rising "as the last stage plays out" stays true.

**Scope:**

In: the shape and the sorting, nothing of the grain. A stage is one of two kinds, a change or a group over stages, both carrying the chronicle they leave; a group's chronicle is its last child's, and an empty group's the one it was handed or left. `apply` answers the top level of the tree. Every stage of today is sorted by one rule: a stage that moves exactly one row of the chronicle becomes a change under the design's name; one that moves several rows, or is a step's name, becomes a group holding nothing under the design's name. The sorting, settled here:

| Today | Becomes |
| --- | --- |
| `enter`, `move`, `retiled`, `charted`, `laid`, `damaged` | change, same name and same carried tile or ends |
| `gained` | change `stock` |
| `discard`, `draw`, `shuffle` | change `discarded`, `drawn`, `shuffled` |
| `no-deal` | change `rolled` |
| `capture`, `victory` | change `ended` |
| `population-lost`, `runtime-error` | change, name kept |
| `played`, `refused`, `claim`, `strike`, `income`, `grow`, `turn`, `capstone`, `deal`, `answer`, `reward` | group holding nothing, same name |
| `attack` | group holding nothing, carrying `attacker` and `target` |
| `camp-capture` | group holding nothing, carrying `tile` |
| `assign` | group holding nothing, name kept |

`runtime-error` is a change though it moves no row: it is the one case of a helper called where the content should never have called it, the fact a landing answers in place of the change it could not make, and `raided` and `burned` answer it through `Landed` as they do today. The two closed sets in `src/rules/stages.ts` hold exactly the names this table raises and no other: a member nobody raises is a dead case in every switch, and the lines after this one add theirs as they raise them. Two names are interim on purpose: `population-lost` moves two rows and the next line splits it into `population` and `assigned`; `assign` is settled by the third line. `damaged` still covers a kill and `strike` is still one for every hazard; the next line regrains both, this one renames nothing there.

The walk: pre-order, a group a cue before its children. The screen offers a group to every part before its children; a part that plays it is awaited before the children are walked; a part that answers nothing for a group renders nothing for it. A leaf, a change or an empty group, commits its chronicle to the screen and is rendered by every part that answers nothing for it, as every stage is today. Every stage of this line is a leaf, so the screen behaves exactly as it does today; the walk's rule is written for the lines that fill the groups: the why plays first, the facts settle after, and a part answers a group or its children, never both. The `Part` contract says so where it says today that nothing means the scene renders at once. Tests read the stages through that same walk.

Out: every helper's grain (the next line), the cycle's groups and the fall on the first change (the third line), any content file, `src/rules/fixtures.ts`'s catalogue, and the `Landed` shape content closures answer through `unchanged`, `landedAs` and `followed`: it stays, its list typed to changes. The fall stays where it is: `resolved` still merges the fall into the first top-level stage whose chronicle leaves the population at nought. The screen's cut on the `capstone` stage stays: the capstone's landing changes are its siblings on the top level, as today.

**Traps:**

- The end-turn button plays `turn`, the bar `income` and `grow`, the hand `discard`, `draw` and `refused`, the piles `discard` and `shuffle`, the map `attack`, `move` and `enter`, the overlay any stage whose chronicle has ended or leaves a deal standing. After the renames each part must still answer the same stage under its new name and kind, or the play-out changes to the eye.
- The overlay's `play` answers a resolved promise for a stage that leaves deals standing, on purpose: it pre-empts the render the deal window would otherwise rise on before the play-out's tail. Keep it.
- The map's `staged` renders a stage itself when it panned and the motion had nothing to animate, because the scene renders only the stages the map answers nothing for. Under the cue rule that still holds for leaves.
- `charting` runs per stage and carries the snapshots forward from one to the next, dropping the units from them on the stage whose chronicle's turn differs from the one before. Per leaf it stays so; a group's chronicle must end up equal to its last child's charted chronicle, and an empty group is charted itself. On this line every stage is a leaf.
- `resolved` finds the fall by scanning the stages `stagesOf` answered for the first whose chronicle falls, and replaces that stage's chronicle with the fallen one, dropping the rest. On this line that scan reads the top level.
- The screen ends a play-out on the `capstone` stage found on the top level and plays the stages after it once the window closes; `outcome` reads the last top-level stage.
- A closed set is switched with no `default` in six UI switches and in `chartedOn`; the change set and the group set are switched apart, since the design lets a name sit in both (`turn`, from the third line on).
- `cause: 'capture'` in a chronicle's ending is a `DefeatCause`, not a stage name: it does not rename with the `capture` stage.
- Tests assert stage-name sequences in `chronicle.test.ts`, `enemies.test.ts`, `city.test.ts`, `schedule.test.ts`, `sight.test.ts`, `units.test.ts` and through `stagedBy` in `fixtures.ts`; `e2e/end-of-turn.spec.ts` reads `draw` and `shuffle`, `e2e/map.spec.ts` reads `move` and `deal` through `apply` in Node. Each assertion takes the table's names; none is weakened.
- `npm run e2e` is refused from a session; the specs run one at a time by name.

**Plan:**

1. `src/rules/stages.ts`: the two kinds, the two closed sets of the table, the `Landed` helpers typed to changes, and the one walk. Leaves `npm run check` failing everywhere a name is switched.
2. `src/rules/chronicle.ts`, `src/rules/schedule.ts`, `src/rules/enemies.ts`: every stage raised under its new kind and name, `charting` and the fall over the tree. Leaves `npm run check` passing on the rules and the rules tests failing on names.
3. The rules tests and `src/rules/fixtures.ts`'s `stagedBy`: the assertions on the table's names, read through the walk. Leaves `npm test` passing.
4. `src/ui/chronicle-scene.ts` and the six parts: the walk with the cue rule, every switch over the new sets. Leaves `npm run check` and `npm run lint` passing.
5. `e2e/end-of-turn.spec.ts`, `e2e/map.spec.ts`: the names they read. Leaves the three specs passing.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then `npx playwright test e2e/end-of-turn.spec.ts`, `npx playwright test e2e/map.spec.ts`, `npx playwright test e2e/play-out.spec.ts`, named in the report as the specs that walk the rewritten path.
