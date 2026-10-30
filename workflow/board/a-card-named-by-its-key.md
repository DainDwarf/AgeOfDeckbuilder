# A card named by its key

**Line:** **A card named by its key** — a play command and the hand aim name their card by its key instead of its place in the hand, a key the hand does not hold refused; the personas, the fixtures and the spec helpers build their commands by key, the spec helpers still taking the slot; the simulator's trace names the card a play played, the card a hand aim was aimed at and the entry a take took. Doc-impact: `docs/SIMULATOR.md` _The cell, the row, the query_.

**Spec:**

`docs/SIMULATOR.md` _The cell, the row, the query_, the sentence "One seed replays with a **trace** naming the gambit behind every command." becomes: "One seed replays with a **trace** naming the gambit behind every command, and beside a play the card it played and, where its aim is the hand, the card it was aimed at, beside a take the entry it took as the row names it." Nothing else on the page moves.

No other page: no design page says how a command names its card, `docs/GLOSSARY.md` keeps `apply`'s command outside the vocabulary, and `DOGMAS.md` _Architecture_ already holds the ground, a card carrying a key dealt as a unit's number is. No player-facing sentence: the player sees the same screen, and the same click on the same card sends the same play.

**Doc-impact:** `docs/SIMULATOR.md` _The cell, the row, the query_ (the one sentence). `docs/PHASER.md` is not touched: the hand's presses carry another number, and nothing is drawn or hit otherwise.

**Scope:**

In:

- The play command names the card played by its key, and the hand aim names the card aimed at by its key, in the command and in the `played` group head's `Aimed` alike, which is the one type. A key the hand does not hold, and the played card's own key as its hand aim's target, are `refused`, as a place the hand does not hold and the card's own place are today.
- A hand-aimed card's effect is handed the target's key and reads the card off the chronicle it is handed, through the one helper that finds a card of a pile by its key. The "one place earlier" shift, the play taking the played card out of the hand before the effect resolves, goes, with its comments on the effect and on the `Aimed`. A key the effect does not find in the hand it is handed is a `runtime-error`, the architecture's answer for a corner the content leads into, raised as the strike's set raises one on a card no longer in the hand; the play's own check rules it out ahead of paying.
- The personas build their play commands with the key of the card at the slot they walk: the builder's plays of a card, its plays on the hand, its worker plays and unit plays, the idle's settle. The walk itself, the hand order it reads in and the ties it breaks on, is unchanged, so a seed replays the same cards under the same gambits; the simulator's tests assert a command's key read off the fixture's hand, never a literal number.
- The rules fixtures and the rules tests build their play commands by the key of the card at the place they name today, reading it off the chronicle they hand to `apply`; the fixtures' ready-made commands that today name a place become reads of the chronicle.
- The spec helpers in `e2e/chronicle-screen.ts` that play a card through the rules keep taking the hand's place, a spec's one name for a card being the slot it presses, and read the key off the chronicle's hand where they build the command; the specs do not change what they name. The one spec that builds a play command itself (`e2e/neutral.spec.ts`) reads the key beside its place.
- The hand (`src/ui/hand.ts`) sends its presses with the slot's card's key: the play at nothing, the play at another slot's card, the aim at a tile; the scene builds its commands from the key it is handed. The slot's index stays for the layout and the screen's names.
- The simulator's trace: a line for a play carries, after the command, the id of the card played, and where its aim is the hand the id of the card aimed at joined to it as the row joins an event to its answer; a line for a take carries the entry taken as the row names it, through the row's own helper; a line for any other command, and the stopped line, print as they do. One test on the tools' side: a trace names the card behind a play and the entry behind a take.
- The mechanism's test, on the fixture: a play names its card by key and plays it from any place of the hand; a key the hand does not hold is refused; a hand aim names its target by key, before or after the card played, and discards that card and no other; the played card's own key as the target is refused. The standing test of the discard instant (`src/rules/cards.test.ts` around line 297) is reshaped to say it by key, its assertion on the `played` group's aim reading the target's key.

Out:

- The `take` command names a deal's entry by its place in the order dealt, as today: a deal's entries carry no key.
- The screen's slot names (`hand-<n>`), the hand's slot index for its layout, the specs' reads of a card by its place: untouched.
- The move and the attack name their unit by its number, as today: the shape the play now shares.
- The simulator's row: it reads plays by id already and does not move.

Corner cases decided here:

- A hand aim's target is read on the chronicle as it stands before the play, and the effect reads it again by key on the chronicle it is handed: the two are the same card, the pay moving no card.
- A card that becomes another when played keeps its key, so the key the command named is the key of the card lying in its pile after; nothing reads it there in this line.

