# Victory on the act

**Line:** **Victory on the act** — a capstone's condition is read after every change from its landing on, as the population fall is, and the chronicle ends in victory on the spot; `docs/CHRONICLE.md` and `docs/ages/NOMADIC.md` say so, a rules test holds it on the fixture, and the victory spec wins a chronicle on a play. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`.

**Spec:** `docs/CHRONICLE.md` → _Events and the capstone_, and `docs/ages/NOMADIC.md` → _The capstone_. This line changes a decision: the condition was read once a turn, at the end of it. The sentences, written out:

- `docs/CHRONICLE.md` → _Events and the capstone_, the paragraph opening **The capstone is not an event.** Replace, from "**A capstone names what passes it**" through "The city's fall before that is defeat.", with:

  > **A capstone names what passes it**: a condition of its own, read on the chronicle after the capstone's landing and after every change from then on, as the city's fall for its population is read; the chronicle ends in victory on the spot, on the first change after which the condition holds, nothing resolves after it, and it carries the ending as it carries a defeat. So a building that passes a trial ends the age the moment it stands, mid-play, whatever the card would have done after; a condition an enemy phase meets ends it on that change, whoever moved; and one already holding when the capstone lands ends it on the landing, before the draw — the turn's tick and the timeline's roll on the capstone's turn read nothing, the landing is the first read. A span is a condition on the turn, passed when the turn ticks past its last, and a trial with no span has no last turn to run out: the schedule keeps dealing until the condition holds or the city falls. The city's fall before that is defeat. A read at the end of the turn alone was rejected: the first chronicle ends on the player's act, and a condition read once a turn ends the age a turn late.

- `docs/CHRONICLE.md` → _Events and the capstone_, the paragraph opening **Enemies enter from camps.** Replace "nothing after the captures resolves, the victory included, until every camp's reward is taken, and the one taken is laid in the discard pile" with:

  > nothing after the captures resolves until every camp's reward is taken, the victory a turn's tick brings included, and the one taken is laid in the discard pile; a condition the capture itself meets ends the chronicle on the capture, and its rewards are never dealt — the deck no longer matters

- `docs/ages/NOMADIC.md` → _The capstone_. Replace "The chronicle ends in victory the turn the shelter stands." with:

  > The chronicle ends in victory the moment the shelter stands, in the middle of the play that builds it.

Player-facing text the line foresees, all stand-in placeholders in `src/ui/text.ts` for the stand-in capstone the spec needs, keyed as the stand-in's other capstones are: its name `PH_Tillage`, its rules entry `Lands nothing. A farm the city holds passes it.`, its victory line `The farm stands.` No text of the real age changes: `rules.shelter` and `victory.first-shelter` already say the age ends when the shelter stands.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`.

**Scope:**

In: the read after every change from the landing on, for every command alike — a play, a move, an attack, an act of the city's, the end of turn, a take; the span helper moved to "past its last turn"; the tests whose expectations fix the old turn moved to the design; a stand-in capstone passed by a farm standing on a held tile, with a stand-in schedule landing it early, so the screen path is walked by a spec; the victory spec extended with a chronicle won on a play; the two docs edits; the board line deleted.

Out: any change to what the ending screen reads or how it rises — it rises on the stage that ends the chronicle, wherever that stage comes; the real age's content and text; any content of the fixture catalogue beyond what the tests need.

Corners, decided:

- **The read begins at the landing, not the turn.** On the capstone's turn the tick, the units' refresh and the timeline's roll come before the landing and read nothing; the first read is after the landing, whether or not the landing changed anything. A condition already holding then ends the chronicle on the landing, before the draw.
- **A victory mid-play cuts the play.** The card is already discarded and its cost paid when a building stands, so the ending follows the change that placed it and the rest of the card's effect never resolves. Nothing else is undone.
- **A span is passed when the turn ticks past it.** The stand-in sieges end on the tick into the turn after their last, and the ending records that turn: one more than today, which no player sees, the victory screen reading no turn.
- **A capture that meets the condition ends the chronicle on the capture**, rewards never dealt. A span's victory still waits on the rewards, since the tick comes after the take.
- **Defeat is unchanged**: the population fall already reads on every change, and a capture still ends the chronicle at the enemy phase's opening as it does today. Where a change both empties the population and meets the condition, the fall wins: it is read first and nothing resolves after it.

**Traps:**

- The population fall is read in the one landing helper of `src/rules/stages.ts`, which sees no catalogue; the capstone's condition needs the catalogue to look the capstone up, and `src/rules/` never imports content — it is an argument, `docs/DOGMAS.md` → _Code_. One choke point per invariant: the victory's read must not become a check at each call site.
- The chronicle carries no mark that the capstone has landed: the timeline holds the capstone's turn only, and on that turn the tick and the roll precede the landing. "The turn is reached" and "the capstone has landed" are two facts, and the read wants the second.
- `followed` in `src/rules/stages.ts` resolves nothing past a chronicle that carries an ending, so an `ended` raised mid-sequence cuts the rest by itself; the end of turn's `opened` step reads the condition today and must not read it a second time.
- The span helper in `src/rules/schedule.ts` is used by the fixture siege in `src/rules/fixtures.ts` and by both stand-in sieges in `src/content/stand-in.ts`; every siege moves together.
- Tests pinning the old turn: in `src/rules/schedule.test.ts` the siege walks, the reward-holds-the-victory test, the tillage tests near the end of the file, and the e2e `victory.spec.ts` expecting turn 3. Tests follow the design, never the other way.
- The stand-in coherence test in `src/content/stand-in.test.ts` reads every capstone's name, rules entry and victory line through `src/ui/text.ts`; a stand-in capstone without its three entries fails there before any spec runs.
- The overlay in `src/ui/overlay.ts` raises the ending on the first stage whose chronicle carries one, and plays a `played` group through its own play-out; whether an `ended` change nested in that group reaches the rise, after the card's landing has played, is what the spec checks — a rise that pre-empts the card's play-out, or never comes, is a defect of this line.
- A hook refuses `npm run e2e` from a session; the spec runs alone.

**Plan:**

1. `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md` — the sentences above; leaves the design saying what the code is about to do.
2. `src/rules/` — the condition read after every change from the landing on, in the one place every change passes; the span helper moved to "past"; the end-of-turn read gone; leaves `npm run check` green and the rules tests failing only where their expectations pin the old turn.
3. `src/rules/schedule.test.ts` — the pinned expectations moved to the design; one test on the fixture that a tillage built by a play ends the chronicle in victory on that play, its stages ending on the `ended` right after the building stands; one that the condition holding at the landing ends it on the landing, the tick and the roll of that turn having read nothing; leaves `npm test` green.
4. `src/content/stand-in.ts`, `src/ui/text.ts` — the stand-in capstone passed by a farm standing on a held tile, landing nothing, and a stand-in schedule landing it early; its three text entries; leaves the stand-in coherence test green.
5. `e2e/victory.spec.ts` — the existing test's turn moved; a second test opening on that schedule, past the landing, playing the farm inside the border, and reading the victory screen risen and nothing logged; leaves the spec green.
6. `BOARD.md` — the line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/victory.spec.ts`.
