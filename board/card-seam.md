# The card seam: aim and effect

The contract for the board line of that name. Settled with the user against the CivCardGame's
card model (declarative fields, a closure beside them for the rest) and four cards the design
foresees. Worked on the branch `card-seam`; merged to `main` when the user says so.

## Scope

- **A card is a cost, an aim and an effect.** The cost stays declarative, a closed vocabulary of
  payable things, read by the hand to grey a card and by the refusal to name what is short. The
  aim is one object: its type — none, tile, unit — which the hand reads to open the gesture, and
  a predicate over the chronicle and a candidate, which the one finder filters by. The effect is a
  closure from the paid chronicle and the chosen target to the chronicle after. The `target`
  column and the `InstantEffect` union go; no switch in the engine asks what a card does.
- **One finder, one block, one resolver.** The finder lists the tiles or units the aim's
  predicate admits; the block names the aim's type when the list is empty; the resolver refuses
  a target the finder does not list and otherwise calls the effect. The scene's tile aim and unit
  aim read their lists from the finder, as they do today.
- **Nouns keep their tables.** A building's terrain and yield stay on the building, an
  improvement's on the improvement. The placement of a noun is a predicate on the noun that the
  card's aim composes, so an improvement that needs more than a terrain (the foreseen irrigation:
  a plain beside a river or beside another irrigation) is a noun-side predicate when it comes.
  No such content exists; the implementer widens nothing for it.
- **Common predicates are shared helpers** a card or a noun composes: a worker of the player's
  standing there, a held tile, a free building slot, a terrain, a unit of the player's with spent
  move points. Repetition of shape across cards is fine; a fact lives once.
- **Sized against, not built:** the peek-and-choose card and the choose-from-discard card (a
  pending choice in the state and a command that answers it — its own line, which also settles
  whether the peek comes before or after the cost is paid); a discard count as a supplement to a
  cost (a declarative cost field and the cards chosen carried on the play command — its own
  line); a card that destroys a building (a tile aim over held tiles with a building, an effect
  that empties the slot; whose buildings count is its design question).
- **A new dogma line** under *Code*: an effect closure and an aim predicate are pure over the
  chronicle, and an effect changes state only through the named helpers, so one invariant stays
  behind one door. Closures live on content, never in the state, so a save carries none.

## Doc-impact

- `docs/DOGMAS.md`: the line above, in *Code*.
- `docs/DESIGN.md`, `docs/GLOSSARY.md`: none. Three kinds stand; "aimed" is already the design's
  word for a card held over the map.

## Hazards

- The seven cards' rules tests and every e2e spec pass unchanged: this line changes how a card is
  declared, not what any card does. A test that has to change is a deviation.
- The next line, *Units carry an id*, addresses the unit target and the finder by id. It lands on
  this shape; the finder must have one place a unit is named.
- The scene must keep asking the rules for the lists and the refusal, never the card's closures.

## Verify

`npm run check`, `npm test`, `npm run lint`; `npx playwright test e2e/inspect.spec.ts` (the unit
aim) and `e2e/browse.spec.ts` (the pile sorted by kind).
