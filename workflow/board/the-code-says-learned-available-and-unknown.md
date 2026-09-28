# The code says learned, available and unknown for a technology

**Line:** The code says learned, available and unknown for a technology — under `src/` and `e2e/` no identifier, comment, test title or refusal says unlocked, within reach, reachable, researched or mystery of a technology or of an achievement; a plate's state is `learned`, `available` or `unknown`; the grey of an unknown technology and of an age not reached is the look's unknown, the grey of Continue with no chronicle to open is the look's greyed; and `docs/META-SCREENS.md` draws neither the age nor Continue "as an unknown technology"; the screen reads as it did; `e2e/tree.spec.ts` proves it.

**Spec:** `docs/GLOSSARY.md`, the rows **learned technology**, **available technology** and **unknown technology**, with what each forbids; the rows **technology**, **age**, **campaign** and **civilization**, which say unlock of what a technology or the campaign gives. Two sentences of `docs/META-SCREENS.md`, _The launch screen_, change, each losing its comparison and nothing else:

- "An age the campaign has not reached is drawn as an unknown technology is: greyed, reading ??? alone, and answering no press." becomes "An age the campaign has not reached is greyed, reads ??? alone and answers no press."
- "While the save holds none, Continue stands greyed as an unknown technology does, reads its word alone and answers no press." becomes "While the save holds none, Continue stands greyed, reads its word alone and answers no press."

The names, settled with the user:

- the plate's states `'unlocked'`, `'within-reach'`, `'mystery'` become `'learned'`, `'available'`, `'unknown'`;
- the text keys `plate.unlocked` and `plate.mystery` become `plate.learned` and `plate.unknown`;
- the look's `mysteryFill` and `mysteryInk` become `unknownFill` and `unknownInk`, read by the plate of an unknown technology and by the segment of an age not reached;
- the look gains `greyedFill` and `greyedInk`, read by Continue with no chronicle to open, on the values the button wears today;
- the rules' check `withinReach` becomes `available`.

The two player-facing sentences, kept word for word: `'plate.learned': '✓ {technology}'` and `'plate.unknown': '???'`.

The two refusals that say it, reworded: "the achievement ${id} earns ${technology}, which is already unlocked" becomes "the achievement ${id} earns ${technology}, which is already learned". No other refusal moves.

**Doc-impact:** `docs/META-SCREENS.md`.

**Scope:**

- In: unlocked said of a technology — the parameters, locals and fields that hold the technologies learned in `src/rules/campaign.ts`, `src/rules/chronicle.ts`, `src/rules/save.ts`, `src/rules/fixtures.ts`, `src/ui/tree-layout.ts`, `src/ui/tree.ts` and their tests, the field `unlocked` of a link of the tree among them, and every comment and test title that says it. Each takes a name that says learned.
- In: within reach said of a technology, in `src/rules/campaign.ts`, `src/ui/tree-layout.ts`, `src/ui/tree.ts`, their tests and `e2e/tree.spec.ts`, the titles included.
- In: within reach and reachable said of an achievement — the helper `achievementsWithinReach` in `src/rules/chronicle.ts`, its comment, and the local `reachable` of `src/rules/chronicle.test.ts`'s launch test. They say the achievements of the available technologies; the names are the implementer's, holding no forbidden word.
- In: mystery — the plate's state, the two styles named `MYSTERY_STYLE`, the text key, the look's two entries, the locals and the returned field `mysteries` of `src/ui/launch-screen.ts`, and the comments that say it. An age not reached is said unknown.
- In: the test helper `researched` of `src/rules/catalogue.test.ts`; its name is the implementer's, holding no forbidden word.
- In: Continue's grey, in `src/ui/launch-screen.ts` and the two expectations of `e2e/continue.spec.ts`, reads the look's greyed.
- Out: unlock said of what a technology or the campaign gives, which the glossary says — the declaration `unlocks` of a technology, `unlockedBy` and `unlocker` in `src/rules/catalogue.ts`, the refusals "the age … is unlocked by …" and "the technology … unlocks …", the local set of ages in `agesReached`, and the titles "a new campaign unlocks nothing", "the cards the technology unlocks", "the technology that unlocks the next age".
- Out: `reachable` of `src/rules/units.ts`, of the tiles a unit can land on, and every site that names it; `agesReached` and "an age the campaign has reached"; reach and reached of an achievement a chronicle reaches.
- Out: `unknown`, the TypeScript type.
- Out: `CHANGELOG.md`, which a rename sweep skips.
- Corner, decided: the two greys hold the same values today and stay two roles of the look, as its own comment says of roles that agree.
- Corner, decided: the segment of an age not reached reads the text key `plate.unknown`, as it reads `plate.mystery` today; no entry of its own.

**Traps:**

- A plate's state is the closed union `PlateState`, switched in `src/ui/tree.ts`, and set on the plate's container as the data `state`, which `e2e/tree.spec.ts` reads as a string and compares with a literal: the union and the spec's literals change together, and the typecheck does not see the spec's.
- `available` is a bare word: `src/rules/chronicle.ts` and `src/ui/tree-layout.ts` import the check by name, and a local of that name in either shadows it.
- A save holds the technologies learned under `technologies` and no state word: nothing in the save format moves, and no save version changes.
- `src/ui/text.ts` is under the glossary lint hook; the two sentences kept hold no forbidden word.
- The refusal reworded is expected verbatim by `src/rules/campaign.test.ts`.
- `src/ui/tree-layout.test.ts` holds a helper `laid` and `layOutTree`: layout, not the lay of a card, and not this line's.
- Comments are for traps only: each docblock touched is shaved as it is reworded.

**Plan:**

1. `src/rules/` — the check carries its new name and every site says learned and available, in `campaign.ts`, `chronicle.ts`, `save.ts` and `fixtures.ts`, the refusal reworded; the tests follow, their titles and the helper of `catalogue.test.ts` included. `npm run check` and `npm test` pass.
2. `src/ui/look.ts` holds the unknown pair and the greyed pair; `src/ui/text.ts` holds the two keys under their new names.
3. `src/ui/tree-layout.ts` and `src/ui/tree.ts` carry the three states and say learned of a link; `src/ui/tree-layout.test.ts` follows, titles included.
4. `src/ui/launch-screen.ts` says unknown of an age not reached and reads the greyed pair for Continue.
5. `e2e/tree.spec.ts` and `e2e/continue.spec.ts` follow, titles included.
6. `docs/META-SCREENS.md` holds the two sentences as written above.
7. The searches of Verify match as said.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Under `src/` and `e2e/`, case-insensitive: `myster|within.?reach|researched` matches nothing; `\bunlocked\b` is read hit by hit, every hit left being of an age; `reachable` is read hit by hit, every hit left being of a unit's landings. Under `docs/`, `as an unknown technology` matches nothing. The proof spec: `npx playwright test e2e/tree.spec.ts`. CI's on the push: `e2e/continue.spec.ts`, `e2e/launch.spec.ts`, `e2e/campaign.spec.ts`, `e2e/ending.spec.ts`.
