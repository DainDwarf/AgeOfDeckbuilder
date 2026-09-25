# A chronicle's save

**Line:** A chronicle's save — what a save is, in `src/rules/`: the chronicle, the content version and the launch's choices, written and read back by pure functions, the reading refusing a save that is not a chronicle's whole; inert in the game, proven on the fixture. Done when `src/rules/` holds the save module and its Vitest tests pass: a chronicle written and read back plays the next command to the same outcome, and a save that is not a chronicle's whole is refused.

**Spec:** `docs/META.md` _The save_ and `docs/INTERFACE.md` _The launch page_, both already written at the cut: a chronicle's save is its state and its seed, it names the content version it was written on, it keeps the choices it was launched on beside it, and one the boot cannot read whole — a version the game no longer ships, a shape that is not a chronicle's, an id the content no longer holds — is refused. `DOGMAS.md` _Architecture_: a save is the state serialised and no closure survives it; the catalogue is an argument, so the reading takes the catalogue it reads against. No player-facing sentence: nothing of this line reaches the screen.

**Doc-impact:** none — the pages took the design at the cut.

**Scope:**

- In: one new module in `src/rules/` and its test file. What a save holds: the chronicle, and beside it the region and the deck it was launched on, by id. The content version and the schedule are not repeated beside the chronicle: the chronicle carries both (`content`, `timeline.schedule`), and a fact stands in one place. The seed is the chronicle's own field.
- In: the writing answers text, the reading takes text. The browser keeps text, and the specs of the next rung will fabricate a save in Node and hand the page its text, so the boundary is the string and no module outside `src/rules/` serialises a chronicle itself.
- In: the reading takes the catalogue and the text, and answers the chronicle and its choices, or refuses. It refuses when the text is not JSON; when the shape is not a chronicle's — every field of `Chronicle` present with its type, an optional field present or absent, the numbers the rules count with integers (`turn`, `population`, `nextUnit`, `timeline.next`, `timeline.capstone.turn`, a unit's `id`, `movePoints`, `action`, every stat, every coordinate, every resource stock, every counter, the four words of each generator); when the chronicle's `content` is not the catalogue's version; when the region or the deck does not resolve in the catalogue; and when any id the chronicle carries does not resolve: a card's id in any pile, a tile's terrain, feature, improvements and building, a snapshot's tile and its unit's type, a unit's `stats.type` and an enemy's `script`, the timeline's schedule and capstone, a deal's event or its rewards. A card's counters are the ones its content declares, no more and no fewer. A closed set — a deal's kind, an ending's outcome and cause, a unit's faction, a snapshot unit's faction, a resource's name — admits its members and nothing else.
- In: the reading builds the chronicle field by field from what it checked and never hands the parsed object back, so nothing the text carries beyond the shape reaches the state. A field the shape does not name is dropped, not refused.
- In: a refusal throws, as the catalogue's coherence check does, through the one rejection vocabulary, and its words name what failed; the boot that catches it is the next line's.
- In: the tests, on the fixture catalogue of `src/rules/fixtures.ts`, the chronicle built through the transform production uses (`launched`, or a settled launch from the fixtures) and never inline. One test per rule a player could state: a chronicle saved and read back is the chronicle, and plays the same command to the same outcome as the one it was written from; a save carrying a card no catalogue holds is refused; a save that is not a chronicle's shape is refused; a save written on one content version is refused by a catalogue of another. The version mismatch is exercised with the fixture catalogue read under another version and nothing else changed; that copy is content enough for the rule.
- Out: the browser's storage, the boot, the chronicle screen writing anything, the address. Nothing in the game calls this module yet; it lands inert.
- Out: the meta's part of the save. The campaign rung adds it beside the chronicle; this module defines the chronicle's record and no envelope for parts that do not exist.
- Out: the `Choices` type of `src/ui/launch-page.ts`. The rules never import `src/ui/`; the save's choices are the two ids, and the next line maps them to and from the screen's `Choices`.
- Corner decided: a unit's stats are the state's own and are read from the save as numbers, never re-read from the catalogue; a unit kind tuned after the save was written does not reach units already entered, by design.
- Corner decided: `undefined` never survives JSON. The writing lets it drop; the reading accepts an optional field absent — `city`, `ending`, a tile's `feature` and `building`, a snapshot's `unit` — and refuses it present with the wrong type.
- Corner decided: a generator's words are int32 and JSON keeps them exact; the reading checks each is an integer and no more.

**Traps:**

- `src/rules/` never imports Phaser, never touches the DOM and never imports `src/content/`: no `localStorage`, no `window`, no catalogue import. The catalogue is handed in.
- The rejection vocabulary is `refuse` in `src/rules/map-kinds.ts`, a throw whose message opens with the catalogue's version; `checkContent` in `src/rules/catalogue.ts` already refuses a chronicle of another version. The catalogue's lookups — `cardOf`, `unitKind`, `enemyScript`, `eventOf`, `capstoneOf`, `scheduleOf`, `deckOf`, and the map kinds' `terrainKind`, `featureKind`, `improvementKind`, `buildingKind` — each throw through it on an id the catalogue lacks, so resolving an id is calling the lookup; the shape is checked before an id is handed to one, or an id that is not a string reaches a table lookup.
- The counters rule has a precedent: `cardMade` in `src/rules/catalogue.ts` refuses a counter the card does not declare and fills the declared ones from the card. The reading holds to what the save carries and checks it both ways.
- A closed set is switched, never tested (`DOGMAS.md` _Code_): a string read from text is admitted into a union by a switch over every member with no default, and a switch in a function that returns nothing ends in a `never` check.
- The bindings module, `src/ui/bindings.ts`, is the precedent for reading stored text leniently field by field; this reading differs in one way, by design: a binding that cannot be read leaves its slot at the default, a chronicle that cannot be read whole is refused whole.
- `src/rules/fixtures.ts` holds the fixture catalogue as `CATALOGUE`, its deck as `DECK`, its region and schedule as `REGION` and `SCHEDULE`, and `settledLaunch` for a chronicle settled on turn 1; a fixture goes through the transform production uses, and a helper that mirrors a rule is a defect.
- Tests import their runner API from `vitest` explicitly; `globals` is off.
- The next rung's specs will import the writing from `e2e/` to fabricate a save in Node, as `e2e/chronicle-screen.ts` imports `launched` and `apply` today: the writing takes the catalogue, the chronicle and the two ids, and nothing that only a browser has.

**Plan:**

1. `src/rules/save.ts`: what a save holds, the writing to text, the reading from text against a catalogue that refuses. Leaves standing: a module nothing in the game calls yet, `npm run check` green.
2. `src/rules/save.test.ts`: the four tests on the fixture. Leaves standing: `npm test` green with them.
3. `workflow/BOARD.md`: the line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — the line never reaches the screen. CI's on the push: the whole suite, none of it walking this path.
