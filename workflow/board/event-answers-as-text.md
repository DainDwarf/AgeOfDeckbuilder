# Event answers as text

**Line:** Event answers as text — the deal window draws each answer of an event as its name over its text on the panel's paper, side by side, and no answer as a card; a card an answer names still raises its small card, at the answer's numbers; a capture's rewards stay cards; the lore and what is dealt meet at one height in the deal's window and the capstone's; every event's name, every answer's name and every answer's text stands outside `src/ui/text.ts`; `e2e/flood.spec.ts` reads Lose the fields with its lines of nought left out; the pages below say so. Doc-impact: `docs/GLOSSARY.md`, `docs/SCHEDULE.md`, `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

The mockup the look was picked on, real deals shot from the game with the answers drawn by the page: https://claude.ai/artifact/UEQrTgae1WSTEtyPYzgrqH. It opens on the picks. Its heights are a browser's; the numbers below bind, its pixels do not.

**Spec:** the sentences are Claude's, written at the intake (2026-11-16); the user picked the look and the rules and read the answers' texts on the mockup, and has not read the pages' sentences.

`docs/GLOSSARY.md`:

- The paragraph on lore becomes: "So is lore, the fiction a window reads over what it deals, an event's name and its answers' names among it: prose the lint does not read, free to say tribe and hunter. An answer's text is no lore, and the lint does not read it either: it says what choosing the answer does, and intake and review hold it to this vocabulary."
- The row: "| **answer** | One of the ways out an event deals for its problem, each with a cost of its own, of which the player chooses one. | option, response, reply, solution |"

`docs/SCHEDULE.md`, _The schedule_:

- "**An event deals its answers** as cards, two or more, each with a cost of its own;" loses "as cards".
- "An answer's reading is what its card says of this turn, and a card the answer names is shown as the answer will add it: made at the counters the reading hands under the names that card declares. An answer may declare cases and name one of them on the chronicle as it stands, and its card then reads the text of that case; an answer declaring none reads its one text." becomes "An answer's reading is what its text says of this turn, and a card the answer names is shown as the answer will add it: made at the counters the reading hands under the names that card declares. An answer that does several things reads a line to each, and a line whose number is nought on this turn is left out; an answer left with no line reads that nothing happens. An answer that adds a card names the card and says no more of it: what the card does is the card's to say. An answer may declare cases and name one of them on the chronicle as it stands, and it then reads the text of that case; an answer declaring none reads its one text."
- The lore paragraph becomes: "**An event carries lore**: a short fiction, a sentence or three, saying what is happening to the player's city, since an answer read alone makes no sense; its name and its answers' names are lore too. A capture that deals rewards carries one too, and the capstone one for each time its window is raised. Lore is fiction and not rules: it decides nothing, and the glossary does not bind it, so it says tribe where the rules say population. What an answer does is in its text, which is no lore: short, every consequence in the glossary's words, held to them by intake and review."

`docs/CHRONICLE.md`, _The turn_, the Events step: "that event deals its answers as cards; the player chooses one answer, which lands" becomes "that event deals its answers; the player chooses one, which lands".

`docs/CHRONICLE-SCREEN.md`, _The deal window_. The first two paragraphs become, the sentence on the beat kept where the line before this one put it:

"The events phase's deal stands in a **window of its own**, which the end of turn's play-out ends on, and which a chronicle opened on a deal opens on; a capture's rewards stand in the same window, under the name of what was captured, each capture's in turn and before the turn ends, a reward of one copy drawn as a card of the deck is and one of several as a browse draws a stack, its badge reading the copies. What is dealt stands in one row, centred, in the order dealt, under a title naming the event: an event's answers as text, a capture's rewards as cards. The lore stands over the row, centred, in the title's ink, and the two meet at one height whatever is dealt: the lore ends 262 units from the screen's top and the row starts at 278, so the row stands clear of the hand. A capture's window reads the lore of what was captured the same way."

"An answer is its name over its text on the panel's paper, as a plate of the tree is drawn, 220 wide, name and text centred, and the answers of a row stand as tall as the tallest. Its text says what it does on this turn — how many enemies it enters, the card it adds, the text of its case where it declares cases, a line to each thing where it does several; what it costs the player's city reads in that text and wears no chip. An answer is no card: it reads no kind, and no press shows it large. A name in its text answers the rest and the right click as a name on a card does, the card it names shown as the answer will add it, and a left click on the name is the answer's. An answer the player's city cannot pay for, or one refused, wears the paper and the ink of an unaffordable card of the hand."

In its third paragraph "says why over the card, in the note a refused card raises" becomes "says why over it, in the note a refused card raises", and "a press beside the cards" becomes "a press beside what is dealt".

`docs/CHRONICLE-SCREEN.md`, _The capstone's window_: "Both show its card alone, drawn as the deal window draws an answer and at the same width, `CAPSTONE` where a card reads its kind, under one title naming it the capstone, with the capstone's lore for that raising standing over the card as the deal's stands over its row" becomes "Both show its card alone, a card face that costs nothing, `CAPSTONE` where a card reads its kind, under one title naming it the capstone, with the capstone's lore for that raising standing over the card as the deal's stands over its row, the two meeting at the same height"; and "as on the deal" at the paragraph's end becomes "as a reward's on the deal".

`docs/CHRONICLE-SCREEN.md`, _The war warning_: "its card says so" becomes "its text says so".

`docs/INTERFACE.md`: in _A card's names and its label_, "on an answer's card, at the counters the answer's reading hands under the names the card declares" becomes "in an answer's text, at the counters the answer's reading hands under the names the card declares"; in _What stands over what_, "the note a refusal raises over a window's card" becomes "the note a refusal raises over a window's card or answer".

`docs/ages/NOMADIC.md`, Lean season: "The answer names the Hunger as it will add it and says what it takes." becomes "The answer names the Hunger as it will add it, and the card says what it takes."

`docs/ages/STONE.md`, A grievance: "the card reads whichever of the three stands" becomes "the answer reads whichever of the three stands".

The answers' texts that change, every other answer's text kept word for word. A line break is a line of the list; "while" names the number that leaves the line out at nought.

| Answer | Text |
| --- | --- |
| Share food | Add [card:hunger] to the top of the draw pile |
| Burn the forest | Add [card:embers] to the discard pile |
| Lose the fields | The flood removes {improvements} improvement near your city (while improvements) / The flood removes {buildings} building inside your border (while buildings) / The flood removes your city (while city) |
| Live with it | Add [card:sickness] to the discard pile |
| Take them in | Gain {population} population / Add [card:misunderstandings] to the discard pile |
| Abandon a herd | The wolves remove {deer} [feature:deer] near your city (while deer) / The wolves remove {cattle} [feature:cattle] near your city (while cattle) |
| Let the farmers handle it | Add [card:wolves] to the discard pile |
| Rain dance | Add [card:rain-dance] to the discard pile |
| Pay tribute | Add [card:tribute] to the discard pile |

A list every line of which is left out reads "Nothing happens", the one entry Refuse them reads. The entries `kind.event` ("Event") and `kind-tooltip.event` ("Choose one answer") go.

**Doc-impact:** `docs/GLOSSARY.md`, `docs/SCHEDULE.md`, `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

