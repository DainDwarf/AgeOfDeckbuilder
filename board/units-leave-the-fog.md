# Units leave the fog when the turn ticks

**Line:** **Enemy units leave the fog at the end of the turn** — when the turn ticks, every unit leaves the snapshot and the tile under it stays as it was last seen: a rules test shows a unit kept in fog gone after the tick with its tile's layers kept, a unit standing in sight at the tick still recorded, and a unit kept in fog during play still there until the turn is ended; `CHRONICLE.md` → Sight says so in place of the 🔧 paragraph it reverses.

**Spec:** [`docs/CHRONICLE.md`](../docs/CHRONICLE.md) → _The rules_ → _Sight_. The paragraph

> **A unit in the snapshot stays there until its tile is seen again** 🔧: the player is told where it last stood, not where it is. The end of the turn wiping units out of the snapshot is one rule away.

is replaced, whole, by

> **A unit in the snapshot leaves it when the turn ticks**: the enemy phase has moved whoever stood in the fog, so a mark kept past it would say where a unit is not. Within a turn nothing but the player moves, so a unit the fog shows is where it was seen.

No 🔧 on the new paragraph: it is decided. Nothing else on the page changes — the snapshot paragraph above it ("taken again each time a command changes the chronicle"), the turn's seven steps, and _The rest of the screen reads what the map draws_ ("the unit its snapshot keeps is a mark and not a card") all hold as written. No player-facing sentence is foreseen: no text-table entry, no card text.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

- In: the rule, in `src/rules/`; its rules tests; the Sight paragraph. The UI draws what the snapshots hold and needs no edit — a snapshot with no unit already draws no mark.
- Out: any new stage name, any animation of the marks leaving, the glossary (no term changes; "ghost" is the board's word and stays out of the docs and the code's names), a wipe tied to the unit moving (rejected: a mark vanishing or staying would tell the player what a unit out of sight just did).
- Decided here:
  - **Every unit in the snapshot leaves, whatever its faction.** The snapshot keeps "the non-player unit"; the code has no neutral faction today, and the rule is written so that it holds when one arrives.
  - **The wipe runs with every tick, turn 0's included.** Nothing non-player stands on the map on turn 0 today; the rule stays uniform rather than grow an exception.
  - **A unit a killed unit of the player's was seeing leaves too.** A death in the enemy phase drops tiles into fog with enemies on them, the killer's among them; the tick wipes them all, though the killer has not moved since. The player watched the blow in the play-out — no handholding.
  - **While a camp's rewards stand, the marks stand.** The end of turn stops at the captures and the tick comes with the take that resumes it; the wipe comes with that tick, not before.
  - **No tick, no wipe.** A victory or a fall ends the list before the tick, and the snapshots are left as they stood.
  - **A unit in sight at the tick stays recorded.** The wipe comes first and the charting of that same stage records again whoever stands in sight.

**Traps:**

- `charting` in `src/rules/chronicle.ts` carries the snapshots from stage to stage and **overwrites** whatever snapshots a stage's own chronicle holds with the ones the stage before left. A wipe written into the `turn` stage inside `turnOpened` is silently undone there. The wipe has to live where the snapshots are carried — at the charting, keyed on the stage that ticks — or the carrying has to learn to respect it.
- The tick is reached two ways: `end-turn`, and the `take` of the last camp reward, which resumes `turnOpened`. Both go through `apply`, so a wipe at the charting covers both; one written into `endOfTurn` misses the second.
- `charted` and `charting` hand back the very chronicle and stage they were given when nothing changed, and tests lean on that identity. A wipe that drops no unit should hand back the snapshots it was given.
- A snapshot's `tile` is the very `Tile` object the map held when it was taken, and `records` compares it by identity: dropping the unit must keep that object, not rebuild it.
- `src/rules/sight.test.ts` — _a killed unit charts nothing more_ — asserts today that the killer's mark survives two ends of turn. That is the old rule: the test is rewritten to the new one, not kept passing.
- `e2e/fog.spec.ts` makes its enemy in fog by stepping a worker out and back within one turn and reads it before any end of turn; it should pass untouched. If it does not, that is a deviation to report, not a spec to bend.

**Plan:**

1. `src/rules/sight.ts` — beside `charted`, the one function that answers the snapshots with every unit dropped and every tile kept, handing back what it was given where no snapshot held a unit.
2. `src/rules/chronicle.ts` — `charting` owns the invariant: on the stage that ticks the turn, the carried snapshots go through the wipe before that stage is charted. How the ticking stage is recognised — its name, or the turn number moving — is the implementer's.
3. `src/rules/sight.test.ts` — the three cases of the done-condition, and the killed-unit test rewritten: after the end of turn that kills the watcher, the tile the killer stands on, out of sight, is kept with no unit on it.
4. `docs/CHRONICLE.md` — the paragraph swap above.

**Verify:** `npm run check`, `npm test`, `npm run lint`, and `npx playwright test e2e/fog.spec.ts`.
