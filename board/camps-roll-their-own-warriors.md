# The camps roll their own warriors

**Line:** The camps roll their own warriors — inert, on the stand-in: once the enemies have acted, each camp whose tile is free rolls, one draw of the chronicle's generator each, whether the camp's unit enters on it, the odds a number on the catalogue's camp, nought on the stand-in and refused outside nought to one; the fixture proves it at one and at a seeded half. Doc-impact: `docs/CHRONICLE.md`.

**Spec:** `docs/CHRONICLE.md` → _The rules_ → _The turn_, item 7, and _Events and the capstone_, the paragraph opening "**Enemies enter from camps.**" Both already state the rule; this line makes the code match them. One sentence is added, written out:

- _Events and the capstone_, the camps paragraph. After "and the odds are content." add: "🔧 Until the deck is data the stand-in's camps roll at no odds: nothing enters on its own."

No player-facing text: the roll shows on screen as a warrior arriving on its camp, the way an event's warriors arrive, and the odds are read nowhere.

**Doc-impact:** `docs/CHRONICLE.md`. `docs/GLOSSARY.md` gains no row: _camp_, _enter_ and _free_ are the page's words already. `docs/ages/NOMADIC.md` holds as written: its camps paragraph defers to the rules.

**Scope:**

- In: the catalogue's camp carrying `odds`, a number from nought to one, the chance per free camp per enemy phase, constant through the chronicle; `catalogued` refusing one below nought or above one, in the one rejection vocabulary; one rules function owning the roll — every camp whose tile no unit stands on, in tile order, one draw from the chronicle's generator each, whatever the odds, the camp's unit entering on it through `enteredOnCamp` where the draw falls under the odds; the end of turn raising it once the enemies have acted and before the captures, one stage per warrior entered, carrying the camp's tile as a capture's stage does, and no stage for a camp that entered nothing; the map playing that stage as it plays an event's arrivals; the stand-in at nought; the fixture at nought, its roll tests handing `apply` a catalogue of their own at one and at a half.
- Out: odds that shift with the turn — the escalation is the event's, and the Nomadic camp pressure escalates by the rival band placing camps; a number above nought on the stand-in; a generator of the roll's own — the timeline has one for a promise the camps do not make, since which camps are free is play; any reading of the odds on the camp's card or anywhere on screen; the Nomadic camp content.
- Corner cases decided here: a camp at nought draws all the same, so the generator's walk never depends on the number, and a camp at one enters on every free camp, the draw still made. A warrior that walked off its camp during the phase leaves the tile free, so that camp rolls at the same phase. A camp a unit of the player's stands on is not free and rolls nothing, and the capture that follows finds it as it stood; a camp an enemy stands on rolls nothing either. A city that fell in the enemy phase rolls nothing: the end of turn ends on the capture. Turn 0's end runs none of the cycle and rolls nothing. The siege's second script at the tick stays exactly as it is; on a stand-in with odds above nought the two would coexist, and at nought only the siege enters. A warrior entered by the roll acts at the next enemy phase and no sooner: it is not on the roster the phase took, and the tick refreshes what is already full.

**Traps:**

- This line ships after "The capstone passes on a condition" and is written against the code that line leaves: `src/rules/schedule.ts`, `src/rules/state.ts` and `src/rules/fixtures.ts` change under it, and `reinforced` stays, called by `continued` at the tick. Where that line left something else, read the code, not this file.
- `endOfTurn` in `src/rules/chronicle.ts` raises the enemy phase through `raised`, returns on an ending, then raises the captures; the roll goes between the two. `staged` drops a stage whose chronicle did not change, and the roll's stages are one per warrior with a tile on them, so they go through `raised` as the captures do.
- `enteredFromCamp` in `src/rules/enemies.ts` is the raid's draw of one camp among the free ones; the roll is a draw per camp, not a draw of a camp, and reuses `enteredOnCamp` and `nextRng` on the chronicle's `rng`. Stepping that generator once per free camp per enemy phase moves every later draw on it — the reshuffle of the discard pile, the raid's camp, the siege's placement — so the stand-in on a given seed deals its later hands and its raiders elsewhere than today.
- The `play` switch in `src/ui/map.ts` has a `default` that answers nothing for a stage it does not name, and the typecheck does not object; a stage name missing from the `events`/`reinforce` case leaves the warrior standing on its camp with no arrival motion. At nought on the stand-in no spec sees a rolled warrior, so this case is checked by reading.
- `endedTurn`, `stagedBy` and `withUnits` in `src/rules/fixtures.ts` are bound to `CATALOGUE`, whose camp rolls at nought so every fixture that ends turns with free camps standing — `awaiting` in `src/rules/schedule.test.ts`, the captured-camp tests in `src/rules/enemies.test.ts` — keeps its meaning. A roll test builds a catalogue over `CATALOGUE` with odds of its own and the same version string, so `checkContent` passes, and hands it to `apply` directly.
- `src/rules/catalogue.test.ts` lays a change over the fixture through `changed` and expects `/^fixture: /`; the two odds refusals follow it.
- The e2e specs search their seeds through `firstSeed` in `e2e/chronicle-screen.ts` and find another where the generator's walk moved one. The four on a fixed seed hold: `e2e/camps.spec.ts` asserts the raid's warrior stands among the camps, `e2e/end-of-turn.spec.ts` reads its stage names off `apply`, `e2e/play-out.spec.ts` and `e2e/city-mode.spec.ts` read nothing a later draw moves.
- `src/content/stand-in.test.ts` asks the stand-in nothing of a number: `catalogued(STAND_IN)` covers the range.

**Plan:**

1. `src/rules/catalogue.ts` — `camp.odds`; `catalogued` refuses one below nought or above one, and its comment lists the rule with the others.
2. `src/rules/enemies.ts` — one function owns the roll as in _Scope_: the free camps in tile order, one draw each, the entry through `enteredOnCamp`, answering what the end of turn stages.
3. `src/rules/chronicle.ts` — the stage in the `Stage` union, carrying the tile; `endOfTurn` raises the roll after the enemy phase's ending check and before the captures; the stage list's comment names it.
4. `src/ui/map.ts` — the stage joins the arrival case.
5. `src/rules/fixtures.ts` and `src/content/stand-in.ts` — odds nought on both camps.
6. Tests — `src/rules/enemies.test.ts`: at one, every free camp enters a warrior, staged one per camp in tile order after the enemies' stages and ahead of the captures, each standing on its camp with the camp's unit's stats and its move points and action full when the turn ends; none on a camp the player's unit or an enemy stands on; a camp its warrior walked off during the phase rolls again; at nought nothing enters and no stage is raised; at a half the same seed enters on the same camps and the seeds differ; a city fallen in the phase rolls nothing; turn 0's end rolls nothing. `src/rules/catalogue.test.ts`: odds below nought and above one refused.
7. `docs/CHRONICLE.md`, the sentence as in _Spec_.

**Verify:** `npm run check`, `npm test`, `npm run lint`, and the specs by name: `npx playwright test e2e/camps.spec.ts`, `npx playwright test e2e/end-of-turn.spec.ts`.
