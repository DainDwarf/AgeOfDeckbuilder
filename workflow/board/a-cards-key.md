# A card's key

**Line:** **A card's key** — every card in a chronicle carries a key that tells it from every other, its copies included, dealt from a counter of the chronicle's as a unit's number is and kept through every pile and through becoming another card; a discarded, exhausted or banished change carries nothing beside its two chronicles, the cards it moved read off them by their keys; the save writes and validates the keys. Doc-impact: `DOGMAS.md` _Architecture_, `docs/CHRONICLE.md` _Cards_.

**Spec:**

`DOGMAS.md` _Architecture_, the flow line. Its clause "a card carries its counters and no identity of its own, so the piles are the rows and one movement between them is one change however many cards it carries" becomes: "a card carries a key of its own, dealt as a unit's number is, and the piles are still the rows: one movement between them is one change however many cards it carries, the cards it carries read off the two chronicles by their keys". The rest of the line stands, and the clause "carries beside them only what those cannot say" is what the change's `places` is cut by.

`docs/CHRONICLE.md` _Cards_, after "so what a card does and what it says are one fact.": "Every card in a chronicle is a card of its own, its copies included, and stays so through every pile it goes to and through becoming the card it names." Nothing else on the page moves: the keywords, the piles and the kinds read as they do.

No player-facing sentence: the player sees the same screen. No glossary row: the key is internal, as a unit's number is.

**Doc-impact:** `DOGMAS.md` _Architecture_ (the one clause), `docs/CHRONICLE.md` _Cards_ (the one sentence). `docs/PHASER.md` is not touched: the hand and the piles change what they read off a change, not what they draw.

**Scope:**

In:

- A card in a chronicle is its content id, its counters and a key: a number dealt from a counter on the chronicle that only climbs, from one, as `nextUnit` deals a unit's number, so a banished card's key is never dealt again. The key is dealt where a card enters a pile, by one door: the launch, for the city section's card, the settle section and the deck, the deck in its order before the shuffle; a hazard added to the draw pile's top; a reward's copies added to the discard pile, each copy its own key. A card drawn, discarded, shuffled or exhausted keeps its key. A card that becomes another keeps its key and takes the other's id and the other's starting counters: it is the same card turned over. A card whose counters are set keeps its key.
- Two shapes of card: the card at its content's start, id and counters, which the faces read and which a reference face, a card named on another card and a browse test make for display; and the card in a chronicle, that plus its key. The faces read the first shape; a card in a pile is the second.
- The strike's counters are set on the striking card found by its key, no longer by its place in the hand `struck` began on; the trap comment on the place goes with the place. A striking card no longer in the hand when its set lands is a `runtime-error`, the architecture's answer for a corner the content leads into.
- The change: `discarded`, `exhausted` and `banished` carry nothing beside the chronicle they were raised on and the one they leave; `places` goes from the change, the stage builder that took it with it. Which cards moved is read off the two chronicles: the cards whose keys are in the before's hand and not in the after's, in the before's hand order; where each lies, by its key in the after's pile. A rules path that needs every card of the hand gone names them by nothing: the hand after is empty.
- The hand (`src/ui/hand.ts`) reads a discard's or an exhaust's cards by key: each slot whose card's key is gone from the after's hand leaves, in the before's hand order, and the card it lies as in the pile is found by key, so a card that became another turns over into the card found, no inference from the top of the pile. The piles (`src/ui/piles.ts`) count the cards landing as the keys gone. Nothing else about the hand or the piles moves: the faces are still rebuilt at a render, the next line's work.
- The save writes each card's key and the chronicle's next key; it reads them back and refuses a key not below the next key or held by another card of any of the four piles, through the one check unit numbers go through; a next key below the first is refused as the next unit number is. A save written before this line has its chronicle refused and its campaign kept: no care for it, by the standing call.
- The fixture `cityOf` deals keys to the cards it names, through the launch's door or the dealer's own, so a test still names piles by id and reads them by id.
- The mechanism's test, on the fixture: two copies of one card in the hand carry distinct keys; a card keeps its key from the draw pile through the hand, the discard pile, the shuffle and the next draw; a card that becomes another keeps its key under the new id; a reward's copies each carry a key no card held; the save round-trips the keys and refuses a key held twice and a key not below the next; a strike sets its counters on its own card by key. Replaces the standing test "a pile change carries the places in the hand its cards came out of" with the new promise: the cards gone from the hand are found by key in the pile they went to, and a reward's cards carry keys none held.

Out:

- A play command and the hand aim name the card by its place in the hand, as today; the line after this one on the board moves them to the key. The `played` and `strike` group heads keep naming the content id.
- The faces, the browse, the specs' names (`hand-<index>`, `discard-pile-top`), the simulator's row and the personas' index reads of the hand: untouched.
- The collection's card numbers: the campaign deals them and the chronicle never reads them.

