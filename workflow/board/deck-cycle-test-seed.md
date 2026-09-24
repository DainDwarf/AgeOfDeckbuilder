# The deck-cycle test hangs on its seed

**Line:** The deck-cycle test hangs on its seed — "every card of the deck is in exactly one pile through a full cycle" (`src/rules/chronicle.test.ts`) holds only on a seed that deals a raid at every deal for eight turns, so any change to the generator's draws can break it again. Done when that test opens on a chronicle whose timeline deals nothing, on ground the test authors, names no launch seed and wants no deal, and `npm test` passes.

**Spec:** `DOGMAS.md` → _Testing_: a test asserts a rule a player could state, on a synthetic fixture pushed through the real code path; a fixture goes through the transform production uses. The rule this test states is unchanged: through a full cycle of draws, plays, discards and reshuffles, every card of the deck stands in exactly one of the draw pile, the hand and the discard pile. No player-facing sentence.

**Doc-impact:** none — one rules test changes its fixture; no rule, no content, no page changes.

**Scope:**

- In: that one test. It opens through the fixtures' opening on a disc of plain the test authors, with that opening's default timeline, which deals nothing; it settles the city on the centre tile and ends the settle phase through the rules, then runs the same eight turns: play the first card of the hand aimed at nothing, refused or not; end the turn; every card is in exactly one pile, the same cards as the deck the settle phase left. The assertion that this deck holds as many cards as the fixture deck stays.
- The test's title stays verbatim.
- Out: every other seeded launch in the tests — `chronicle.test.ts` (the hand holds five cards…, seed 4242) and `cards.test.ts` (a chronicle begun on a deck of the catalogue…, seed 2026). They were read at intake as counting the hand and the opening deck only, not measured; they are not touched.
- Out: the fixture schedule, the events, the generator.
- Measured at intake: on the rolled launch, the test held on 122 of seeds 1–300. The failures are the fixture Blight dealt, whose first answer lays a Hunger and grows the deck. The deal-free version above passed when run once from a scratch file.

**Traps:**

- The fixtures' ready-made launch (the one the test uses today) rolls a map and a timeline from the seed and can stop on a deal; the fixtures' opening on handed-in tiles begins the chronicle through the rules with a timeline that deals nothing unless the test names one. The first is the source of the fragility.
- A chronicle waiting on a deal refuses every other command, which is why the turn is ended through the fixtures' one end-of-turn helper, with nothing wanted.
- The settle phase is not a turn: the first end of turn after the settle is what leaves turn 1 with a drawn hand; the deck is read after it, as today.

**Plan:**

1. `src/rules/chronicle.test.ts`: the test rewritten as Scope says, its imports trimmed of what it no longer uses and extended by what it now does. Leaves the test green on a chronicle that deals nothing and names no launch seed.

**Verify:** `npx vitest run src/rules/chronicle.test.ts`, then `npm test`, `npm run check`, `npm run lint`. The spec that proves the line: none — it never reaches the screen. CI's specs on the push: the whole Playwright suite, none of it walking this path.
