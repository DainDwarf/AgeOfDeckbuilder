# The settle phase

**Line:** **The settle phase** — the glossary names the settle phase, no `docs/` page, `src/` or `e2e/` file says turn 0, and the chronicle screen marks the phase: the map's frame and a chip in the phase's own colour, and the end-turn button in it reading the phase.

**Spec:** the settle phase is not a turn. The glossary's **turn** row already says so — a turn is one pass of the cycle, and none of the cycle runs on the settle phase — so the chronicle opens on the settle phase, before its first turn, and turn 1 is the first turn. The turn counter inside the state keeps standing at zero on the settle phase: it is a development internal, outside the vocabulary. The mockup the choices were made on: https://claude.ai/artifact/DZciU1qaPLEKbwmLDhp4T7 (frame and chip, lime, `End settle phase`).

`docs/GLOSSARY.md`, one row after **phase**:

| **settle phase** | The chronicle's opening, before its first turn: the city stands nowhere, the hand is dealt from the settle section, and none of the cycle runs. | turn 0, turn zero, opening turn, setup, deployment |

`docs/CHRONICLE.md` → _The turn_, the opening paragraph, replaced whole:

> A chronicle is a sequence of **turns**, and it opens before its first on the **settle phase**: the map is dealt and the timeline rolled, the city stands nowhere yet and has no population, the map's **centre part** — the tiles within a radius of the disc's centre the region names — is in sight for the whole of the phase and nothing else is, and the hand holds the deck's settle cards, in the deck's order, played on this phase and no other: the one that **settles** the city on a charted tile that takes a city, and the ones that enter the band's first units beside it. An age adds settle cards to the section and nothing else, and a settle card played leaves the chronicle instead of going to the discard pile. The settle phase is not a turn: none of the cycle below runs on it, and no unit moves or attacks on it — a unit entered on the settle phase stands where it entered until turn 1. It is ended as a turn is, refused while the city stands nowhere, and the settle cards still in hand are gone with it. Turn 1 follows, its events phase and draw as on any turn. Each turn, in this order:

`docs/CHRONICLE.md` → _Sight_, the sentence on the centre part:

> **On the settle phase the centre part of the map is in sight**, and it is the only sight there is: nothing sees on the settle phase — not the city once it stands, not a unit entered on it — so nothing is charted before turn 1 but the centre part, and the settle is chosen on what it shows. From turn 1 the city and its units see for themselves, and the centre part falls into fog wherever they do not.

`docs/CHRONICLE.md` → _Cards_, the opening paragraph's exception: "The deck's settle cards are the exception: in hand when the chronicle opens, played on the settle phase alone, they never cycle — a settle card leaves the chronicle once played, and the end of the settle phase takes the ones left in hand." The **Settle** kind's item: "in hand on the settle phase alone, gone once played". _The map_, the seventh layer: "it is what the chronicle sees on the settle phase and where the settle lands."

`docs/CHRONICLE-SCREEN.md` → _The chronicle screen_, the settle paragraph, replaced whole:

> **On the settle phase** the chronicle screen shows the centre part and nothing else, the hand holds the settle cards, no tile wears the city's ring, and the end-turn button reads the phase and is dead until the city stands. The map's frame drawn in the settle phase's own colour, a chip naming the phase where city mode's chip stands, and the end-turn button filled in that same colour are how the chronicle screen shows the phase is on; the chip answers no press, and all three go as the turn ticks to turn 1. City mode is not entered while the city stands nowhere: the city key and the two readings that enter it do nothing. Entered once the city stands, its own frame and chip stand in place of the settle phase's until it is left, and the button keeps the phase's colour.

`docs/CHRONICLE-SCREEN.md` → the pointer paragraph, its second sentence's opening: "The end-turn button reads `End turn` whenever the pointer stands on it while it is live, `End settle phase` on the settle phase: the next turn rolls in on the button during the end of turn's play-out, …" — the rest unchanged.

`docs/DESIGN.md` → _Launching a chronicle_: the **Deck** item ends "and its **settle cards**, played on the settle phase alone."; the sentence after the list reads "The four choices lead to the settle phase: the chronicle opens unsettled, and its first act is the settle."

`docs/ages/NOMADIC.md` → _The settle_: "The settle phase is the two acts the age is named for: choose where to stop, and send someone out."

