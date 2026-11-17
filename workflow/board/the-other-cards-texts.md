# The other cards' texts

**Line:** The other cards' texts — a number of population reads in a text as the number and population's glyph, on a card, an answer and a plate; a card doing two things reads a line to each; a trophy reads Gain before its amounts; Floodplain and Tribute read their shorter texts; `e2e/bad-air.spec.ts` passes.

The page every text below was picked on: https://claude.ai/artifact/4D9n5QCwA6a4g4kpqfuF1a, the 38 cards that place nothing shot bare from the game, each text laid out by the page with the game's font and wrap rule in the face's room, three lines 88.4 units wide. The user pasted its box under these settings: population as the number and its glyph, a line each, Gain before a trophy's amounts, the three answers and the goal following the cards.

**Spec:**

_`docs/LOOK.md`, The cast._ In the first paragraph, "population's sign for the idle count and for a worked tile" becomes "population's sign for the idle count, for a worked tile and for a number of population in a text". Add after the paragraph on a glyph's square and its outline:

> **In a text**, a number of a resource or of population reads as the number and the symbol's glyph right after it, with no word: on a card, on an answer and on a plate. A tooltip, a refusal's note and the ending's sentences draw no glyph and read the word.

_`docs/LOOK.md`, The cards._ Add at the end of the paragraph on the name, the text and the kind label, after "and the text stands centred in it.", before the kind label's sentence:

> A card that does several things reads a line to each, with no period between them.

The two doc sentences are Claude's, written at intake on the settled design.

_The text table (`src/ui/text.ts`), every entry that changes, written out._

- `rules.hunt`: `Remove [feature:deer] or [feature:cattle]\nGain 6[food]`
- `rules.fire`: `Discard another card\nGain 1[science]`
- `rules.embark`: `Move a unit onto [terrain:coast]\nBecomes [card:disembark]`
- `rules.disembark`: `Move a unit off [terrain:coast]\nBecomes [card:embark]`
- `rules.stores`, `rules.stone-stores`: `Gain 4[food] 4[production]`
- `rules.cave-paintings`, `rules.honour-the-dead`, `rules.bone-carvings`: `Gain 2[culture]`
- `rules.stone-cave-paintings`, `rules.stone-honour-the-dead`, `rules.stone-bone-carvings`: `Gain 4[culture]`
- `rules.dig-the-graves`: `Gain 4[money]`
- `rules.their-stores`: `Gain 2[food] 2[production] 2[military] 2[money] 2[science]`
- `rules.band-joins`, `rules.stone-band-joins`: `Gain 1[population]`
- `rules.sickness`, `rules.wolves`, `rules.cold-night`: `Kills 1[population]`
- `rules.floodplain`: `Removes one improvement or building`
- `rules.tribute`: `Takes {food}[food] {production}[production], more each time`
- `goal.bread`: `Have {need}[population]`

_The events' texts (`src/ui/event-text.ts`), every entry that changes._

- `answer-text.let-them-go`: `Lose 1[population]`
- `answer-text.bury-the-dead`: `Kills {population}[population]`
- `answer-text.take-them-in`, its first line: `Gain {population}[population]`

Floodplain's text is the user's, written on the page. Every other text is today's entry run through one of the three rules, which Claude proposed and the user took by pasting the page's box; Tribute's losing its "and" is Claude's recommendation at the reconcile, taken.

Every entry this list does not name stays as shipped: Gather, March, Hunger, Calendar, Bread, Heal, the two trades, Old stories, Bone tools, Their land, Misunderstandings, Rain dance, Embers, Unrest, Thieves, Weary builders.

**Doc-impact:** `docs/LOOK.md`.

**Scope:**

In, as two commits in this order, pushed together:

1. _The mark, inert._ A text marks any symbol of the cast where it marked a resource alone, and the three surfaces that draw a text's glyphs, a card face, a plate and an answer, draw it. No entry changes and nothing on screen moves.
2. _The texts._ The entries above, the two paragraphs of `docs/LOOK.md`, the spec, the board line deleted.

Measured on the page with the game's font, in the room of three lines 88.4 wide: with these texts 37 of the 38 hold. Hunt and Fire go from two lines to three and hold. The three cards reading "Kills" and the two Captures go from two lines to one. Tribute goes from three to two. Floodplain goes from seven to three. Embark stands at four.

Out:

