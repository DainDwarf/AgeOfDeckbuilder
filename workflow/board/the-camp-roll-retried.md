# The camp roll retried

**Line:** **The camp roll retried** — every age's camp rolls at 0.04 and waits five turns, after it comes to stand and after each enemy its roll enters, before it rolls again; the wait is held by one test on the fixture and carried by the save, `docs/CHRONICLE.md` says a camp waits, the camps baseline is rerun on the new numbers and `CAMPS.md` reads from it. Doc-impact: `docs/CHRONICLE.md`.

**Spec:** `docs/CHRONICLE.md` → _Enemies and camps_, the paragraph opening "**A camp enters on its own too**". After its last sentence, "the odds are content.", add: "A camp that has just come to stand, or whose roll has just entered an enemy, waits as many turns as the content names before it rolls again." No other page changes: `docs/ages/STONE.md` _The camps_ and `docs/ages/NOMADIC.md` _The camps_ describe the roll without a number and stay as they are.

The numbers, the user's pick on 2026-10-26 among seven retries run at intake on the pass's cells: both ages' camps roll at 0.04, down from 0.08, and wait 5 turns; the Nomadic Age takes the same numbers unmeasured, on the user's word. The retry as measured, 120 chronicles against the baseline's 120:

|  | Captured | Builder / Warlord | Capture turn, median | First capture | By turn 15 | By turn 20 | Neutral fell | Neutral's fall, median | Enemies killed, median | Own units lost, median |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline, flat 0.08 | 85 | 50 / 35 | 21 | 9 | 20 | 38 | 27 | 21 | 4.5 | 4 |
| Flat 0.04, wait 5 | 33 | 25 / 8 | 40 | 14 | 1 | 1 | 7 | 39 | 6.5 | 3 |

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

- In: the wait as a rule of the roll, held by the content's number; the number on both ages' camps; the catalogue refusing a wait below nought or not whole, as it refuses odds outside nought and one; the mark the wait reads, carried in the chronicle and through the save; the one test on the fixture per rule below; the docs sentence; the baseline rerun and `CAMPS.md` rewritten from it.
- Out: the wave, two sent from three guards, unchanged on the user's word; the pillager and the roll's table; a rate rising with the turn, measured and not taken; the Nomadic Age's own measurement, which the events pass gives; the `BALANCE.md` entry on the neutral, the user's call at the hand-back.
- The wait, in the rules' terms: a camp is marked with the turn it came to stand on and again with each turn its roll enters an enemy; at an enemy phase a camp rolls only if the chronicle's turn, as the phase reads it, is at least the mark plus the wait. The opening's camps are marked with the opening's turn. A camp comes to stand three ways, the generator's deal, an answer placing one and the neutral's city falling to the enemies, and all three mark it: "a camp is a camp in everything however it came to stand". The retry marked only the roll's entries and let a camp placed later roll at once, so that corner is unmeasured; with events off no answer placed a camp, and the neutral fell in 7 of the 120 chronicles, late.
- A waiting camp still draws once from the seeded generator, as a camp whose draw misses does, so seed _n_ keeps dealing the same chronicle under cells that differ only in what the camps do; the retry kept the draw, and the baseline comparison rests on it.
- A raid entering through a camp as its door marks nothing: its enemies are no camp's. A camp captured leaves the map with its mark; a camp placed later on that tile starts fresh.
- A wait of nought is no wait: a camp rolls at every phase as today. The fixture's camp names nought, so every standing test at odds of one stands.
- Reconcile: nothing to reconcile in the player's terms. No tile keeps a turn today; the chronicle's two turn facts, the shown turn and the timeline, name other things; where the mark lives, on the tile row or a row of its own, is the implementer's, with the Architecture dogma's one-row-per-change as the constraint.

**Traps:**

- The trial patch that measured the retries sat on `src/rules/chronicle.ts` and was reverted at this dossier's commit. `git status --porcelain src/rules` printing anything at the ship's start is a finding.
- `src/rules/save.ts` rebuilds a tile field by field (`tileOf`) and the snapshot copies tiles; a mark kept on the tile and not written there is lost on reload and a reloaded camp rolls at once. `save.test.ts` holds the round-trip tests the new one goes beside; a chronicle with a camp mid-wait is the fixture.
- Three places make a camp stand: the generator fills the camps' building slots in `src/rules/map.ts` and the launch enters their opening guards in `src/rules/chronicle.ts`; an answer places one through `guardedCampPlaced` in `src/rules/schedule.ts`; the neutral's fall to the enemies puts the age's camp in its slot in `src/rules/chronicle.ts` near the capture. One choke point marks a camp, not three sites.
- `campsRolled`'s docblock in `src/rules/chronicle.ts` says each camp draws once whatever its odds; the wait keeps that true and the docblock is re-shaved to the trap it states.
- `CAMP` in `src/rules/fixtures.ts` names the camp's fields; a required field lands there too, and `camping(...)` in `src/rules/enemies.test.ts` spreads `Partial<Camp>` over it. `encamped(...)` in `src/rules/catalogue.test.ts` is where the refusal test goes, beside the odds one.
- The Architecture dogma: a change moves one row. An enemy entering is the unit row's change; the mark changing is another row's or rides where the implementer's shape puts it, never two rows in one change.
- The baseline's cells, flags and split are in `workflow/CAMPS.md` _The cell_ and `workflow/ECONOMY.md` _The cell_; six cells of 20 seeds at eight processes took about 15 minutes on this machine on 2026-10-26, run in the background. The queries in `CAMPS.md` _Comparing a change_ read the rerun; `union_by_name=true` on every `read_csv` of a split folder.
- No spec reads the roll: a camp's entry was never asserted on screen at odds of 0.08 and is not at 0.04 with a wait.

**Plan:**

1. The mechanism, one inert commit: the camp's wait as a field of the content's camp, both ages and the fixture naming nought; the catalogue refusing a wait below nought or not whole, with its test; the mark in the chronicle, set where a camp comes to stand and where its roll enters, read in the roll, written and read back by the save; the tests on the fixture — at odds of one and a wait of two a camp standing at the opening enters nothing until the wait has passed, enters then, and waits again after; a camp placed by an answer or left by the neutral's fall waits from the turn it came to stand; a waiting camp steps the generator as a missed draw does; the save round trip. The docs sentence lands here, the rule existing from this commit. `npm run check`, `npm test`, `npm run lint` green; the content plays as today.
2. The content and its measurement, one commit: 0.04 and 5 on both ages' camps in `src/content/stone.ts` and `src/content/nomadic.ts`; the six cells rerun into a scratchpad folder per cell and the folders under `workflow/camps/` replaced; `CAMPS.md` _What the baseline says_ rewritten from the rows through the page's recipes — the measured-on line, the table and the paragraph under it, the first sentence of the page's opening naming the camps' numbers as they now stand; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — nothing on screen changes; the camps' entries were never asserted by a spec. CI proves on the push every spec that deals camps: `camps`, `siege`, `pillage`, `neutral`, `strangers`, `predators`, `ending`, `fog`.
