# The texts overflowing the card face

**Line:** The texts overflowing the card face — a unit's card that reads a sentence draws its two rows of stats and its sentence closer, each gap by the same amount, until the three stand in the text's room, and a card's name wider at 12 units than the 96.5 between its plate's rivets is set at 11, so the Raft's text box and the name Misunderstandings stand in their rooms on a card of 124 and on a card shown large; `docs/LOOK.md` says both rules; `e2e/card-reads.spec.ts` passes.

**Spec:** `docs/LOOK.md`, _The cards_. Every sentence below is Claude's, written at intake on the settled design; the user took Claude's starred option on each fork and every point of the reconcile as recommended.

The mockup the look was picked on: https://claude.ai/artifact/B95ZyZbYcPhtN2vGbrNYfZ, under these settings: the Raft at "Rows drawn closer", the name at "At the text's size".

_The paragraph "**The name** stands on the pack's riveted plate"._ After its first sentence, which ends "over the foot of the window and the head of the text box.", add:

> It is set bold at 12 units of type and stands in the room between the plate's two rivets, 96.5 units from one's inner rim to the other's; a name wider than that room is set at 11 units, the smallest a text is set at.

_Same paragraph, the sentence "Its room runs from 1 unit under the plate's lower edge down to 1.5 units over the kind label, which is three lines of the text's type, its lines drawn closer on a face where the room falls short of three, and the text stands centred in it."_ becomes:

> Its room runs from 1 unit under the plate's lower edge down to 1.5 units over the kind label, which is three lines of the text's type, and what stands in the room stands centred in it. Whatever stands in the room is drawn closer where the room falls short: a text's lines on a face whose room is under three lines of its type, and a unit's two rows of stats and its sentence where the three together stand taller than the room, the gaps between them closed by the same amount until they stand in it exactly.

_The paragraph "**A unit's stats**"._ Its first sentence, "**A unit's stats** stand on a card that places a unit, and the card reads no sentence.", becomes:

> **A unit's stats** stand on a card that places a unit.

and in the same paragraph "the two columns' left edges stand 32 units apart, and the four stand centred in the room as one block." becomes:

> the two columns' left edges stand 32 units apart, and the four stand centred in the room as one block, the card's sentence under them and part of that block where it reads one.

No player-facing entry is added or changed: no card's text and no card's name moves.

**Doc-impact:** `docs/LOOK.md`.

**Scope:**

In:

- _The unit's block._ On a unit's card that reads a sentence, the two rows of stats and the sentence are one block. Where the block stands taller than the text's room, the gap between the two rows and the gap between the lower row and the sentence are each closed by half of what the block passes the room by, so the upper row starts at the room's top and the sentence ends at its foot. Where the block fits, it stands centred in the room as the stats alone do today. The stats keep their type, their glyphs and their two columns.
- _The name's size._ A name whose width at 12 units, bold, is over the room between the rivets is set at 11 units; every other name is set at 12. Two sizes and nothing between them (the reconcile's fourth point). A name exactly as wide as the room stays at 12.
- The three sentences of `docs/LOOK.md`, and the unit test of `e2e/card-reads.spec.ts`: its title loses "reads no sentence", and its assertion that the Worker's sentence reads empty takes its oracle from the game's own text for that card in place of the literal, so it says what the page now says.

Measured at intake, in units of a card 124 wide, off the game's own objects:

- The Raft, the one unit's card with a sentence. On a card of 124: a row of stats 15 tall, the sentence 13, the block 43 in a room of 38.44, so each of the two gaps closes by 2.28. On a card shown large: the block 41.1 in a room of 38.3, each gap closing by about 1.4. The other six unit cards read no sentence and their block is 30 in the same room: nothing of theirs moves.
- Misunderstandings is 100.62 wide at 12 in a room of 96.49, the one name of the 56 that passes it; at 11 it is 92.2, 2.1 clear of each rivet. The next widest name, Honour the dead, is 88.49 at 12.
- No text passes three lines: all 56 cards, under both cities, and the counter cards up to a count of 1000.

Corner cases, decided here:

