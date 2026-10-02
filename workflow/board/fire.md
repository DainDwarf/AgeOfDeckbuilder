# Fire

**Line:** **Fire** — the Stone Age's catalogue holds the technology Fire, needing Settlement, its achievement counting toward a need of 3 the turns on which five cards were played and paying 1 influence, and the card Fire, one copy unlocked; a goal counting such turns is proven once on the fixture; a plate's goal says its need and wraps at the plate's width; `npm test` passes with the catalogue's coherence tests, and `e2e/hand-aim.spec.ts` plays Fire on screen. Doc-impact: `docs/ages/STONE.md`, `docs/META-SCREENS.md`, `docs/META.md`.

**Spec:** `docs/CHRONICLE.md` _Cards_ (the instant, and the paragraph on a card aimed at the hand), `docs/CHRONICLE-SCREEN.md` _The hand and the aim_ and `docs/META.md` _The campaign_ (the tally) stand as the spec and do not change beyond the sentence below. The sentences this line writes:

- `docs/ages/STONE.md`, the head line, in place of "What the Stone Age is made of: its land.": "What the Stone Age is made of: its land, its technologies and its cards."
- `docs/ages/STONE.md`, a new section after _The land_, `## The technologies 🔧`: "A goal is practice: it is done with the cards of the technologies its technology needs, and one whose technology needs Settlement alone with the deck the age opens on." Then one item: "**Fire** needs Settlement. Its goal counts a deed: the turns on which as many cards were played as a hand is drawn to, a hazard paid for among them, each turn once however many more are played, and the settle phase never. It unlocks the card **Fire** and pays influence. Turns ended on an empty hand was rejected: the deck has no floor, and an empty deck ends every turn on one."
- `docs/ages/STONE.md`, a new section after it, `## The cards 🔧`, one item: "**Fire**, an instant costing nothing, aimed at another card of the hand: that card is discarded and the city gains science. A hazard discarded so does not strike that turn, and comes around again. Science has its source here, and nothing in the age costs it."
- `docs/META-SCREENS.md` _The campaign screen_, the plate's paragraph, after "what a reward does not hold it does not read.": "A condition longer than the plate's line wraps beside its word, onto as many lines as it takes, each starting where the first does, and the reward stands under the last." And in place of "Every plate of the tree is as tall as the tallest.": "Every plate of the tree is as tall as the tallest would stand read, an unknown technology's among them, so no plate changes height as the tree is learned."
- `docs/META.md` _The campaign_, in place of "the player is told the goal, the achievement's condition in words, and the reward": "the player is told the goal, the achievement's condition in words with the need it counts toward where that is more than one, and the reward".

The player-facing entries, each ending in no period:

- The technology's name: "Fire". The card's name: "Fire".
- The card's rules entry: "Discard another card. Gain 1[science]".
- The goal's entry, its need filled from the achievement: "Play 5 cards in a single turn, {need} times", which reads "Play 5 cards in a single turn, 3 times".
- Nothing else is new: the line over the hand while Fire is being aimed is `aim.hand`'s, Fire alone in the hand is refused with `refusal.hand`'s, and the plate's reward reads through `plate.cards` as "1 [card:fire]".

**Doc-impact:** `docs/ages/STONE.md`, `docs/META-SCREENS.md`, `docs/META.md`.

**Scope:** In: the technology, its achievement and the card in the Stone Age's content; the rules helper the goal's counting needs, with its one test on the fixture; the plate's goal saying its need and wrapping; the three pages; the spec that plays a card aimed at the hand on screen.

Out: the three other doors; the pinned achievement's ledger; the tree's columns and the plate's width, which stays 236; anything costing science; the hand's size.

The numbers, all provisional and to be played: five cards, a need of 3, one copy of Fire, 1 influence, 1 science gained, no cost.

Corners decided at intake:

