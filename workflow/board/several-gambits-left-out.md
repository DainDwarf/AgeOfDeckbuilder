# Several gambits left out

**Line:** **Several gambits left out** — `--without` takes several gambit numbers, so an ablation leaves a set of gambits out of the persona's walk in one cell; today it takes one, and the warlord's two marching gambits cannot be left out together. Done when `npm run sim -- --persona warlord --without 23,24` plays a cell whose walk holds neither gambit and whose first line records `"without":[23,24]`, the sim tests holding the list, and `docs/SIMULATOR.md` saying so.

**Spec:** `docs/SIMULATOR.md` → _The cell, the row, the query_, two sentences changed:

- In the record sentence, "the gambit left out where one is" becomes "the gambits left out where any is, in the order named".
- "an **ablation** one cell per gambit left out of the persona's walk" becomes "an **ablation** one cell per gambit, or set of gambits, left out of the persona's walk".

The harness says the same in its own words:

- `CLAUDE.md` → _Commands_, the `npm run sim` row: "`--without <n>` leaves the persona's gambit of that number out of its walk" becomes "`--without <n>[,<n>...]` leaves the persona's gambits of those numbers out of its walk".
- `.claude/skills/sim/SKILL.md` → _Procedure_ step 1: "`--without <n>` leaves the persona's gambit of that number out of its walk, the number as `--personas` prints it" becomes "`--without <n>[,<n>...]` leaves the persona's gambits of those numbers out of its walk, each number as `--personas` prints it".
- The usage text in `tools/sim-body.ts`: `[--without <n>]` becomes `[--without <n>[,<n>...]]`.

Refusals, the player-facing sentences:

- A list item that is not a gambit number is refused with today's wording, naming that item: `--without is not a whole number from 1 to <count>: <item>`, followed by the usage.
- A number named twice: `--without names <n> twice`, the wording `--off` uses for a switch named twice.

**Doc-impact:** `docs/SIMULATOR.md`; and outside `docs/`, the `CLAUDE.md` commands row and the sim skill's step 1.

**Scope:**

- In: `--without` reads a comma list, the same format as `--off`. One number is a list of one. Each number is checked against the persona's gambit count. The walk leaves out every gambit named. The cell's first line always records `without` as an array, in the order named, `"without":[2]` for one gambit. As today, the field is dropped from the JSON when the flag is not set. The trace reads the same cell and plays the same walk.
- Out: ranges (`3-5`) and repeating the flag (`--without 3 --without 5`). Nothing changes in the sim skill's ablation loop: a value such as `23,24` passes through it as one string and names its folder.
- Corner cases decided: leaving out every gambit, or the end-the-turn gambit, is allowed and stops `stuck`, as `--without 3` on the idle does today. There is no guard. An empty item (`23,` or `,23`) is not a whole number and is refused by the item wording. The order named is kept in the record and never sorted, as `--off` keeps its order.
- Old files carry `"without":2`. No reader of the record exists in the tree, and measurements are never committed, so nothing needs to read the old shape.
- Reconcile: `--off`'s comma list is the standing likeness. The projected flag takes the same format, the same split on commas and the same "named twice" refusal, and the item's check is what differs (a switch name against a gambit number). Whether one reader in `tools/flags.ts` serves both, with the item check as its parameter, is the implementer's call. The user cannot tell the two apart.

**Traps:**

- Two existing tests in `tools/sim.test.ts` assert the record's bare number: the gambit-left-out test (`without: 2`) and the goal test (`without: 1`). Both become arrays. The out-of-range test matches the `from 1 to <count>: ` wording, which stays.
- `recordOf` relies on `JSON.stringify` dropping `undefined`. The field must stay `undefined`, never `[]`, when the flag is not set, so a cell without the flag keeps its record line unchanged.

**Plan:**

1. `tools/sim-body.ts` (and `tools/flags.ts` if a shared list reader lands there): the flag reads the list, the cell holds the numbers, the walk leaves them all out, and the record writes the array. The usage text changes. This leaves the tool working with the old tests' record expectations updated.
2. `tools/sim.test.ts`: the two record expectations become arrays. One new test leaves several gambits out on the fixture, with an outcome that differs from leaving out either one alone, and the record carries the numbers in the order named. The refusal test grows a number named twice and an empty item.
3. `docs/SIMULATOR.md`, `CLAUDE.md` and `.claude/skills/sim/SKILL.md`: the sentences above.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then `npm run sim -- --persona warlord --without 23,24 --seeds 1 --turns 1`, whose first line carries `"without":[23,24]`. No proof spec: the line touches no `src/ui/` and no `e2e/`. CI runs the whole e2e suite on the push. No spec is expected to move.
