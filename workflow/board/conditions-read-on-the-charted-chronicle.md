# Conditions read on the charted chronicle

**Line:** Conditions read on the charted chronicle — a command's stages are charted before the capstone's and the achievements' conditions are read on them, so a condition on what the chronicle has charted is met on the change that charts it; `npm test` passes with a test in `src/rules/chronicle.test.ts` proving an achievement that counts charted tiles is recorded right after the move that charts the tile it needs, in the same command.

**Spec:** the code is brought in line with the pages, which already say it.

- `docs/META.md` → _The campaign_, the achievement paragraph: "a condition read on the chronicle — its stocks, its map, its ending — after every change, as the capstone's is".
- `docs/CHRONICLE.md` → _The capstone_, the paragraph "A capstone names what passes it": "read on the chronicle after the capstone's landing and after every change from then on".

A change's chronicle is the chronicle as it stands after the change, and what stands in sight after a change is charted. No player-facing text.

**Doc-impact:** none — both pages already say the conditions are read on the chronicle after every change; only the code's order disagrees.

**Scope:**

In:

- `apply` (`src/rules/chronicle.ts`) charts the stages a command resolves as, then reads the conditions on the charted stages — the reverse of today's order. The capstone and the achievements move together: both are read in the one walk.
- One test, on an achievement: a catalogue copy built inside the test, as the test "the fall's ending is read as any change" does, whose achievement counts the chronicle's charted tiles and needs one more than a chronicle holds before a move; the move that charts the tile is followed by the `reached` in the same command's stages.

Out:

- No capstone test, by the user's call: both conditions are read in the same walk, so one test proves the order.
- No content reads what is charted; the exploration achievement is an idea for the Stone Age.
- No change to what a refused command reads: it holds no change and reads no condition, as today.

Corner cases decided:

- The `reached` and the victory's `ended` that the condition walk appends are no longer passed through the charting. They need none: each is built off a charted chronicle and changes neither the turn nor anything in sight.

**Traps:**

- The charting pass hands back the very stages it was given when a command charted nothing, and the condition walk hands back an untouched group as itself; tests assert identity (`toBe`) on outcomes, so both identity paths must survive the swap.
- The condition walk tells a group whose own chronicle is its last child's from one where a generator's draw rode past the last child (`trailing.chronicle === stage.chronicle`). The charting keeps that relation — a group equal to its last child leaves its last child's charted chronicle, a group that differs is charted on its own — so the walk's test reads the same on charted stages. A rewrite of either pass must keep it.
- The condition walk carries an achievement's record onto every stage after a `reached` by spreading the stage's chronicle; on charted stages that spread keeps the snapshots.
- The charting clears units off the snapshots on the change where the turn moves; a stage appended after it with the same turn needs no clearing.
- The docblocks on `apply`, `conditionsRead` and `charting` state the order; any that states the old one is updated, none gains a sentence about the swap.

**Plan:**

1. `src/rules/chronicle.test.ts`: the new test, beside the achievement tests near "the fall's ending is read as any change". It fails on today's order: the `reached` is missing from the move's command.
2. `src/rules/chronicle.ts`: the swap in `apply`, and the docblocks that state the order. The new test passes, the rest of the rules suite stands.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof is the new rules test; no e2e spec proves the line.
- CI proves the whole e2e suite on the push; `e2e/ending.spec.ts`, `e2e/victory.spec.ts` and `e2e/capstone.spec.ts` are the ones that read the reordered walk, listed for the hand-back.