- Embark's fit. "Becomes [Disembark]" is 101 units wide and always takes two lines, so Embark passes its room by a line. The user knows and accepted it: the embark mechanism is changed by the board line after this one and the two cards leave.
- The cards that place a thing: their faces are their own lines'.
- Every tooltip, refusal's note and ending sentence that reads population in words. They draw no glyph and keep the word.
- Influence and a unit's stats in a text. No card's text reads influence in words, and March, the one text naming a stat, reads no number and keeps "move points".
- The kind labels and their tooltips.
- Floodplain's rule. Its strike still removes the city once no improvement and no building stands, as `docs/ages/STONE.md` says. The card says less than it does, on purpose: the user's "player will discover it destroys the city".

Corner cases decided here:

- Population's glyph in a text is the cast's, in population's own colour, at the size and in the outline a resource's glyph has in that text, the number right before it with no space.
- A glyph in a text reacts to no rest and no press, population's as a resource's.
- A mark naming no symbol of the cast is refused as an unknown resource is today.
- The small card a name raises, a card shown large and a card in a pile read the same text as the hand's.
- Departure's answer keeps "Lose": only its "one population" becomes the number and the glyph.
- Rain dance and Embers keep "Dries" and "Burns", and Their land "for nothing".

What the reconcile chose:

- Population in a text goes through the mark a resource has, the mark widened from a resource to a symbol of the cast; the glyph is drawn by the renderer that draws it on the map.
- Population stays in words where no glyph is drawn: the idle tooltip, the unit kind's tooltip, the two refusal's notes, the defeat's sentence. The chrome rung reviews those surfaces.
- A line to each thing is one rule for a card and an answer, said on the look page for the card as `docs/SCHEDULE.md` says it for the answer. A card writes it as a new line in its entry, as Embark did already; an answer keeps its list, whose lines hang on numbers.
- Amounts stand side by side with no "and" on every card: Tribute follows the trophies.
- The overflow line lost its Floodplain clause in this intake's commit.

**Traps:**

- "A unit's card reads its unit" ships ahead of this line and touches the same files: `src/ui/text.ts`, `src/ui/card-face.ts`, the cast in `src/ui/marks.ts`. Read them as it left them.
- `src/ui/text-run.ts` is pure and tested in Node (`src/ui/text-run.test.ts`), and `src/content/catalogue.test.ts` lays every entry out through it. The cast's symbols live in `src/ui/marks.ts`: check what that module pulls in before a pure module imports from it.
- Three places draw a run's glyphs, each reading the glyph's `resource`: `src/ui/card-face.ts`, `src/ui/plate.ts`, `src/ui/answer-plate.ts`. `asGlyph` and `glyphOf` (`src/ui/glyphs.ts`) already take any symbol of the cast and colour it.
- The comment heading `src/ui/text.ts` says which marks an entry may hold and where they are drawn: it is a trap comment and goes stale with commit 1.
- A goal's sentence is drawn on the tree's plate and on the pinned achievement's, both through `src/ui/plate.ts`.
- `answer-text.take-them-in` is a list: only its first line changes.
- The Stone trophies Pillage and Capture are made from the Nomadic ones in the content, and their texts are entries of their own.
- The harness reads a face's text through its `rules` reading and an answer's through `answerText` (`e2e/chronicle-screen.ts`); a glyph stands in the drawn text as spaces. Search `e2e/` for a spec comparing a card's or an answer's text before the entries change: `flood`, `grievance`, `long-winter`, `monument`, `reference`, `siege` and `wildfire` read one. `docs/PHASER.md` for anything a spec presses or measures.
- No text is set under 11 units (`addText` throws).

**Plan:**

1. `src/ui/text-run.ts` and its test, `src/ui/card-face.ts`, `src/ui/plate.ts`, `src/ui/answer-plate.ts`, the comment heading `src/ui/text.ts`: leaves a text able to mark any symbol of the cast, proven by one test on an entry of the test's own marking a symbol that is no resource, every entry and every screen as shipped.
2. `src/ui/text.ts`, `src/ui/event-text.ts`, `docs/LOOK.md`, `e2e/bad-air.spec.ts` and whatever its new test needs of the harness, `workflow/BOARD.md`: leaves the line's done-condition true.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The one proof spec is `npx playwright test e2e/bad-air.spec.ts`, which gains a test: on the deal of Bad air and angry spirits, the text of Bury the dead draws population's glyph right after its number, the number read from the rules' reading of the answer, and the small card the name of Sickness raises from Live with it draws population's glyph in its text. CI proves on the push, listed for the hand-back: `card-reads.spec.ts`, `reference.spec.ts`, `hover.spec.ts`, `browse.spec.ts`, `tree.spec.ts`, `pin.spec.ts`, `strangers.spec.ts`, `flood.spec.ts`, `grievance.spec.ts`, `wildfire.spec.ts`, `long-winter.spec.ts`, `monument.spec.ts`, `siege.spec.ts`, `embark.spec.ts`, `deal.spec.ts`, `capstone.spec.ts`.