`workflow/ROADMAP.md`, v0.0.4: "and the chronicle opens on the settle phase."

Player-facing sentences, each one entry of the text table: `Settle phase` — the end-turn button idle on the settle phase, and the chip; `End settle phase` — the end-turn button hovered on the settle phase. No other sentence.

**Doc-impact:** `docs/GLOSSARY.md`, `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/DESIGN.md`, `docs/ages/NOMADIC.md`.

**Scope:** In: the glossary row and the page edits above, verbatim; every "turn 0" in `src/` and `e2e/` — docblocks, comments, test titles — says the settle phase instead, and the four places that compare the turn to zero read one shared answer named for the settle phase; the chronicle screen's marks: the map's frame in the settle phase's colour, lime `0x9fbb3a`, drawn with city mode's stroke and inset, the chip at city mode's chip's place in that colour reading `Settle phase`, inert — no press, no hand cursor; the end-turn button filled in that colour on the settle phase, reading `Settle phase` idle and `End settle phase` hovered, the accent and `Turn N` / `End turn` from turn 1 on. Out: what the settle phase does — nothing in the rules changes; the state's shape — the counter stays; the changelog, which a rename sweep skips. Corner cases: city mode entered on the settle phase, once the city stands, shows its own frame and chip and hides the settle phase's, and leaving it brings them back; the button keeps the lime through city mode, since it reads the phase, not the mode. The roll at the end of the settle phase carries `Settle phase` out and `Turn 1` in as any roll does, and the button's fill switches to the accent when the incoming label starts rising, with no tween on the colour. The frame and chip go down at the render that carries turn 1, as city mode's marks do, without a fade. The capstone window at the opening stands over the marks under its scrim, as it stands over everything.

**Traps:** The end-turn button is measured once at its widest label, so `End settle phase` sets its width on every turn; it is measured at the widest of the four. City mode's frame and chip stand at depth 2, and the settle phase's marks at the same depth would draw in add order under it — hence hidden, not layered. `e2e/settle.spec.ts` asserts the button's label with the `Turn {turn}` entry at turn 0 twice, and `e2e/hover.spec.ts`'s `open` ends the settle phase by clicking the button before its label assertions; `e2e/play-out.spec.ts` reads the button after the settle and is untouched. The rules tests titled on turn 0: three in `chronicle.test.ts`, three in `sight.test.ts`, one each in `cards.test.ts`, `enemies.test.ts` (typographic apostrophe) and `schedule.test.ts`; comments in `city.test.ts`, `fixtures.ts`, `catalogue.ts`, `state.ts`, `chronicle.ts` (five docblocks), `sight.ts`, and in `e2e/chronicle-screen.ts` (five), `fog.spec.ts`, `hover.spec.ts`, `menu.spec.ts`'s title. The glossary lint hook scopes the text table and the changelog alone: the sweep of `src/` and `e2e/` is checked by the search under _Verify_, not by the hook. `chronicle.turn === 0` is not the phrase "turn 0" and the search does not find it: the four sites are `chronicle.ts` (three) and `sight.ts` (one).

**Plan:**

1. `docs/GLOSSARY.md`, `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/DESIGN.md`, `docs/ages/NOMADIC.md`, `workflow/ROADMAP.md`: the edits under _Spec_, verbatim; `npm run lint` green on the markdown.
2. `src/rules/`: the prose says settle phase, the four comparisons read one shared answer; the test titles retitle; `npm test` green.
3. `src/ui/`: the two text entries; the end-turn button's four labels and its fill by phase; the settle phase's frame and inert chip, shown on the settle phase, hidden while city mode is on; `npm run check` green.
4. `e2e/`: the comments and titles say settle phase; `settle.spec.ts` asserts the button's new label, that the frame and the chip stand on the settle phase and that both are gone once turn 1 stands; `hover.spec.ts` holds.
5. The board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; `npx playwright test e2e/settle.spec.ts` and `npx playwright test e2e/hover.spec.ts`; a search for `turn 0` (case-insensitive, and `turn zero`) over `docs/`, `src/` and `e2e/` returns nothing; the `visual-check` pass on the settle phase — the frame, the chip and the lime button — and on city mode entered after the settle card is played.