- A name still wider than the room at 11, which is a name over 105.3 wide at 12: it is set at 11 and lies over the rivets. No third size, no clip, no guard; such a name is renamed at its own intake.
- A unit's card whose sentence takes two lines is not designed here and no card has one: the same closing applies and the rows would meet. It is that card's intake's finding, not a case to guard.
- The size is decided once on the name's width in units, never per drawn size, so a card reads the same of the two sizes at 124, shown large and lifted.
- A face is made once and read again with another card: the name's size follows each reading both ways, a face that read Misunderstandings and then reads another card going back to 12.
- The rest zones of the four stats follow their rows where they are drawn; where the rows are closed, a stat's zone is as tall as the pitch between the rows, so two zones touch and never overlap.

What the reconcile chose:

- _The text's own lines, drawn closer on a face whose room is under three lines._ One rule on the page, in the sentence above. The text's lines keep their standing behaviour exactly: no other card's face moves by this line.
- _A building's card, whose row of what it gives and takes runs inside its sentence where the two pass the room._ Stays apart, a difference that is meant: the user saw the Raft's stats in one row on the mockup and kept the grid.
- _The resource bar, which closes its gaps and shrinks no reading._ Stays apart: a name has no gap to close, and letters set closer was served and not taken. The name is the one text in the game set smaller to fit.

Out:

- A scroll, a change to the text box, and any rewrite of a text or a name: the line named them and none is needed.
- The seven texts that stand at exactly three lines stay as they are.
- No test asserts a fit: a card's fit is a look, checked by the visual pass below.
- The kind label, the infopanel's cards and the small cards.

**Traps:**

- `docs/PHASER.md`, _Text_: a Text is measured when it is made and at each change; a size set on it redraws it, and a card shown lifted has its texts cut again at another resolution.
- The room between the rivets is no constant today. It was measured off the pack's file: the plate, `Strip - 3.png`, is 663 pixels wide, drawn 600 of the pack's pixels wide, and its rivets' inner rims stand at 90.5 and 572 of the file's pixels, which is 96.49 units. A name set exactly that wide was shot at intake touching both rivets. The constant that holds the plate (`PLATE`, `src/ui/card-frames.ts`) holds its wood's upper and lower edges and nothing across.
- A text's width measured at its own size is rounded up to the pixel by the canvas: `capitalsOf` (`src/ui/card-face.ts`) measures a hundred times larger for that reason. The name's Text box at 12 on a card of 124 reads 101 where its advance is 100.62.
- The stats' block and the sentence are stacked in the face's `read` with the rows' own box height as their pitch, and the building's row has the only fit test there. The four stats' boxes (`statBoxes`) are what the rest zones at the card's foot are laid from, and `e2e/card-reads.spec.ts` rests on two of them.
- The text's line spacing is set from the room and three lines of the type before anything is stacked; it is the standing rule the reconcile keeps as it is.
- A unit's card's sentence was added by the line that made the raft carry a unit; `docs/LOOK.md` was not changed then, which is why the page says "reads no sentence" today.

**Plan:**

1. `src/ui/card-frames.ts` and `src/ui/card-face.ts`: the room between the rivets known to the face, the name set at one of its two sizes at each reading, the unit's block closed where it passes the room, the stats' zones following. Leaves the Raft and Misunderstandings standing in their rooms at both sizes and every other face as it was.
2. `docs/LOOK.md`, the three sentences; `e2e/card-reads.spec.ts`, the title and the oracle; the board line deleted. Leaves the done-condition true.

One commit: nothing of `src/rules/` moves.

**Verify:** `npm run check`, `npm test`, `npm run lint`. A layout computation the line cuts out as a pure function gets its Vitest test beside it, on numbers of the test's own. The one proof spec is `npx playwright test e2e/card-reads.spec.ts`, which rests on a unit card's stats where the face lays them. A visual check is planned, through the `visual-check` skill, on the launch pile or a browse holding the cards named, at 124 and shown large:

- the Raft: its upper row of stats under the plate's lower edge, its sentence clear over the kind label, no row touching another;
- Misunderstandings: the name's ink between the two rivets, covering neither;
- the Archer: its four stats centred in the room as they stand today;
- a card of three lines of text and a building's card with its row: as they stand today.

CI proves on the push, listed for the hand-back: `browse.spec.ts`, `deck-editing.spec.ts`, `reference.spec.ts`, `tree.spec.ts`, `launch.spec.ts`, `press.spec.ts`, `controls.spec.ts`, `capstone.spec.ts`, `bad-air.spec.ts`, `fishery.spec.ts`, `raft.spec.ts`, `embark.spec.ts`, `strangers.spec.ts`, `collection.spec.ts`, `hover.spec.ts`, `hand-aim.spec.ts`, `inspect.spec.ts`.