The reconcile, three likenesses: finding a card by its key, the standing helper as it is; a command naming a thing by a number, the unit commands' shape, two commands and one pattern, nothing merged; the trace naming what a command did, through the row's reads, the play's id and the take's entry by the same helper.

**Traps:**

- `src/rules/chronicle.ts` `play`, `playedAway`, `aimedBy` and `aimedEffect` (lines 1128–1228) read the hand by place; the hand case of `aimedEffect` and the comment above it carry the shift to go, and so does the comment on the hand aim's `card` in `src/rules/stages.ts` (lines 66–73). The `take` command's comment at line 157, naming by place in the order dealt, stays.
- `src/rules/catalogue.ts` line 181 is the hand aim's effect signature: its number becomes the key. Two closures read it: the content's `fire` (`src/content/stone.ts` line 564) and the fixture's `PH_Discard` (`src/rules/fixtures.ts` line 657), both reading `paid.hand[at]` today.
- The `played` group head already names a `card` that is a `CardId`, and the hand aim a `card` that is a number; the command's field for the key is the implementer's to name, but not one that reads as either of those.
- `src/rules/fixtures.ts` `PLAYED` (line 1607) is a constant command naming place 0, handed to `apply` beside a chronicle in many tests; `aimedAt`, `aimedAtUnit` and the play at line 1582 name a place too. 165 uses across ten test files of these and of `src/rules/cards.test.ts`'s own `aimedThrough` and `aimedAtHand` (lines 125–131); a fixture that becomes a read of the chronicle is called with the chronicle it is applied to.
- `tools/builder.ts` builds play commands at lines 553–567, 670, 691, 702, 956, 1148, 1471, 1557 and 1599, each from a slot it holds, reading `chronicle.hand[index]` for the card; `tools/idle.ts` line 47 names place 0 on the settle phase. The ranking at line 532 keeps the slot as a tiebreak.
- `tools/sim.test.ts` holds some forty play commands as literals with `index:` (lines 1041–2451), many compared whole with `toEqual` against a persona's answer; the fixture's hand gives the key.
- `tools/sim-body.ts` line 168–169 prints the trace line, `JSON.stringify(command)` after the sentence; `dealTaken` at line 644 names a take's entry for the row, and `plays(stages)` at line 574 reads the played ids. The card a hand aim was aimed at is read by key off the `played` group's `before` hand among the landed command's stages. The trace tests in `tools/sim.test.ts` (lines 425–549, 607) compare lines whole or by prefix; the stopped lines carry no command.
- `e2e/chronicle-screen.ts` `playedAs` (line 280) is the one place the spec helpers build the command; `admits`, `inHand`, `bareWith` and `aimableAtHand` hand out places and keep doing so. `e2e/neutral.spec.ts` line 436 builds a play command of its own.
- `src/ui/hand.ts` lines 111 and 119 are the presses' signatures, 310, 328 and 286 the calls; `src/ui/chronicle-scene.ts` line 512 reads `this.current.hand[index]` for the id of the card being aimed, and lines 503, 527–533 and 563 build the commands. `docs/PHASER.md` holds nothing the change touches.
- A hook flags a comment block longer than three lines touched under `src/` or `e2e/`; advisory.
- `src/rules/cards.test.ts` line 308 asserts the `played` group's hand aim as a place.

**Plan:**

1. `src/rules/chronicle.ts`, `src/rules/stages.ts`, `src/rules/catalogue.ts`, `src/content/stone.ts`, `src/rules/fixtures.ts`, the rules tests: the command and the aim by key, the refusal, the effect handed the key, the fixtures' commands read off the chronicle, the mechanism's test. Leaves `npm test` green on the rules.
2. `src/ui/hand.ts`, `src/ui/chronicle-scene.ts`, `e2e/chronicle-screen.ts`, `e2e/neutral.spec.ts`: the presses carrying the key, the spec helpers reading it off the hand. Leaves the proof spec green.
3. `tools/builder.ts`, `tools/idle.ts`, `tools/sim-body.ts`, `tools/sim.test.ts`, `docs/SIMULATOR.md`: the personas by key, the trace naming the card and the entry, the tools' tests and the one sentence.

One commit, the line's.

**Verify:** `npm run check`, `npm run lint`, `npm test`. The proof spec: `npx playwright test e2e/hand-aim.spec.ts` — it plays a card aimed at the hand through the screen's two clicks and compares the chronicle with the rules' own play. CI proves on the push every spec that plays a card: `embark`, `farm`, `heal`, `irrigation`, `monument`, `fishery`, `tannery`, `trapping`, `calendar`, `worker-instants`, `settle`, `press`, `refuse`, `ending`, `pin`, `map`, `neutral`, `broken-motion`.
