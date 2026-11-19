# Calendar draws one of the top three cards

**Line:** **Calendar draws one of the top three cards** — Calendar played deals the top three cards of the draw pile in the deal window, titled with its name and reading "Choose one"; the card chosen is drawn, the others are shuffled back into the draw pile, and Calendar goes to the discard pile only once the choice is made; it is refused while the draw pile and the discard pile are both empty; the turn of the next landing is shown nowhere any more, its mechanism gone from the rules, the save, the screen and the pages; `e2e/calendar.spec.ts` proves the play and the choice on screen. Doc-impact: `docs/ages/STONE.md`, `docs/CHRONICLE.md`, `docs/SCHEDULE.md`, `docs/CHRONICLE-SCREEN.md`, `DOGMAS.md`.

**Spec:**

- `docs/ages/STONE.md` _The cards_, the Calendar entry becomes: "- **Calendar**, an instant costing science, aimed at nothing: it deals cards off the top of the draw pile and the player draws the one chosen, the others shuffled back into the draw pile; it is refused while the draw pile and the discard pile are both empty."
- `docs/CHRONICLE.md` _The turn_, step 1: "An empty draw pile is refilled by shuffling the discard pile into it." becomes "A draw pile short of the cards drawn or dealt from it has the discard pile shuffled in under what it still holds."
- `docs/CHRONICLE.md` _Cards_, a new paragraph after the one ending "so a card it discards lies over it.": "**A card may deal** cards off a pile, of which the player chooses one; what becomes of the chosen card and of the others is the card's to say. Its deal stands as an event's does: the chronicle takes no command but the choice until it is chosen from. The card played stays in the hand, paid, until then, and goes to its pile once the choice is made, so it is never among what it deals."
- `docs/SCHEDULE.md` _The schedule_:
  - first paragraph, "The player is never shown the timeline, but for the one turn a card may show of it." becomes "The player is never shown the timeline."
  - the paragraph opening "Events are not announced" loses its last three sentences, from "A card may show the turn of the next landing" to "What lands is still learned when it lands.", ending on "…and learns its turn when it lands."
- `docs/SCHEDULE.md` _The capstone_, second paragraph: its last sentence, "A card that shows the turn of the next landing shows the capstone's as an event's, where it lands before the next event.", goes.
- `docs/CHRONICLE-SCREEN.md` _The deal window_:
  - after "A capture's window reads the lore of what was captured the same way.", add: "A card's deal stands in the same window, rising where the play-out of the card played ends, under the card's name, reading `Choose one` where the lore stands, each card it deals drawn as a reward of one copy is, as the card of the pile it is."
  - in the third paragraph, "and nothing after an answer" becomes "and nothing after an answer or a card's deal".
- `docs/CHRONICLE-SCREEN.md`: the section **The shown event ✅** goes whole.
- `DOGMAS.md` _Architecture_, the rows list: "the timeline, the shown turn, the deals" becomes "the timeline, the deals".
- Player-facing entries (`src/ui/text.ts`):
  - `rules.calendar`: `Draw 1 of the top 3 cards`
  - the card deal's line where the lore stands: `Choose one`
  - the window's title: the card's own name entry, `card.calendar`, reused
  - the refusal note while both piles are empty: `No card to draw`
  - removed: `shown-event.turn` and `refusal.turn-shown`

**Doc-impact:** `docs/ages/STONE.md`, `docs/CHRONICLE.md`, `docs/SCHEDULE.md`, `docs/CHRONICLE-SCREEN.md`, `DOGMAS.md`.

**Scope:**

- In:
  - Calendar's new effect and its block.
  - A card's deal as a third kind of deal: rules, save, deal window, the simulator's switches.
  - The rule that a card which deals goes to its pile only after the choice.
  - The refill sentence shared by the turn's draw and a card's deal.
  - The shown-turn mechanism removed whole: the chronicle's row, its helper and block, its refusal, the strip on the screen and its module, its texts, its tests, its spec.
  - The fixture card that showed the next landing becomes the fixture's dealing card, or is replaced by one.
- Out:
  - A persona gambit that picks among the offered cards. It is jotted in `workflow/IDEAS.md`. Every persona already takes the first entry of a deal it is not ranking (the idle's `firstTaken`, the builder's ranked trials), and a card's entry is never refused.
  - Old saves holding a shown turn get no care: save compatibility waits for the end of the Bronze Age.
  - Calendar's cost (science) and its technology's goal stand as they are.
- Settled with the user:
  - **The count.** Three, the card's content number, never on a page.
  - **Where the offered cards wait.** They stay in the draw pile while the deal stands, so its count does not drop. The deal names them by key, in pile order from the top. Two copies of one card may be offered side by side.
  - **A draw pile holding fewer than three.** Its cards come first and the discard pile is shuffled in under them. Calendar is still in the hand then, so it is never offered.
  - **Both piles holding fewer than three between them.** It offers what they hold, one card or two.
  - **Both piles empty.** Calendar is refused, a block of its own, under `No card to draw`.
  - **Order at the choice.**
    1. Calendar goes to its pile, the discard pile.
    2. The chosen card is drawn into the hand.
    3. The cards not chosen are shuffled into the draw pile through the seeded generator.
    - Shuffling the whole draw pile reads the same to the player: a pile's browse stands in the collection's order, never the pile's.
    - Nothing resumes after the take; play goes on.
  - **Leaving the deal.** The player cannot back out. The card is paid, and the window closes on nothing but the choice, as every deal's does.
  - **A save made while the deal stands** reopens on it, Calendar still in the hand.
  - **The window's cards** are the pile's own instances, each face read at its counters, no copies badge.
  - **The Calendar technology's goal.** It counts the draw pile emptied, its last card drawn. A card's draw that takes the pile's last card counts like any draw. This cannot arise for Calendar itself, which needs its own technology.
