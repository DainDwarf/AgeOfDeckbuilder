# A unit card's population through one door

**Line:** **A unit card's population through one door** — `enters` in `src/rules/cards.ts` takes its population through `populationTaken` and holds no decrement of its own; the aim's blocks and the play's stages are unchanged. Doc-impact: none.

**Spec:**

`docs/CHRONICLE.md` → _Population_: "a unit card turns one idle population into a unit, and is refused when none is idle, or when it would be the city's last." And → _The cards_, **Unit**: "made of one idle population, never the city's last". These are the unit card's two rules, and they are the aim's blocks, unchanged by this line.

`docs/DOGMAS.md` → _Code_, "One choke point per invariant", and → _Architecture_, "an effect changes it only through the rules' named helpers, so an invariant stays behind one door": the invariant is the idle count never negative, and the door is the helper that takes one population, an idle one first and otherwise the last assigned tile's.

No sentence changes in any page; no player-facing sentence: nothing on screen changes.

**Doc-impact:** none — both pages already state both rules, and no page says which function moves the population row.

**Scope:**

In:

- The effect of `enters` takes its population through `populationTaken` and then enters the unit, the inline `population` change gone.
- The aim's `blocked` stays exactly as it is: `population` on the city's last, `idle` on none idle, `city` on the city's tile taken.

Out:

- `populationTaken` itself, `populationKilled`, the settle's population and growth: none changes.
- Any new test. The rule a player could state — a unit card takes one idle population and never one off a tile — is already asserted through the real play path in `src/rules/cards.test.ts`, "a unit card takes one idle population, and is refused while every one is assigned", which pins the assigned tiles unchanged after the play.

Corner cases decided here:

- On every chronicle the aim admits, the door raises the one `population` change and touches no tile: the play's stages read as they do today, and every test on their order holds unchanged.
- The effect reached on a chronicle with none idle is a path the aim refuses and no content composes; behind the door it unassigns a tile instead of taking the idle count negative, and that is the door's answer, not a rule of the unit card — no test is written on it.

**Traps:**

- `src/rules/schedule.ts` already imports from `src/rules/cards.ts`; the cards module importing `populationTaken` back makes a cycle. Where the three population helpers live — the door, the killed one, and the private one both go through — is the implementer's call; the growth helper in `src/rules/city.ts` is their nearest neighbour. Whatever moves, the two content modules and the fixture module import the door by name and follow it.
- `landedAs` ends the chronicle on a standing city left at no population; the door never gets there from a unit card, because the aim refuses the last population first, so no `ended` stage appears in a unit card's play.

**Plan:**

1. `src/rules/cards.ts`, and whichever module the door lands in — the effect through the door, the inline decrement gone, the imports resolved without a cycle. Leaves every population decrement in the rules going through one helper.
2. `BOARD.md` — the line deleted.

**Verify:**

- `npm run check`
- `npm test`
- `npm run lint`
- No Playwright spec: nothing on screen changes, and the play's stages read as before.
