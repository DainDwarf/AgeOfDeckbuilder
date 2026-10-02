# A card aimed at the hand

**Line:** A card aimed at the hand — a card chooses another card of the hand as its aim, as one is aimed at the discard pile today, and the chronicle screen offers the choice; the first card to need it discards the one chosen. Done when a card aimed at the hand is played at another card of the hand and the rules tests hold it discarding that card on the fixture; the chronicle screen aims it in the hand from its second click, under the point and the line; `docs/CHRONICLE.md` and `docs/CHRONICLE-SCREEN.md` say so. No card of the game uses it yet.

**Spec:**

`docs/CHRONICLE.md`, _Cards_:

- In the Instant bullet, the effects end: "…**refresh** a unit's move points, **recall** a card from the discard pile, **discard** another card of the hand."
- A new paragraph after the one that opens "A card aimed at the discard pile is offered": "A card aimed at the hand lands on another card of the hand, whichever the player chooses, and never on itself. A hand holding no other card blocks it in the hand, as an empty discard pile blocks a card aimed there. The card played goes to the discard pile before it lands, so a card it discards lies over it."

`docs/CHRONICLE-SCREEN.md`, _The hand and the aim_, four paragraphs as they read after the line:

- "A left click selects a card of the hand, unaffordable or not. A selected card that aims at a tile or at a unit is **being aimed** from that moment: the map is already there, and lights the tiles its aim admits. A second click plays the card — one that aims at nothing is played where it stands, and refused over the card with its reason when it is unaffordable; one that aims at a tile or at a unit lands nowhere, no tile lying under a card in the hand, so it stays selected; one that aims at the discard pile raises the aim window and is being aimed from then; one that aims at the hand is being aimed from then, where it lies, or refused over the card as one that aims at nothing is. That window waits for the second click because it would stand over the hand, and a card is inspected from the hand before it is played. A card aimed at the hand waits for it because a click on another card of the hand selects that card under any selection, and is the play only once the card is being aimed."
- "**A card aimed at a tile, at a unit or at the hand says so on the card itself.** It wears a point on its ring, over its top edge and towards the map, and one line stands over the hand, naming the card by its own name and what it is played at, a tile, a unit or a card of the hand. The ring, the point and the line are in the selection's colour, the one the map rings the selected tile in. Point and line come up the moment the card is being aimed and go when it is let go of, so a card selected and waiting to be played reads apart from one being aimed without reading the map. A card aimed at the discard pile wears neither: the aim window's title says that same sentence instead, with a card of the discard pile in place of the tile or the unit."
- "**A card being aimed filters every left click by its aim.** A press on a thing the aim admits is the play attempted there, and the rules answer: a play refused says why over that thing — the one reason it is turned down, in the note a refused card raises — and the card stays selected. A press on anything else lets the card go and then lands, in the one press, as it would on a clean screen: a tile is selected, another card of the hand is selected. A card that aims at a tile admits a drawn tile, one that aims at a unit a drawn tile a unit of the player's stands on, one that aims at the hand every other card of the hand, and a recall admits a card of the aim window. A drag that lifts another card of the hand is a press on anything else, whatever the card it lets go was aimed at."
- "**The drag is the two clicks in one gesture.** A card lifted clear of the hand and released there is selected and played at once: one that aims at a tile or at a unit stays selected, being aimed; one that aims at the hand stays selected, being aimed where it lies; one that aims at the discard pile raises the aim window; an unaffordable one stays selected under its refusal note."

`docs/CHRONICLE-SCREEN.md`, _The right click, the back key and the menu_: "A card being aimed at a tile is let go of as the selection it is." becomes "A card being aimed at a tile, at a unit or at the hand is let go of as the selection it is."

Player-facing entries, `src/ui/text.ts`:

