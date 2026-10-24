# A building's upkeep

**Line:** **A building's upkeep** — each building declares the upkeep it takes, and at income every city pays, out of what its tiles' yields left, what the buildings on the tiles it holds declare, a shortfall paid in population as a strike's is; the building's card in the infopanel reads the line, and the bar's production reckoning nets it. Doc-impact: `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/GLOSSARY.md`.

**Spec:** the sentences below are the design, written out; the implementer lands them verbatim.

`docs/CHRONICLE.md`, _The turn_, step 5, replacing the whole step:

> **Income.** Standing things do their standing thing: assigned tiles and their buildings yield their resources, and then each city pays its upkeep out of what the yields left. So what the player sees when drawing holds for the whole turn: a building built this turn yields, and is kept, from the next.

`docs/CHRONICLE.md`, _The city_, the first paragraph replaced whole:

> A city holds a **stock** of each resource: income adds to them, and every cost and the upkeep are paid out of them. A stock never stands below nothing: what is taken from it past nothing, by a harm or by the upkeep, the city pays in population, one for each stock taken past nothing, however far past, the player's city's last no exception. A cost is paid or refused, never taken: a card or an answer a city cannot pay for is refused, so what reaches a city's population is what is done to it and what it keeps.

`docs/CHRONICLE.md`, _The city_, a new paragraph after that one:

> A city pays **upkeep** at income for what it keeps: what each building on a tile it holds declares as its upkeep, taken as one sum once its tiles have yielded. Which buildings take upkeep and what each takes is content.

`docs/GLOSSARY.md`: a new row, placed after **income**; and the word `upkeep` struck from the Not column of **income** and of **hazard**:

> | **upkeep** | What a city pays each turn, at income, for what it keeps. | maintenance, running cost, tax |

`docs/CHRONICLE-SCREEN.md`, _The veils and the infopanel_, the sentence "A building that gives to the tiles beside it carries one line under its row saying so, and its row reads what it gives the tile it stands on; …" gains, after its semicolon-joined clause about the terrain card's row, this sentence:

> A building that takes upkeep carries one line under its row reading it, the word and what it takes as a chip, after the beside line where it carries both.

Player-facing text, one entry in `src/ui/text.ts`: `panel.upkeep` reading `Upkeep`. The chip reads the amount signed as a reckoning does, `−1`, in the resource's own colour; nothing else is authored.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/GLOSSARY.md`. The age pages name no number and stay; `docs/SIMULATOR.md` stays, the simulator reading the stocks as ever.

**Scope:**

- In: the declaration on a building kind, in the shape of its yield (a partial of the resources, what it takes each turn); the take at income, per city, player's then neutral's as income already runs, after that city's tiles have yielded, one sum over the buildings on the tiles it holds; the shortfall paid as a strike's take past nothing is, one population per stock taken past nothing, the player's city falling on its last; the content: `farm`, `tannery`, `fishery`, `megalith`, `foundations`, `great-stones` and `monument` each declare one production, every other building of both ages none, the Nomadic shelter included since building it ends the age; the infopanel line on the building card and on the card a building's name rests into; the coherence check reading every building's upkeep; one rules test on the fixture.
- Out: a count-capping rule, any rule naming which buildings pay (the declaration decides), the yield overlay (it glyphs yields, and the upkeep is none), the hand card's rules text (a building's name on it rests into the card that reads the line), the personas' and the neutral's guard (the next line), the economy baseline rerun (waits for that line, or every rerun shows cities falling to an unguarded persona), a simulator switch for the upkeep.
- Corner cases decided: a building on an occupied tile still pays, the occupation taking the yield and a pillage being what ends an upkeep; a building built this turn pays at this turn's income with its first yield; the monument's three stages are one building in one slot, each stage declaring its own upkeep; a camp an answer places or the enemies' capture leaves in the neutral's slot declares none; a site on a tile the player holds declares none; the neutral pays by the same rule, its population taken as `populationTaken` takes it for a city that is not the player's, and a neutral with no population pays nothing; a declared amount not above nought is a defect of the content, refused when the catalogue is built.
- The reconcile: a strike's take past nothing and the upkeep's become one helper, the city it hits as the parameter, so one rule pays both shortfalls; the row's line under it becomes lines, the beside line first and the upkeep line after; the bar's reckoning goes through the standing one unchanged.