- Reconcile:
  - **The offer goes through the deal window as it stands.** A third kind of deal, its cards laid out as a capture's rewards are.
  - **One refill rule.** The turn's draw and a card's deal share the one refill sentence. The turn's draw plays exactly as today, its stages and the hand's play-out unchanged.

**Traps:**

- **The play order.** `play` in `src/rules/chronicle.ts` sends every played card to its pile before its cost and effect. A hand-aimed card depends on that (`docs/CHRONICLE.md`: "so a card it discards lies over it"). Holding the card in the hand applies to a card that deals alone, and every other kind keeps today's order.
- **The draw helpers fill the hand.** `draw` caps at `HAND_SIZE`, and `shuffle` refills only an empty draw pile and only while the hand is short. Neither fits a card's deal as written, and the turn's draw must not change its stages: the hand animates `drawn`, `shuffled`, `drawn`.
- **Ids versus instances.** `offered` (`src/rules/schedule.ts`) hands back ids, but a card's deal offers card instances. The take stays by place in the order dealt (`at`), and the window reads each instance's face, not `cardFaceAtStart`.
- **Deals have only been raised at a turn's edge.**
  - `openedUnlessDealt` resumes the end of turn after a reward; a card's take resumes nothing.
  - Read how the overlay raises the window: `play`'s `deals.length > 0` and the window waiting for "the render the play-out ends on" (`src/ui/overlay.ts`). It is written for the end of turn's play-out, and a card's deal rises after a play's.
- **`Deal['of']` is switched in several places.**
  - `src/rules`: `save.ts`, `schedule.ts`, `chronicle.ts`.
  - `src/ui/overlay.ts` (`dealt`).
  - `tools/idle.ts` (`refusedEntry`: a card's entry is never refused) and `tools/sim-body.ts` (`dealTaken`, the trace names the card and the entry).
  - `e2e/chronicle-screen.ts`.
  - The typecheck lists them. A new group name in `src/rules/stages.ts` is switched across `src/ui` too.
- **The shown turn reaches further than the rules.**
  - `src/rules/state.ts` (`shownTurn`, `turnShown`, `'turn-shown'`), `schedule.ts` (`showsNextLanding`, `nextLanding`), `save.ts`.
  - `src/rules/fixtures.ts`, plus `schedule.test.ts` and `save.test.ts` (its refusal list).
  - `src/ui/shown-event.ts` and its creation in `src/ui/chronicle-scene.ts`, `src/ui/text.ts`.
  - `e2e/calendar.spec.ts` and `e2e/chronicle-screen.ts`.
  - The shown-turn tests go with the mechanism: the user dropped it at this intake.
- **The lint exception.** The `text.ts` lines naming Calendar carry `// glossary exception: calendar`, which the lint reads per line.
- **For the screen and the spec:** `docs/PHASER.md`, and the rest rule before a press (`DOGMAS.md` _Testing_).

**Plan:**

1. **The mechanism, inert.** Lands in its own commit:
   - `src/rules/`: a card's deal (the card that deals held in the hand by key, the offered cards by key), the play that holds a dealing card in the hand, the take, the refill, and the block when both piles are empty.
   - `src/rules/save.ts` reads and writes the new deal.
   - `src/rules/fixtures.ts` gains a dealing card, with the mechanism's tests on it:
     - the deal offers the top of the draw pile in pile order;
     - every other command is refused while the deal stands;
     - the take draws the chosen card, sends the dealing card to the discard pile and shuffles the others in, seeded;
     - a short draw pile is refilled under its cards, the dealing card not among them;
     - both piles empty refuses the card;
     - a save round-trips the standing deal.
   - The deal window (`src/ui/overlay.ts`) shows a card's deal with its title and `Choose one`.
   - The simulator's switches take the new kind.
   - Leaves: the rules, the screen and the tools ready for a card that deals, and no content dealing yet.
2. **The content and the removal.** Lands in the ship's commit:
   - `src/content/stone.ts`'s Calendar deals three, its text entry rewritten.
   - The shown turn removed from the rules, the save, the fixture, the screen and the texts, with its tests.
   - `e2e/calendar.spec.ts` rewritten.
   - The five pages edited as the Spec writes them, and the board line deleted.
   - Leaves: the line done.

**Verify:**

- Commands: `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/calendar.spec.ts`, rewritten. It opens on a turn with Calendar in hand and its cost gained, as today's spec does, and drags it out. Then:
  - The deal window rises titled with `card.calendar`, reading `Choose one`, its three cards the ones the rules deal.
  - A click on one leaves the chronicle the rules' take leaves: the chosen card in the hand, Calendar on the discard pile.
  - The page logs nothing.
- CI proves the rest on the push: `e2e/deal.spec.ts`, `e2e/hover.spec.ts`, `e2e/resume.spec.ts`, `e2e/neutral.spec.ts`, `e2e/landing.spec.ts`, `e2e/reference.spec.ts` and the whole suite.
