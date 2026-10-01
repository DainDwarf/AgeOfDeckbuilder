# The collection screen lays a mode at a time

**Line:** The collection screen lays a mode at a time — each mode of the collection screen is laid by a function of its own, at module level, and the scene, the catalogue and what the faces answer with travel as one value, built one way by the collection screen and the launch screen, through every function that lays a piece of either. Doc-impact: none.

**Spec:** `docs/META-SCREENS.md`, _The collection screen_ and _The launch screen_, as they stand: nothing the player sees changes. No sentence changes. No player-facing text.

**Doc-impact:** none — the line is the code's shape.

**Scope:**

- In: each of the three modes is laid by a function of its own, at module level, and the screen's lay is what takes the last mode down and calls the next.
- In: what every piece of the screen is handed today one argument at a time — the scene, the catalogue, what its faces answer with — travels as one value, through every function that lays a piece of the collection screen and through the civilization's pile the launch screen shares. The collection screen and the launch screen build that value one way; today one goes through the shared helper and the other assembles it by hand.
- In: the hand-back reports, by Biome's count, the lines and the positional parameters of each function the Traps measure, before and after. It is a report: no number is a cap, nothing is added to `biome.json`, and a function left long because cutting it would slice it at a line is named as left, with why.
- Out: any visible change; any name a spec reads; the launch screen's own `create`; every file of `src/ui/` the value does not pass through.
- Corner: a function is cut on what a thing is — a mode, a head, a section — never at a line to make it shorter. The three modes' panel blocks look alike and stay three unless they are the same for one cause (`DOGMAS.md`, _Code_: never factor on resemblance).

**Traps:**

- Measured today by Biome (`npx biome lint --only=complexity/noExcessiveLinesPerFunction --only=complexity/useMaxParams --diagnostic-level=info src/ui`, at its defaults of 50 lines and 4 parameters, which is how the report measures after): the screen's `create` 272 lines and its `lay` 229 (`src/ui/collection-screen.ts:255`, `:304`), `civilizationPanelOf` 77 (`src/ui/deck-panel.ts:316`); parameters, `collectionOf` 8 (`collection-screen.ts:124`), `createPile` 7 (`src/ui/civilization-pile.ts:45`), `civilizationsOf` 6 (`collection-screen.ts:185`), `rowOf` 6 (`deck-panel.ts:84`), `pilesOf` 6 (`src/ui/launch-screen.ts:209`), and 5 each for `sectionOf`, `deckPanelOf`, its `row` closure and `civilizationPanelOf` (`deck-panel.ts:147`, `:210`, `:250`, `:316`) and `inspectingUnder` (`src/ui/browse.ts:345`).
- Biome counts a function's lines with every function nested in it: `create` reads 272 because `lay` is a closure inside it. A mode's function at module level is handed what it closes over today — the surface, what the faces answer with, the screen's container, `edit`, `lay`, the browse, the influence's reading. That is the value that travels.
- `edit` and `lay` call each other (`collection-screen.ts:295-301`, `:304`), and a mode's presses call both; a mode's function is handed them.
- `Surface` (`src/ui/panel.ts:165-170`) is the panel's four things and `Browser` extends it (`src/ui/browse.ts:156`); whether the value that travels extends it too is the implementer's.
- A scene reads the catalogue in its own methods only, and every other function receives it as an argument (`DOGMAS.md`, _Stack_): the value carries the catalogue from the scene's method, and no module-level function imports `src/content/`.
- The launch screen assembles what its faces answer with by hand (`src/ui/launch-screen.ts:254-260`); the collection screen goes through `inspectingUnder` with a `rising` that holds its panels still (`collection-screen.ts:270-276`). The launch screen holds no panel, so its `rising` does nothing.
- `createPile` is called from the collection screen (`collection-screen.ts:203`) and the launch screen (`launch-screen.ts:219`); both callers move with its signature.
- `noImportCycles` is an error, types counted (`biome.json`): a type the pieces share lives where no cycle forms.
- The specs read every panel, stack, row, pile and button by name (`e2e/collection.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/launch.spec.ts`); every name stays.

**Plan:**

1. `src/ui/collection-screen.ts`, `src/ui/deck-panel.ts`, `src/ui/civilization-pile.ts`, `src/ui/collection-stack.ts`, `src/ui/launch-screen.ts`, `src/ui/browse.ts`: the one value built one way by both screens, and every signature it passes through shortened to it. Leaves standing: the same screens, their pieces handed one value where they were handed three.
2. `src/ui/collection-screen.ts`, `src/ui/deck-panel.ts`: each mode laid by its own function at module level, and what else is cut on what it lays. Leaves standing: the same screens, the screen's lay a short walk from one mode to the next.
3. `workflow/BRANCH.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/deck-editing.spec.ts`, which walks the modes, the panels laid again where they stood, the carry and the rows. CI's on the push: `collection.spec.ts`, `civilization-mode.spec.ts`, `launch.spec.ts`, `browse.spec.ts`, `campaign.spec.ts`, `hover.spec.ts`.
