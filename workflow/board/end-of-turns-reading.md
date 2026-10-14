# The end of turn's reading

**Line:** **The end of turn's reading** — the resource bar reads, after each value, what ending the turn would do to it: for a stock the income less what the hand's strikes take, for idle the population growth brings or the strikes take, in a colour of its own where a stock cannot cover the strikes; the reading is the end of turn's own run, held by one fixture test, and one spec reads the bar against it. Doc-impact: `docs/CHRONICLE-SCREEN.md`.

**Spec:** `docs/CHRONICLE-SCREEN.md` _The resource bar_. After the section's first sentence ("The resource bar reads food as the stock over the growth threshold…"), these sentences, as a paragraph of their own:

> After each value, at a smaller size, the bar reads what ending the turn now would do to it. A stock reads the income less what the hand's strikes take, signed: `+1`, `−2`. Idle reads the population growth brings or the strikes take: `+1`, `−1`. A stock the strikes take past nothing reads the whole of what it cannot cover, `−6` on a stock of nothing, in the colour of a stock taken past nothing, and the idle reading of the population taken is in that colour too. Nothing is read where the end of turn changes nothing. The reading is the end of turn's own run on the chronicle as it stands, the stocks read as the strikes leave them, before growth spends food, and idle read after growth. It stands on every turn the screen stands on, never on the settle phase nor while a deal stands, and is down from the End turn press until the screen stands on the next hand.

The colour: `docs/CHRONICLE-SCREEN.md` names it as above; its `LOOK` entry is named for that meaning, a stock taken past nothing, and takes the unaffordable mark's value until v0.0.6 redoes the look. It is not the unaffordable mark: the user ruled the two meanings apart (a cost a stock cannot pay; a strike that takes a stock past nothing and a person with it).

Player-facing text, in `src/ui/text.ts`, keyed: the gain `+{count}` and the loss `−{count}`, the minus U+2212, the same width as the plus in the UI font. No plural forms. No tooltip changes: the readings' tooltips stay as they are.

