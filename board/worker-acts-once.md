# A worker acts once

Settled with the user on 2026-09-13. Dies with its board line.

## Scope

A worker holds one **action**, refreshed at the turn tick like any unit's. A card played through a
worker — the building card, the improvement instants, the terraform instant: every card whose aim
asks for a worker on the tile — spends one of that worker's action when it lands, and is refused on
a worker that has none left. A worker still attacks nothing, because its range is zero, not because
it holds no action. The refresh instant keeps refreshing move points only, never action.

Decided, not open:

- **Every** card played through a worker spends the action, the terraform included. One rule; a
  free terraform beside a costed road would be an asymmetry to memorise.
- The worker's action is **one**. A worker is the city's building throughput; a second worker is a
  second build a turn.
- The refusal has its **own reason**, distinct from "needs a worker": a worker stands there and has
  acted. The worker's checks come first, before the tile's, as "needs a worker" already does.
- The map lights only the tiles a worker with action left stands on: that falls out of the refusal,
  no lighting rule of its own.

## Doc-impact

- `docs/DESIGN.md`:
  - Pitch, "Cards are the verbs" (~line 36): a unit's own action is spent on attacks *and no card
    is spent on either* — now a worker's action is what a card is spent through. One sentence.
  - Cards (~line 269, 279): the building card and the worker's instants spend the worker's action.
  - Units and combat (~line 587): replace "A worker holds no action and attacks nothing" with the
    range-zero reading and what its action is for. "An instant that refreshes a unit refreshes its
    move points, never its action" stays.
  - The map (~line 485), "Improving and terraforming reach any tile a worker stands on": add that
    either spends the worker's action.
- `docs/GLOSSARY.md`:
  - **action** row: what a unit spends to attack, one per attack, *and what a worker spends on a
    card played through it*. "action points" stays forbidden.
  - **worker** row: it acts once a turn, or however the row best says it.

## Traps

- `src/rules/fixtures.ts:285-287` — the `worker()` fixture forges `action: 0` over the kind's
  stats. Drop that override (and the redundant `damage`/`range` ones stand or fall with it): a
  fixture never forges a state. Every worker in the rules tests then enters with action 1.
- `src/rules/schedule.test.ts:313` writes `action: 0` on a unit; check whether it is a worker.
- The 'worker' refusal in `src/rules/cards.ts:151-156` (`worked`) is the one place every worker
  card composes. Add the action check beside it, not in each card.
- `TileBlock` in `src/rules/state.ts:97` gains a member; `src/ui/text.ts:107` holds the sentence
  for each (`refusal.worker`), so the new member needs its sentence or the UI shows nothing.
- The infopanel's unit card already reads `action / stats.action` (`src/ui/infopanel.ts:134`), so
  a worker's "1 / 1" and "0 / 1" show without UI work. The tooltip at `src/ui/text.ts:33` says
  "the attacks this unit can still make"; reword so it holds for a worker.
- `attackable` (`src/rules/units.ts:173-181`) gates on action first, then range. With action 1 and
  range 0 a worker still finds no target, so nothing glows; a test should say so outright rather
  than rely on it.

## Plan

1. `src/rules/units.ts:44` — worker `action: 1`.
2. `src/rules/cards.ts` — a check beside `worked` refusing with the new `TileBlock` member when the
   worker's action is 0; the three effects `built`, `improved`, `terraformed` (lines 222-238) spend
   one action of the unit on the tile. Compose the spend once, not thrice.
3. `src/rules/state.ts:97` — the new member; `src/ui/text.ts` — its sentence and the action
   tooltip reworded.
4. Rules tests in `src/rules/cards.test.ts`: a worker that built this turn refuses the next worker
   card with the new reason and the tile is not lit; the next turn's tick refreshes it; the refresh
   instant does not; a worker attacks nothing (`units.test.ts` or wherever `attackable` is tested).
   Fixture fix per the trap above.
5. One e2e case in `e2e/worker-instants.spec.ts`: the mine lands, the road on the same worker is
   refused with the sentence, next turn it lands.
6. The docs edits above; delete the board line and this file.

Verification: `npm run check`, `npm test`, `npm run lint`,
`npx playwright test e2e/worker-instants.spec.ts`.