- The goal counts cards played and nothing else. A hazard paid for is a card played. A play the rules refuse is none. A card recalled and played again is played twice.
- A turn counts once, on its fifth play, however many more follow.
- The settle phase is not a turn: nothing played on it counts.
- Fire is blocked while the hand holds no other card. It discards whatever card is chosen, a hazard or a single-use card included, and a card discarded comes around again. The science is gained after the discard.
- The five stands typed in the goal's sentence, as a reward card's amounts stand typed in its rules entry; the need alone is filled from the content.
- The plates' shared height counts every technology's plate as if it were read, as it does today, so on a campaign where Fire is still unknown the plates already stand at the height its two-line goal sets.
- A campaign begun before this line needs nothing: one that has learned Settlement finds Fire available, and a chronicle in progress keeps the achievements it was launched with.

What the reconcile chose:

- The plate's goal wraps through the layout a card's rules text wraps through. The difference kept on purpose: a card centres its lines, a plate's start at the left beside the label.
- The goal's need fills its sentence the way a card's counters, an answer's readings and the plate's copies fill theirs.
- The goal goes through the tally as it stands; the counting is the one new helper.
- The card is the hand aim and the discard that already stand, with the gain the reward cards use.

**Traps:**

- `achievementGoal` in `src/ui/text.ts` is called by `src/ui/tree.ts`, by two tests of `src/content/catalogue.test.ts` and by `e2e/tree.spec.ts`, and `text` throws on a placeholder handed no value: every caller hands the need once a goal's entry holds `{need}`.
- The height every plate shares is computed in `src/ui/tree.ts` before any plate is drawn, from line counts that need no font; a goal's line count is known only once the sentence is measured in the plate's font.
- `layOutRun` (`src/ui/text-run.ts`) places each glyph and name from the middle of its own line and names the line it stands on, as a centred Text draws; the plate draws its one line from the left and reads no line. A wrapped goal's marks and the zones its names answer on have to stand on their own line.
- `docs/PHASER.md` _Rendering under WebGL_: what a Text's `wordWrap.callback` is handed and when it runs, and that a line is centred on its width ceiled to the pixel.
- An effect aimed at the hand is handed the chosen card's place in the hand as the paid chronicle holds it, the played card already out of it (`Aim` in `src/rules/catalogue.ts`, and the fixture's card that discards).
- A tally's closure is handed the chronicle the command started on and the stages it resolved as; `plays` in `src/rules/stages.ts` answers the cards a command played, a hazard paid for among them, and an end of turn or a take plays none.
- The coherence test asks every achievement for its tally after an end of turn on an empty tally and wants integers back, so the counting answers a tally with no name in it.
- The Stone slice brings no card and no technology yet, and owns no achievement. A chronicle carries Fire's achievement only when launched with Settlement learned; the specs and tests that launch with nothing learned never read it.
- The catalogue's version has stood at `'1'` through every content line and this one does not move it.
- In a spec, `launchedOn` in `e2e/chronicle-screen.ts` launches in the first age on a civilization handed in, and a deck holds cards of any age. On screen a card aimed at the hand is being aimed from its second click, where it lies, and the next click on another card of the hand is the play.

**Plan:** Three steps, each its own commit, the first two inert.

1. `src/ui/text.ts`, `src/ui/tree.ts`, every place a goal is read, and the `docs/META-SCREENS.md` and `docs/META.md` sentences: a goal is read with its achievement's need, a goal longer than the plate's line wraps beside its label with the reward under it, and the shared height counts the goal's lines. On today's content nothing moves on screen.
2. `src/rules/`, with the fixture and one test: a goal that counts the turns on which a number of cards were played, proven on the fixture's own numbers — a turn counted once, a hazard paid for counted, the settle phase not.
3. `src/content/stone.ts`, the entries in `src/ui/text.ts`, `docs/ages/STONE.md`, `e2e/hand-aim.spec.ts`, and the board line and this file deleted: the technology, the achievement and the card stand in the catalogue, and Fire is played on screen.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/hand-aim.spec.ts`. The visual check on the campaign screen, on a campaign with Settlement learned, where Fire's plate stands available with its goal on two lines and its reward under it, and on a new campaign, where Fire reads ???. CI proves on the push: `e2e/tree.spec.ts`, `e2e/campaign.spec.ts`, `e2e/launch.spec.ts`, `e2e/ending.spec.ts`.