**Scope:**

- An answer's drawing, the user's picks off the mockup: the panel's paper and edge, square corners, 220 units wide; padding 16 at the sides and 12 over and under; the name 20 bold and centred; 4 units under it the text at 16, centred, wrapped inside the padding, a list's lines one under the other, bare, each wrapped and centred on its own; a glyph two thirds of the text's size, as a run draws one everywhere. The answers of a row are as tall as the tallest, each one's name and text from its top. 26 between two answers, the gap between two reward cards.
- Where the window stands, all three forms: the lore's foot at 262 and the top of the row at 278, for an event's answers, a capture's reward cards and stacks, and the capstone's card. Today the cards stand at 321 to 503; they come to 278 to 460. The lore keeps its size, its ink and its 600-unit wrap. A pile's browse is untouched.
- An answer the city cannot pay for, or a refused one: the unaffordable card's paper and ink, the same two look entries, the whole answer. No number turns red.
- Presses, on what the line before this one leaves: one left click anywhere on an answer, a name included, is the take. The right click on an answer off its names does nothing; on a name it shows the named thing large. A rest on a name raises its small card, over the name as on a card. The pointer is a hand over an answer. The refusal's note stands over the answer as it stood over a card.
- The texts: the events' names and the answers' names and texts leave `src/ui/text.ts` for a file the glossary lint does not read; every one stays keyed data, one sentence an entry. The capstones' name and rules entries stay where they are: the capstone's window is the next line's. The `// glossary exception` marks on the moved entries go with the move.
- The list: a line may hang on one of its answer's numbers and is left out while that number is nought; a line hanging on none always stands. A case's text may be a list. The rule lives on the screen's side, in what reads the text: the answers' `reads` keep handing every number, nought included.
- The numbers an answer no longer prints are still read: Share food's food and Pay tribute's food and production make the card its name shows.
- Decided: Lose the fields on a city with nothing else standing reads the one line "The flood removes your city". Abandon a herd with no herd near reads "Nothing happens".
- Tests: `hover.spec.ts`'s "an answer's kind label on the deal window raises the overlay's bubble" has no label to rest on; it is re-pointed at a reward card of a capture's window, whose label `docs/INTERFACE.md` still promises, on the fixture `camps.spec.ts` opens on. No promise is dropped by this line.
- Reconcile, each taken as recommended by the user: the paper is the tree's plate's as it is, the sizes and the centring the answer's own; unaffordable is the unaffordable card's; the note and the small card are the standing ones, the small card at the answer's numbers where a plate's shows the starting ones; the cases and the list both stand; "Nothing happens" is one entry; the three windows share the one height; 26 is one number with the reward cards' gap; the glyph's share of its text is the standing one.
- Out: the capstone's window as text, the next line. The chrome rung reviews the paper.

