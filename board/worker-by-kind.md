# A worker attacks nothing because it is a worker

Settled with the user on 2026-09-13. Dies with its board line.

## Scope

Whether a unit is a worker is a fact written on the unit, next to its stats, and that fact alone
says what its action buys: a worker spends it on the cards played through it, every other unit on
attacks. No stat decides it. Today the same fact is reconstructed three ways — the player's attack
path from range zero, the enemy's attack path from damage zero, the build path from the placeholder
worker's card id — and each is one future card away from disagreeing with the others. After this
line, range means only how far and damage only how much, on any unit; a worker given range or
damage by anything attacks nothing, and a fighter standing on a tile is refused every card played
through a worker, action or no action.

Decided, not open:

- **One property, three readers.** `attackable`, `leastHealth` and `worked` read it; nothing else
  reads range or damage to decide whether a unit fights.
- **The enemy's damage gate goes.** A unit that fights and has no damage attacks for nothing, as
  the design already says an attack does; it is content, not a worker in disguise.
- **The worker's range and damage stay zero** as the numbers a worker enters with. They mean
  nothing now and are not what the tests lean on.

## Doc-impact

- `docs/DESIGN.md`, Units and combat (~line 589): "A worker holds one action and attacks nothing,
  its range being zero" becomes the kind reading — a worker attacks nothing because it is a worker,
  whatever its range or damage; what a unit spends its action on is written on the unit, not read
  off a stat. One sentence, nothing else in the bullet moves.
- `docs/GLOSSARY.md`: the **worker** row stays; the **range** row or the **action** row says the
  kind decides, if either needs a word for it — the implementer proposes the wording in the report
  rather than coining a term. No new glossary entry unless one is unavoidable.

## Traps

- `src/rules/units.ts:26-34` — `UnitStats` gains the member; `UNIT_STATS` sets it on both kinds.
  The name is the implementer's; it is not a boolean named after the placeholder card.
- `src/rules/units.ts:166` — `leastHealth` gates on `damage === 0`; that gate becomes the kind
  read. `src/rules/units.ts:181-190` — `attackable` gates on action then range; the kind read comes
  first, and a worker returns `[]` before range is looked at.
- `src/rules/cards.ts:153` — `worked` compares `stats.type` to `'PH_Worker'`; it reads the kind
  instead, so a second worker card needs no edit here.
- `src/rules/fixtures.ts:167-178` — `statsOf` forges a `UnitStats` by hand from warrior numbers, so
  it must set the new member, and `worker()` at line 285 must set it the worker's way. The `damage:
  0, range: 0` overrides in `worker()` are the kind's own numbers, redundant rather than forged;
  they stand or fall with the implementer's reading of the fixture rule.
- `src/rules/units.test.ts:180` — the test title states "its range is zero"; that test now says
  the opposite: a worker with range one and damage one still attacks nothing and lights nothing.
- `src/rules/schedule.test.ts:305-312` — a hand-built worker with `range: 0`; check it carries the
  kind.
- `src/ui/text.ts:33` — the action tooltip was reworded for the worker last line; check it still
  holds. `src/ui/infopanel.ts` and `src/ui/map.ts` read `stats.type` for marks only; untouched.

## Plan

1. `src/rules/units.ts` — the member on `UnitStats` and `UNIT_STATS`; `attackable` and
   `leastHealth` read it and nothing numeric decides whether a unit fights.
2. `src/rules/cards.ts` — `worked` reads it.
3. Fixtures per the trap above.
4. Rules tests: a worker with range one and damage one attacks nothing and `attackable` is empty
   (`units.test.ts`); a warrior with action left standing on a tile is refused the farm, the mine,
   the road and the urbanisation with `'worker'` (`cards.test.ts`); an enemy with damage zero that
   fights still names a target (`units.test.ts`, replacing whatever leant on the damage gate).
5. The docs edits above; delete the board line and this file.

Verification: `npm run check`, `npm test`, `npm run lint`,
`npx playwright test e2e/worker-instants.spec.ts`.
