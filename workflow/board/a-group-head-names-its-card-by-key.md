# A group head names its card by key

**Line:** **A group head names its card by key** — the `played` and `strike` group heads carry the key of their card and no content id, every reader of either looks the content id up through the hand of the chronicle the group was raised on, and `DOGMAS.md` says a group names a card by its key. Doc-impact: none.

**Spec:** `DOGMAS.md` → _Architecture_, the group line, today:

> **A group is a name for why, over stages.** It carries what the link needs, the attacker and the target.

becomes:

> **A group is a name for why, over stages.** It carries what the link needs, the attacker and the target, a card by its key.

No `docs/` page changes: `docs/SIMULATOR.md` says the trace names the card a play played, and it goes on naming it by its content id, read through the key. No player-facing text.

**Doc-impact:** none — the rule is `DOGMAS.md`'s, and no design page names a group's fields.

**Scope:**

- In: the two heads in `src/rules/stages.ts` that name a card, `played` and `strike`, carry the card's key, the number the chronicle dealt it, in place of its content id; the `Aimed` `hand` variant already names its card by key and is untouched. The two places that raise those groups hand the key. Every reader that wanted the content id reads it off the card of that key in the group's `before` hand: the three achievement tallies in `src/rules/chronicle.ts` that compare a play against the card their achievement names, the simulator's `played` and `unplayed` columns and its trace in `tools/sim-body.ts`, and the test helpers that read the heads. The trace's text and the simulator's columns are unchanged in what they print: content ids.
- Out: any other head, the change names, the save (keys are already written), the UI (no screen reads either head's card; the hand animates a play by diffing keys between the hand and the piles), the e2e suite.
- Decided here: one name on the head, the key alone, never the id beside it; a key the `before` hand does not hold is a defect of the rules, thrown as an error where it is read, never a silent skip, as the trace already does for a hand aim's card. Whether the lookup is one helper beside `plays` in the stages module or inline at each reader is the implementer's.
- Reconcile: the lookup goes through the standing door, `cardKeyed` on the group's `before` hand, the way the trace reads a hand aim's card today; nothing new is built for it.

**Traps:**

- A `played` group's `before` is the chronicle the play was judged on, its hand holding the card played. A `strike` group's `before` is the chronicle the strike before it left, and the hand still holds the striking card: the strikes run before the end of turn's discard, and a strike's own effect may discard cards of the hand inside the group, the struck one included, which never touches `before`.
- `plays` walks nested groups and hands each `played` group with its own `before`; a reader looks the key up on that group's `before`, never on the stages' first chronicle.
- Why the head carries the key at all, for the implementer reading the changes dogma: a play aimed at the hand moves two cards out of the hand in one group, the played and the discarded, so the two chronicles alone do not say which was played; a strike moves no card at all.
- The sim's `unplayed` column subtracts the content ids played from the content ids in the piles at the end; it stays by id, the played ids now read through the keys.
- `tools/sim.test.ts` reads the trace's text and checks it against the id of the card the command's key named: it holds as it is and is the proof the trace still prints ids.
- `src/rules/cards.test.ts` holds a helper reading the `strike` heads into `{ card, holds }` pairs compared against content ids, and `src/rules/chronicle.test.ts` one reading the one `played` group a play resolves as; both re-read the id through the key.

**Plan:**

1. `src/rules/stages.ts`: the two heads name their card by key; the type no longer imports `CardId` for them.
2. `src/rules/chronicle.ts` and `src/rules/cards.ts`: the play raises its group with the held card's key, the strike with the struck card's key; the three achievement tallies read the id through the key on the group's `before` hand. `npm run check` names every other reader left.
3. `tools/sim-body.ts`: the `played` column and the trace read the id the same way; the trace's output is unchanged.
4. The tests that read the heads re-read the id through the key; `npm test` green.
5. `DOGMAS.md`: the group line gains its four words.
6. The board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No e2e spec proves the line: nothing on screen reads either head. CI proves the whole suite on the push.