**Traps:**

- `shocked` in `src/rules/cards.ts` takes from the player's city alone and names `'player'` to `populationTaken`; the reconcile makes it take the city. Every strike in both content modules and the fixture calls it.
- The resource bar claims every stage under the `income` group and rises once to the group's chronicle (`src/ui/resource-bar.ts`), so a `population` change and a `fall` inside income are played by nothing but the ending screen's `ended`; the map, the hand and the piles switch over every change name and play nothing on `population` or `stock`. `followed` resolves nothing after an ending, as a strike's fall already relies on.
- `reckoned` in `src/rules/chronicle.ts` sums the `uncovered` of every `population` change among the strikes' stages, which include the income group, so the bar paints an upkeep taken past nothing in the taken colour with no change; `e2e/end-of-turn-reading.spec.ts` reads its oracle from `reckoned` and moves with it.
- `tools/builder.ts` gambit 26 calls the rules' income step and reads the stocks it leaves; keep that call compiling, and its reading now nets the upkeep, which is the next line's concern, not this one's.
- The catalogue test (`src/content/catalogue.test.ts`) reads every building id through the screen's lookups; the upkeep is one lookup more, and the coherence rejection vocabulary is `refuse` in `src/rules/map-kinds.ts`.
- The fixture's `TILLAGE` and `SILO` (`src/rules/fixtures.ts`) stand under many tests whose numbers must not move; the mechanism's test declares its upkeep on the fixture content without moving a standing number.
- The infopanel's chip is a rectangle turned 45°, never a polygon: the trap over `yieldMark` in `src/ui/map.ts`. The row's lines are laid out with `rowTop` advancing by the line and `0.35 em`; the card's height is fixed (`CARD_HEIGHT`), and the Fishery's card with two lines under its row is the tallest a building card gets, shot fitting at <https://claude.ai/artifact/7WTvLqrhiP8WK5T1wNf4wb>. `docs/PHASER.md` for anything the spec waits on.
- A building's name resting (`createThingCard`) builds the same face as the inspection, so the line lands on both from one place.

**Plan:**

1. `src/rules/map-kinds.ts`, `src/content/stone.ts`, `src/content/nomadic.ts`, `src/rules/fixtures.ts`, `src/content/catalogue.test.ts`: the declaration on a building kind, the content declaring it, the fixture declaring it for its test, the coherence check reading it and refusing an amount not above nought. Leaves the catalogue building with the content validated and nothing yet paying.
2. `src/rules/cards.ts`, `src/rules/city.ts`, their tests: the take past nothing reshaped to take the city; the upkeep taken at income after the city's tiles yield, inside the income group, for the player's city and the neutral's. Leaves the rules paying it, the reckoning reading it, and one test on the fixture: the stock taken after the tiles yield, a shortfall taking one population, the neutral's paid too.
3. `src/ui/infopanel.ts`, `src/ui/text.ts`: the line under the building's row, after the beside line. Leaves the screen reading it.
4. `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/CHRONICLE-SCREEN.md`: the sentences above, verbatim; the board line deleted.
5. `e2e/inspect.spec.ts`: one test, a building declaring upkeep built on a claimed tile beside the city through the rules and the tile inspected, the card reading the line and the chip's amount from the catalogue's declaration.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/inspect.spec.ts`.
- CI's on the push, never run here: `e2e/end-of-turn-reading.spec.ts`, `e2e/reference.spec.ts`, `e2e/hover.spec.ts`, `e2e/neutral.spec.ts`, `e2e/capstone.spec.ts`, `e2e/city-mode.spec.ts`.