Corner cases decided here:

- The launch deals keys in deck order before the shuffle, so the seeded shuffle draws the generator exactly as today and every spec's seed replays the same chronicle.
- The chronicle's next key climbs on every card dealt, a reward's copies and a hazard added included; nothing resets it within a chronicle.
- The counters-set change still carries nothing: the card whose counters moved is read by key, the one whose counters differ between the two chronicles.

The reconcile, four likenesses: the unit's number and the save's `dealtOnce` — the key goes through the standing door as it is, one more call of it; the campaign's card numbers — apart, a difference that is meant, a chronicle making cards the campaign never owned; the one card maker serving both the piles and the display — two shapes, the content's start card the faces read and the keyed card the piles hold, the key dealt by the one door that puts a card into a pile; `tileKey` — apart, a string derived from a position, never dealt, not the pattern.

**Traps:**

- `DOGMAS.md` _Architecture_ holds the clause to rewrite, word for word in the Spec; the line is one paragraph.
- `places: true` on an aim (`src/rules/cards.ts` `builds`, `placesImprovement`; `src/rules/catalogue.ts` where the neutral's worker cards are checked) is another thing, a card that places a layer; it stays. Only the change's `places` goes.
- The campaign already holds `nextCard`, `FIRST_CARD_NUMBER` and `dealt` (`src/rules/campaign.ts`); the chronicle's dealer and its first number take names that are not those, two sequences never confused.
- `src/rules/cards.ts` `countersSetAt` reads the hand by place and carries the trap comment on the shift; both go.
- `src/rules/chronicle.ts` `everyPlace` serves the end-of-turn discard and the settle phase's banish; with `places` gone, `discarded` takes the cards to discard, or the whole hand, not places.
- `src/ui/hand.ts` `toPile` infers its cards as the top of the pile in the places' order, with a comment saying the change carries no ids; the comment goes with the inference. `src/ui/piles.ts` reads `stage.places.length`.
- `src/ui/face.ts` `cardFaceAtStart` and `namedCardMade` and `src/ui/collection-layout.test.ts` make cards for display through `cardMade`; they make the content's start shape and never a keyed card.
- `src/rules/save.ts` `cardIn` reads id and counters; `dealtOnce` takes the held numbers with the names of the next number and the numbered thing; `nextUnit` is read with `count` against `FIRST_UNIT_NUMBER`. The unit number tests in `src/rules/save.test.ts` (around lines 477 and 515) are the shape of the key's.
- Tests that compare a whole card object: `src/rules/cards.test.ts` 2010, 2018, 2097, 2101; `src/rules/chronicle.test.ts` 279, 292–294; `src/rules/save.test.ts` 236. `src/rules/chronicle.test.ts` 264 and 320–361 assert `places`.
- A hook flags a comment block longer than three lines touched under `src/` or `e2e/`; advisory.
- `e2e/chronicle-screen.ts` `idsOf` and `pileStacks` read ids and counters: untouched. `e2e/resume.spec.ts` and `e2e/refused-save.spec.ts` read saves the game writes, so they walk the key's write and read on CI.

**Plan:**

1. `src/rules/state.ts`, `src/rules/catalogue.ts`, `src/rules/chronicle.ts`, `src/rules/schedule.ts`, `src/rules/cards.ts`, `src/rules/fixtures.ts`: the keyed card and the chronicle's next key, dealt by the one door where a card enters a pile — the launch, the hazard added, the reward — the card that becomes keeping its key, the strike's set finding its card by key, the fixture dealing keys. Leaves every card in every pile keyed, the rules tests green on ids.
2. `src/rules/stages.ts`, `src/rules/cards.ts`, `src/rules/chronicle.ts`, `src/ui/hand.ts`, `src/ui/piles.ts`: `places` gone from the change and its builder, the hand and the piles reading the cards moved by key. Leaves the flights finding each card by key, a becoming card turning over into the card found.
3. `src/rules/save.ts` and its test, the mechanism's test on the fixture, `DOGMAS.md` and `docs/CHRONICLE.md`: the key written, read and validated; the test; the two sentences.

One commit, the line's.

**Verify:** `npm run check`, `npm run lint`, `npm test`. The proof spec: `npx playwright test e2e/embark.spec.ts` — it plays a card that becomes another, the flight turning over into the card found by key and the discard pile's top reading it. CI proves on the push every spec that opens a chronicle, the most direct among them `resume`, `refused-save`, `broken-motion`, `browse`, `press`, `hand-aim`, `settle`, `capstone`, `farm`, `monument`, `drought`, `long-winter`, `flood`.