The form, settled on the mockup (https://claude.ai/artifact/Dj128FcMFQWemHGMD2SiyG, inline, 13 px, two digits reserved, only where it changes, idle both, the demand past nothing): the change text sits after the value, one 18 px space's width past the value's right edge, on the value's middle line, at 13 px in the UI font, in the ink or in the colour above. Every reading's value slot widens by that space and `−00` at 13 px, so no reading ever moves; the slot is one width for all seven readings, as today. Measured in headless Chromium on the game's font: the slot goes from 46 to 74 design units, the bar's slack from 117 to −78, and the layout rule closes the seven gaps evenly from 22 to 11; nothing runs under the Menu button.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md` _The resource bar_.

**Scope:**

- In: one run in the rules that the end of turn goes through and the bar reads; what the bar reads off it; the colour entry; the two text entries; the page; the fixture test; the proof spec.
- Out: the growth cap of one a turn, the user's own question. Out: any card text, tooltip or codex line about the take; `workflow/IDEAS.md`'s codex jot carries it. Out: the neutral city, which the bar never reads.
- Reconcile, the colour: stays apart from the unaffordable mark, a new entry, by the user's ruling above.
- Reconcile, the run: the end of turn's first steps and the reading's run are one, defined once; the end of turn goes through it. Not a second helper composing the same steps.
- Reconcile, when it stands: the scene tells the bar the screen stands or plays out through the door the hand and the End turn button already take; the settle phase and a standing deal the bar reads off the chronicle.
- Corner, decided: a stock whose income and strikes net to nothing (income 2, a strike of 2) reads nothing: the end of turn changes nothing on it.
- Corner, decided: a fall reads as any take: two Hungers on a city of two read `−6` on food and `−2` on idle, in the colour, and the end of turn is the defeat. A strike that would come after the fall is never run, so it is never read.
- Corner, decided: on a turn where growth brings one, idle reads `+1` and food reads its income less its strikes, not growth's spend; the x/y already says the threshold is reached.
- Corner, decided: a value wider than the slot's two digits grows rightward into its gap and the change text goes with it, after the value's right edge, as the value does today; nothing moves.
- Corner, decided: in city mode the change text sits inside the reading's well with the value, over the gold act-waiting fill where idle's act waits; both colours read on the mockup, no special case.

**Traps:**

- **The stocks' reading stops before growth; idle's stops after it.** Growth spends food, and the food reading must not carry that spend, while idle's `+1` is growth's. The run exposes both the chronicle the strikes leave and the one growth leaves, or the implementer finds another shape; the two readings come from two points of one run. Under the shipped order a take and a growth never both happen in one turn: a take leaves the stock at nothing, and nothing grows on nothing but a city of no population, which is a fall.
- The shock floors a stock at nothing (`shocked`, `src/rules/cards.ts`), and no stage carries what a strike asked. The reading past nothing is the whole of what the stock cannot cover, so the run must say what each strike asked of each stock; the amount comes out of the content's strike function through its counter (Hunger's food counter is turn-dependent), so it is known only when the strike runs. Shape it so a strike's content changes nothing in the reading's code.
- The end of turn's course in `src/rules/chronicle.ts` runs income, strikes, discard, growth, enemy phase, captures, opening; the `grow` and `income` groups and each `strike` group are what the screen plays. The one run must leave those stages exactly as they are, in that order: the bar's `rise` ticks on the `income` and `grow` groups and claims their inner stages; the hand keeps its cards through the leaves before the discard; standing tests pin the stage names in order.
- The end of turn stops at an ending (`followed`, `src/rules/stages.ts`): on a fall mid-strikes the run's chronicle carries `ending`, and strikes after it never run.
- The bar's `render` is called for every settling leaf of a play-out and again when the screen stands; from inside the bar the two are alike. The scene already tells the hand and the End turn button when the screen stands (`stand`) and plays out (`playStages`), in `src/ui/chronicle-scene.ts`; the bar takes that door, and reads the change only while standing, on a turn past the settle phase with no deal standing (`onSettlePhase`, `deals`). Reading the change on an intermediate chronicle would double the income.
- The value slot is measured once (`digitSlot`, `src/ui/resource-bar.ts`) and `readingWidth` and `layOutBar` (`src/ui/bar-layout.ts`) place everything on it; the change's reserve is added there, at the change's style. The slack goes negative and the layout rule closes the gaps evenly; that is the measured, accepted fit. Nothing else in the layout changes.
- The change text is a second text object per reading, named so a spec can read it, after the value's naming (`reading-<key>-value`); its name is the implementer's.
- Phaser text: `docs/PHASER.md` for text metrics and the hit tests from the next frame; a text set to `''` still measures; the change text's width is never part of the slot.
- `src/ui/text.ts` is glossary-linted: **unaffordable** is the glossary's term for a stock not covering a cost, "short" is its forbidden synonym; the new entries are the signed numbers alone.
- `e2e/chronicle-screen.ts` already plants a Nomadic chronicle with hazards in hand (`hazardsAdded`, `leanSeason`, `settledOn`, `firstSeed`), opens a saved chronicle, ends a turn through the rules (`endedTurn`) and reads named objects (`readings`). The proof spec reads its oracle through the rules' run, never a literal.
- The e2e specs that read the bar by name and could feel the widened slot: `e2e/console.spec.ts` (`reading-food` bounds), `e2e/press.spec.ts` (`resource-bar`, `reading-food`, the paper between the bar's left end and food), `e2e/hover.spec.ts`, `e2e/city-mode.spec.ts` and `e2e/yields.spec.ts` (clicks on readings), `e2e/bad-air.spec.ts` and `e2e/strangers.spec.ts` (`reading-idle-value`). A click on a reading's name still lands; a bound read against a literal would move.
- `src/ui/look.ts`: a colour is named for its meaning; the new entry's value is the unaffordable mark's, borrowed until the look; the memory one-accent-is-not-a-palette holds that no new value lands before v0.0.6.
- No comments but for traps; no `TODO`; the dossier is not cited anywhere durable.

**Plan:**

1. `src/rules/`: the end of turn's first steps as one run the end of turn goes through, exposing what the bar reads: for each stock the income less what the strikes asked of it, the chronicle the strikes leave and the chronicle growth leaves. Its fixture test beside the strike tests: on a city with a Hunger in hand and food under what it takes, the reading's stocks equal the stock the end of turn's strike stage leaves, its population equals what the growth stage leaves, and the food reads the whole of what it cannot cover, below nothing; on a city whose income reaches the threshold, the stock reads the income alone and idle reads one more. Leaves the rules green and the end of turn unchanged in its stages.
2. `src/ui/text.ts`, `src/ui/look.ts`: the two text entries; the colour entry. Leaves the lint green.
3. `src/ui/resource-bar.ts`, `src/ui/bar-layout.ts` where the slot needs it, `src/ui/chronicle-scene.ts`: the change text per reading, the slot widened, the live door wired with the hand's and the button's, the change painted on render while standing on a turn with no deal, in the colour where the run says the stock is taken past nothing or a person is taken. Leaves the bar reading the run.
4. `docs/CHRONICLE-SCREEN.md`: the paragraph above.
5. The proof spec, `e2e/end-of-turn-reading.spec.ts`: a Nomadic chronicle planted with a Hunger in hand and food under it, opened; the change text of every reading equals the rules' run (food in the colour, idle `−1` in the colour, military `+1`, the rest empty); on the quiet first seed the stocks read their income and idle nothing; after End turn, the screen standing on the next hand, the readings read that hand's run. If the press spec's technique for reading a mid play-out state carries over cleanly, the change text is read empty during the play-out too; otherwise that is checked by eye at the hand-back and said so.
6. `workflow/BOARD.md`: the line deleted; this file deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Proof spec: `npx playwright test e2e/end-of-turn-reading.spec.ts`.
- CI on the push runs the whole suite; the specs listed in Traps that read the bar are the ones to watch at the hand-back: `console`, `press`, `hover`, `city-mode`, `yields`, `bad-air`, `strangers`, `broken-motion`.
