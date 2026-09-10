# The schedule

The contract for the board line of that name, settled with the user on 2026-09-10. The design is
already written: `docs/DESIGN.md` → *Events and the capstone* (the schedule paragraph and the
"Enemies enter from camps" paragraph); `docs/GLOSSARY.md` → **event**, **schedule**. The ship
edits neither page unless a deviation forces it. The user's calls: an event every few turns, one
at a time, never several on one turn; the escalation is in what lands, never in how often. The
pitch ran the draw on the real generator (`src/rules/rng.ts`) fresh from a thousand seeds: about
five events in thirty turns, none before turn 5, no famine before turn 15.

## Scope

- **The schedule is content**, a module constant like `CARDS`, until the catalogue rung makes it
  an argument: its entries, each `weight(turn)` and a script `land(chronicle)`, and its spacing —
  the first event due on turn 5 to 7, the next due 3 to 7 turns after one lands, both spans rolled
  uniformly by the rng. Every number sits in that one constant; all of them are tuning.
- **The chronicle carries the turn the next event is due**, one number on `Chronicle`
  (`src/rules/state.ts:35`), rolled at the founding before the events phase of turn 1 runs
  (`beginChronicle`, `src/rules/chronicle.ts:151`) and re-rolled each time an event lands.
- **The events phase** (`events`, `src/rules/chronicle.ts:632`) on a turn that is not the due
  turn changes nothing and steps the rng not at all, so `endOfTurn` (`:341`) raises no events
  stage for it. On the due turn it draws one entry among those whose weight on this turn is above
  zero — the weighted pick is `pickWeighted` (`src/rules/map.ts:474`), private to the map today
  and shared now; its layout is the implementer's — lands it, then rolls the next due turn. The
  order of the rolls is fixed and the replay pins it. An entry weighted zero cannot land.
- **Two stand-in entries**, `PH_` like every stand-in:
  - **The raid**: weight 1 from turn 5, its size one warrior plus one per ten turns
    (`1 + floor(turn / 10)`). Each warrior draws its own camp whose tile no unit stands on, as
    `arrival` does today (`src/rules/enemies.ts:75`), one after another, so the second sees the
    first's camp taken; with no such camp the rest enter nowhere and draw nothing. `arrival`
    becomes the raid's script or is absorbed by it; the implementer's layout.
  - **The famine**: weight 0 before turn 15, then 1; it sets the food stock to zero and touches
    nothing else — not the population, not the growth threshold.
- **Nothing on screen changes.** The map's events stage already grows every unit it was not
  showing (`arrivals`/`arriving`, `src/ui/map.ts:1326`), so a raid of three plays as three, and a
  stage that entered nothing in sight renders silently. Events are not announced; the famine is
  read off the resource bar or not at all. The choice line gives them faces.

## Doc-impact

None: the pages above already hold the settled fact.

## Hazards

- The tests read the stand-in's own numbers (turn 5, turn 15, the size per ten turns), as the camp
  tests read the fifth turn; they convert with the catalogue.
- An event landed is observable as an events stage among the end of turn's stages; a quiet turn
  raises none. A raid that found no free camp still raises the stage — the rng stepped.
- `chronicle.test.ts` pins the fifth turn at 452–457 (`toFifthTurn`), 2464–2503 and 2571–2591;
  those tests move to "the turn the first raid lands", found by ending turns until an events stage
  enters an enemy, bounded. A fixture that takes every camp's tile enters units through the rules
  (`entered`), never by writing `units`. The JSON round trip at 464 carries the due turn.
- The e2e `camps.spec.ts:26` asserts an enemy on turn 5 of a fixed seed; that becomes a seed
  search or ends turns until an enemy stands. Every `firstSeed` search (fall, attack, fog, console,
  map, menu) finds a different seed; budgets move; a search that no longer finds one is a deviation
  to report. `end-of-turn.spec.ts:20` ("no enemy before the fifth turn") stays true.
- The founding calls `events` on turn 1; with the first due turn at 5 or later it does nothing.
  Keep the call.

## Plan

1. The schedule's shape and the two entries, the due turn on `Chronicle`, rolled at the founding.
2. `events` lands the due entry and rolls the next; the weighted pick shared.
3. Rules tests: the spacing (first on 5–7, none in the two turns after a landing, one within
   seven); the same seed deals the same schedule through thirty turns and another seed differs;
   no events stage before turn 15 lowers the food stock across seeds, and one after it does; a
   raid on turns 5–9 enters one warrior, on turns 20–29 three, on a fixture with camps enough; a
   raid larger than the free camps enters what it can; the famine empties the food stock; the
   fifth-turn tests rewritten.
4. `e2e/camps.spec.ts` finds its raid.

## Verify

`npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/camps.spec.ts`; the seed
searches under `fall`, `attack`, `fog`, `console`, `map` and `menu` moved, so those run too — the
user's standing ruling that the wideness justifies it.
