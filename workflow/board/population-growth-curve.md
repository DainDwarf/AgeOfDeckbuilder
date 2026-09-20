# The population growth curve

**Line:** **The population growth curve** — the growth threshold is twice the population and the units of the player's on the map counted together, `docs/CHRONICLE.md` says so and one rules test holds it on the fixture.

**Spec:** `docs/CHRONICLE.md` → _Population_, the second paragraph. The sentence "The growth threshold widens with the population, so each population is dearer than the one before." is replaced by:

> The growth threshold is **twice** the population and the units of the player's on the map counted together 🔧, so each population is dearer than the one before. The population alone was rejected: a city that fields units would grow at a smaller city's price.

The rest of the paragraph stands as it is. `docs/GLOSSARY.md`'s **growth threshold** row, "The food the next population costs.", already holds and is not touched. No player-facing sentence changes: the resource bar's food reading and the food tooltip already read the threshold from the rules and name no number.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:** In: the sentence above; the rules' growth threshold reads twice the sum of the population and the units of the player's on the map, whatever kind, whatever they were entered by; the rules tests on growth keep asserting on the fixture's own numbers, recomputed for the new threshold, the one titled on "one food more" now asserting the step of two; one test that a unit of the player's standing on the map counts toward the threshold and an enemy's does not. Out: the factor's value beyond this provisional two — the balance pass tunes it on real play; Departure's culture cost, which reads the population alone and is content; the resource bar's population reading, idle over the population, which stays the city's inhabitants; production's drain and every other economy question. Corner cases decided here: the settle worker and scout count although they took no population — every unit of the player's on the map counts; the threshold is read at the growth phase on the units standing then, so a unit killed in the enemy phase lowers the threshold read at the next turn's growth and a unit entered in play raises it the same turn; the last population's threshold is never reached in a chronicle that has ended, and no floor is added.

**Traps:** `NO_GROWTH` in `src/rules/fixtures.ts` keeps growth out of reach by a population of 99; at twice, the threshold stands at 198 and more, further out of reach, and the fixture stays as it is. The growth tests in `src/rules/city.test.ts` seed exact food stocks against exact populations, so every one of them changes number; a test is recomputed, never weakened, and `heldBy(..., 'grow')`'s group shape is what several assert. The docblock on the rules' threshold function retells today's formula; the formula now lives in `docs/CHRONICLE.md`, so the docblock is deleted or cut to a trap it can name, and a rewrite that paraphrases the new formula is the defect the comment hook exists for. `src/ui/resource-bar.ts` and `e2e/play-out.spec.ts` read the threshold through the rules' exported function and need no edit; the reading painted over the food stock changes value only. Growth runs before income and before the enemy phase, so the units counted are those standing at the end of play.

**Plan:**

1. `docs/CHRONICLE.md`: the sentence under _Spec_, verbatim; `npm run lint` green on the markdown.
2. `src/rules/city.ts`: the growth threshold reads twice the population and the player's units together; its comment states a trap or goes.
3. `src/rules/city.test.ts`: the growth tests' numbers recomputed on the fixture; the "one food more" test asserts the step of two; one test that a unit of the player's counts and an enemy's does not; `npm test` green.
4. The board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; `npx playwright test e2e/play-out.spec.ts`, the spec that paints the food stock over the growth threshold.