**Traps:**

- `src/ui/plate.ts` lays a run from the left and hands its names an empty reading; `src/ui/card-face.ts` lays its run centred and hands its names the face's reading. An answer needs the second in both: centred lines, and names made at the answer's numbers, or Hunger and Tribute show their starting counters.
- A text is measured in the shipped face inside Phaser's wrap callback, as both runs do; a name never breaks across lines.
- The window's entries are laid on the browser's panel and answer through its held boxes (`src/ui/overlay.ts`, `src/ui/browse.ts`); a stack of several copies takes its place from its top-left corner.
- `FaceKind` loses `event`: the typecheck names every switch that held it.
- `src/content/catalogue.test.ts` reads every answer's text, every case of it, and resolves every name in it. It keeps doing so over every line of every list, the lines a number hides included.
- `e2e/grievance.spec.ts`, `e2e/reference.spec.ts` and `e2e/resume.spec.ts` import the answer's face to read its text; `eventDealRead` in `e2e/chronicle-screen.ts` reads each answer's id off the object drawn. The object drawn for an answer keeps carrying its id and its names.
- `docs/PHASER.md` for a text's own box against its padded one, and for objects that join a stratum after it is laid.

**Plan:**

1. The texts: the events' names and the answers' names and texts out of `src/ui/text.ts`, the nine texts above rewritten, the list's rule in what reads them, `kind.event` and its tooltip gone; `src/content/catalogue.test.ts` following. Leaves the window still drawing cards, reading the new texts through one entry point.
2. An answer's drawing, a piece of its own beside the plate and the card face, taking the catalogue as an argument. Leaves an answer drawable alone.
3. `src/ui/overlay.ts`: the deal window laying answers for an event and cards for a capture, the lore and the row meeting at 270 for both and for the capstone's window; `src/ui/face.ts` losing the answer's face. Leaves the line's screen standing.
4. `e2e/`: the helpers and the specs that read an answer, `flood.spec.ts` asserting the list, the kind label's test re-pointed.
5. The seven pages, the sentences above. The board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/flood.spec.ts`. CI's, for the hand-back: `deal`, `reference`, `hover`, `resume`, `grievance`, `bad-air`, `drought`, `predators`, `strangers`, `travellers`, `wildfire`, `landing`, `camps`, `sites`, `neutral`, `site-pointer`, `capstone`, `long-winter`, `monument`, `siege`.