- The line over the hand, beside `aim.tile` and `aim.unit`: `Play {card} at a card of the hand`
- The refusal of a card aimed at the hand held alone, keyed by its block's name as every `refusal.<block>` is: `No other card in the hand`

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`. `docs/GLOSSARY.md` does not move: the aim window stays the discard pile's, and "being aimed" and "discard" already say this.

**Scope:**

In: a fourth aim in the rules, the hand; the play command and the `played` group naming the card chosen; the helper that discards one card of the hand, for content to compose; one fixture card aimed at the hand that discards the card chosen; the rules tests; the chronicle screen's offer; the two text entries; the two pages.

Out: Fire and any other card of the game, which land with the doors, and with them the Playwright spec that plays one on screen; a filter on which cards the aim admits; any change to the aim window or to the discard-pile aim.

Decided here:

- The aim admits every other card of the hand and takes no filter of its own. Its declaration carries what blocks it in the hand, as the discard-pile aim's does, and the fixture card declares the hand holding no other card.
- A play names the chosen card by its place in the hand as the hand stood before the play, as a play at the discard pile names its place in the pile as it stood; the `played` group carries that same place. The play is refused at the played card's own place, at a place the hand does not hold, and under any other aim, nothing paid or discarded.
- The order is the standing one: the played card leaves the hand, its cost is paid, its effect lands. So the chosen card lies over the played one on the discard pile, and a single use card aimed at the hand leaves the chronicle and still discards the one chosen.
- A hazard chosen is discarded as any card is and no rule is added for it: out of the hand at the end of the turn, it does not strike.
- On the screen the card is being aimed from its second click or from the drag, never from the first click; until then a click on another card selects that card. Once it is being aimed, a click on another card of the hand is the play there. An unplayable one — unaffordable, or held alone — raises its refusal note on the second click and is not being aimed.
- The other cards of the hand wear nothing more while one is being aimed at them: they lift under the pointer as always. The right click shows a card large while one is being aimed, as it does at any time.
- Nothing is put down for the length of the aim: the map, the piles and the end-turn button answer as they do under a card that is selected, and whatever lets a selected card go lets this one go. A drag that lifts another card lets it go too, and is that card's own drag.
- A settle card aimed at the hand is content no age holds; it gets no rule.

The reconcile:

- The discard of a chosen card and the end of the turn's discard of the rest of the hand are one fact, cards leaving the hand for the discard pile under one `discarded` change naming their places: they become one door taking the places, the end of the turn handing it every place of the hand. The played card's own way to the discard pile stays in the play, beside the single use card's way out of the chronicle.
- What blocks the card in the hand goes through the standing declaration and the standing refusal note as they are, one block and one text entry more.
- The point and the line go through the standing ones as they are, one sentence more.
- The second click goes through the hand's standing act on the selection, where the discard-pile aim raises its window.
- The chosen card's flight to the discard pile is the hand's standing answer to a `discarded` change.
- The hand aim and the discard-pile aim stay apart on the screen, the difference meant: a card of the discard pile is offered in the aim window because the pile is not on the screen, and a card of the hand is offered where it lies.

**Traps:**

- The played card leaves the hand before its cost and its effect, so on the chronicle the effect lands on, every card that lay after it in the hand lies one place earlier than the play named. The discard pile never had this: the played card joins its end. The test plays at a card before the played one and at a card after it.
- `AimedCard` (`src/rules/catalogue.ts`) is the map's: `admitted`, `refuses`, the hand's `aimTile` press and the aim line's `show` all take it. The hand aim is not one of them; widening the type hands the map an aim it has no tile for.
- The hand answers a `discarded` change by flying the cards at its places and laying itself out anew on that change's chronicle once they land (`src/ui/hand.ts`); the second `discarded` of one play names places in the hand as that render left it. The hand's `render` lets the selection go.
- A slot's refusal is read at the render and still the rules' answer at the press, nothing changing the chronicle in between; the hand offers the aim for a playable card only, so no play it sends for a card of the hand is one the rules refuse for the card chosen.
- The tile aim puts the end-turn button down because its catcher lies under the hand and the piles (`src/ui/chronicle-scene.ts`); the hand aim has no catcher and puts nothing down.
- Every switch over a card's aim, a play's aim and what a `played` group was aimed at is closed, in `src/rules/`, `src/ui/` and `src/content/catalogue.test.ts`: the typecheck names each one the new member owes.
- The hand's presses and its drag: `docs/PHASER.md`, _The pointer's readings_.
- Comments are for traps only: none that paraphrases the code it stands on, in the helper, the fixture or the hand.

**Plan:**

1. `src/rules/` — `catalogue.ts`, `stages.ts`, `state.ts`, `chronicle.ts`, `cards.ts`, `fixtures.ts`, `cards.test.ts`, and the switch in `src/content/catalogue.test.ts`. It leaves the hand aim played and refused by the rules, the one door for a discard with the end of the turn going through it, the fixture's card, and the rules tests green holding: the card discards the card it is played at, before it or after it in the hand, the chosen one over it on the discard pile and every card of the chronicle still in it; the play is refused at itself, at a place the hand does not hold and at nothing; a hand holding no other card blocks it. The typecheck names what the screen still owes.
2. `src/ui/` — `text.ts`, `aim-line.ts`, `hand.ts`, `chronicle-scene.ts`. It leaves the chronicle screen aiming such a card in the hand as the Spec says, and the typecheck green.
3. The two `docs/` pages as the Spec writes them; the board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No spec proves the line: no card of the game is aimed at the hand until the doors, whose line carries that spec. The implementer walks the new path once before reporting, on a throwaway card aimed at the hand added to the Nomadic deck and a throwaway spec — selected, a click on another card selecting that card, being aimed from the second click under the point and the line, played at a card, let go by a press on the map — both gone from the tree before the report (`git status --porcelain` names neither), and the report says what each run answered. CI proves on the push the specs that walk the hand: `press`, `hover`, `refuse`, `reference`, `settle`, `controls`, `capstone`, `browse`, `broken-motion`, `pointer-sweep`.
