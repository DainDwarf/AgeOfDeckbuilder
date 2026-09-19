# An action spends the move points

**Line:** An action spends the move points — a unit that spends its action, on an attack or on a card played through a worker, spends the move points it has left with it, and a unit of the player's with no move points and no action left is dimmed on the map. Doc-impact: `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** `docs/CHRONICLE.md` _Units and combat_ (the second bullet); `docs/CHRONICLE-SCREEN.md` _The chronicle screen_ (the first paragraph). The rule: a step spends no action, and an action spent spends the move points the unit has left with it, whatever it was spent on and whoever spent it, so a unit moves and then acts, never the other way about. The refresh instant is untouched: it brings the move points back after an action as after a crossing. The sentences, written out:

- `CHRONICLE.md` _Units and combat_, second bullet, replace "The player attacks by the same press as a move — the target standing on the tile is what makes it an attack — and the two pools are independent: an attack spends no move points, a step spends no action, and either follows the other in a turn." with: "The player attacks by the same press as a move — the target standing on the tile is what makes it an attack. A step spends no action, and an action spent spends the move points the unit has left with it, on an attack and on a card played through a worker alike, so a unit moves and then acts, never the other way about, and where it acts is where it stays until the refresh; an instant that refreshes its move points brings them back after an action as after a crossing. An action that left the move points alone was rejected: with no retaliation, a unit that strikes and steps out of reach is never answered."
- `CHRONICLE-SCREEN.md` _The chronicle screen_, first paragraph, replace "The selection follows the unit to where it stands after either — where it landed, or where it attacked from and never left — lit and glowed again." with: "The selection follows the unit to where it stands after either — where it landed, or where it attacked from and never left — lit and glowed again with what it has left." After "A unit with no action left glows nothing, and a press on the enemy beside it selects that tile like any other." insert: "A unit of the player's with no move points and no action left is dimmed where it stands, under the scrim every dim of the map is, so a unit whose turn is done reads at a glance; the dim reads those two numbers and nothing else, so a unit short of the step it wants, or holding an action nothing in reach takes, stands undimmed. An enemy is never dimmed: the enemy phase spends its action and the same end of turn refreshes it."

No player-facing text: the dim has no words, and no glossary row is added.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- The rule, at the one place the action is spent, so both doors — an attack, by hand or by an enemy's script, and a card played through a worker — spend the move points left without either being written on its own. No new change name: the unit is one row, and the one `action-spent` change leaves it with one action less and its move points at nought; the amount reads off the chronicles before and after, as every change's does.
- One test per door on the fixture: a unit of the player's that attacks stands with no move points and a step refused after; a worker that plays a card through itself stands with none. The refresh test already standing — a worker that moves, improves and is Marched — holds March after an action, and gains the assertion that the improvement left the move points at nought.
- The dim: on the map, the mark of a unit of the player's whose move points and action both stand at nought is drawn under a scrim, the outline colour at the weight the fog, city mode's dim and the yield overlay's dim all use; the map redraws it on every stage as it does the mark, so the dim comes with the `action-spent` change and goes with the `refreshed` one. The selection's ring stands over it as over every dim. The unit card in the infopanel is unchanged: it reads the numbers.
- `e2e/attack.spec.ts`: the assertion that the warrior's move points are unchanged after its attack flips to nought.
- The two design pages, the sentences above verbatim.

Out:

- A trait on the unit kind for a unit that keeps its move points after an action: no field is added, and no page holds the door open. The unit that carries such a trait rewrites the sentence when its age comes.
- March's cost. Gather, then March, then the walk home is the age's hit-and-run at military's price, and the price is the balance pass's.
- A dim on an enemy's mark.
- A dim that reads what the unit can still do: it would have to read the hand, and a worker with an action left and no step can still play a card through itself.

Corner cases decided here:

- A unit whose move points already stand at nought — a river crossing took them — and then acts: nothing more is taken, and the change records the action as it does today.
- Turn 0: no unit moves or attacks on it, every unit stands full, nothing is dimmed.
- A unit with more than one action, should content name one: the first action spent empties the move points, the next finds nothing to take, and the unit is dimmed once its last action is spent.
- A dimmed unit selected: the ring stands over the dim, nothing is lit and nothing glowed, and a drag from it comes home without a word, as the page already says of a unit that can do nothing.
- The yield overlay's dim over a dimmed unit: both stand, and the unit reads darker for it. Accepted.
- Wildfire's damage and a terraform's kill touch no pool and are untouched.

**Traps:**

- Both doors spend the action through one helper in `src/rules/units.ts` today — the attack in `src/rules/chronicle.ts`, the card through a worker in `src/rules/cards.ts` — so the rule lands in that helper and neither door is touched for it.
- `src/ui/map.ts`, `src/ui/hand.ts` and `src/ui/piles.ts` each switch over every change name with no otherwise-branch; the dossier adds no change name, so none of the three is touched for the rule.
- Every dim the map paints is a scrim of the outline colour at the same alpha — three constants in `src/ui/map.ts`, all at the one weight. The unit's dim takes that weight; whether it is a scrim over the mark or the mark drawn at that alpha is the implementer's, and the precedent is the scrim.
- The unit mark is drawn in two places in `src/ui/map.ts`: on a live tile from the chronicle, and on a tile in fog from its snapshot. A unit of the player's is never in fog, so only the live draw dims.
- The tick refreshes a unit whose move points or action are short of full, so a unit that acted is refreshed as one that moved is; nothing changes there.
- `e2e/attack.spec.ts` reads the warrior's action to find its run and asserts its move points after the attack; the second flips, the first stands. No other spec or rules test walks a unit after an action or reads an enemy's move points after its attack: the enemy phase never moves a unit after it attacks, and the same end of turn refreshes it.
- The glossary lists _dimmed_ among the words forbidden for **fog**; the screen page already says _dim_ and _dimmed_ of the map's scrims and the lint passes it. The word is for a scrim and never for fog, which is _darkened_.
- Once this ships, a warrior that kills a guard stands where it struck from until the next turn; the guarded-camps dossier's trap says so.

**Plan:**

1. The rule in `src/rules/units.ts`, with one test per door beside the door it proves — the attack's in `src/rules/units.test.ts` or `src/rules/chronicle.test.ts`, the worker's in `src/rules/cards.test.ts`, where the refresh test gains its assertion. The tree typechecks and every rules test passes.
2. `e2e/attack.spec.ts`: the flipped assertion.
3. The dim in `src/ui/map.ts`.
4. The two design pages, the sentences above verbatim.

**Verify:**

```
npm run check
npm test
npm run lint
npx playwright test e2e/attack.spec.ts
```

Then the `visual-check` skill on the running app, with this checklist: a warrior of the player's that has attacked reads dimmed on the map and the enemy it struck does not; the warrior's ring stands over the dim when it is selected; the dim is gone once the turn has ended; a worker that has moved its full move and not acted is not dimmed; the console logs nothing.
