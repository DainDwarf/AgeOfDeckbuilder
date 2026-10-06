# Calendar

**Line:** **Calendar** — the technology Calendar, its achievement and the card Calendar stand in the Stone Age's content, the technology after Pottery's; a card showing the turn of the next landing and a goal counting the draw pile emptied are each held by a rules test on the fixture; `e2e/calendar.spec.ts` and the catalogue's coherence test pass, and `docs/ages/STONE.md`, `docs/CHRONICLE.md` and `docs/CHRONICLE-SCREEN.md` say so. Doc-impact: `docs/ages/STONE.md`, `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** [`docs/ages/STONE.md`](../../docs/ages/STONE.md), _The technologies_ and _The cards_; [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md), _The schedule_ and _The capstone_; [`docs/CHRONICLE-SCREEN.md`](../../docs/CHRONICLE-SCREEN.md), _The UI_; the shared ground is [`stone-age-pool.md`](stone-age-pool.md), _For the technologies_. The screen's pitch is the mockup at https://claude.ai/artifact/HsCazwvASdxRtFoSuGNm6T, the game's own screen with the strip drawn over it; the user's pick on it is the strip over the button reading "Event on turn 9".

The sentences for the design pages, verbatim, written by Claude; the user settled what they say and has not read their wording, so the hand-back quotes each:

- `docs/ages/STONE.md`, _The technologies_, a bullet after Pottery's and before Bread's: "**Calendar** needs Irrigation. Its goal counts a deed: the times the draw pile is emptied, its last card drawn. It unlocks the card **Calendar** and pays influence."
- `docs/ages/STONE.md`, _The cards_, a bullet after Clay pit's and before Bread's: "**Calendar**, an instant costing science, aimed at nothing: the turn of the next event is shown until that turn comes, the capstone's turn read as an event's where it lands first, and the card is refused while a turn is shown. The turn shown at no cost once the technology is learned was rejected: nothing in the age would cost science."
- `docs/ages/STONE.md`, _The cards_, Fire's bullet: "Science has its source here, and nothing in the age costs it." becomes "Science has its source here, and Calendar is what costs it."
- `docs/CHRONICLE.md`, _The schedule_, first paragraph: "The player is never shown the timeline." becomes "The player is never shown the timeline, but for the one turn a card may show of it."
- `docs/CHRONICLE.md`, _The schedule_, the paragraph opening "Events are not announced" gains, at its end: "A card may show the turn of the next landing: the turn the next event is due on, or the capstone's where it lands first, read as an event's and never saying which. The turn is shown from the card's play until it comes, and a card that would show it is refused while one is shown. What lands is still learned when it lands."
- `docs/CHRONICLE.md`, _The capstone_, the paragraph opening "The capstone lands on a turn drawn when the chronicle opens", after the sentence ending "so the turn is learnt when it comes.": "A card that shows the turn of the next landing shows the capstone's as an event's, where it lands before the next event."
- `docs/CHRONICLE-SCREEN.md`, _The UI_, a subsection after _The pinned achievement_, headed "The shown event": "While a card has shown the turn of the next landing, that turn stands in a strip just over the end-turn button, as wide as the button, on the panel's paper as the pinned achievement is: one line, centred, reading `Event on turn` and the turn, whatever is to land. It answers no press; the wheel over it zooms the map, as over the pinned achievement. It stands in city mode as on any turn, and goes as the turn it reads begins."

The player-facing entries, verbatim; a key the implementer names is marked so:

- `card.calendar`: `Calendar`, carrying `// glossary exception: calendar`
- `rules.calendar`: `Show the turn of the next event`
- `technology.calendar`: `Calendar`, carrying `// glossary exception: calendar`
- `goal.calendar`: `Empty the draw pile {need} times`
- the refusal's entry, keyed by the block's own name: `The next event is already shown`
- the strip's entry, the key the implementer's: `Event on turn {turn}`

Who wrote what: the coming event's turn is the user's own jot and was Claude's first take of three; the user made it an instant costing 2 science that is not single use, over the rule shown at no cost that Claude first recommended, because nothing in the age cost science. The strip's place, its wording and the card's text were each one of three Claude served, and the user picked them; the user went back from "Event in 3 turns" to "Event on turn 9" once told the first needed a second form for one turn. The capstone read as an event is the user's rule. The goal was the second of three Claude served and the user picked it; the need of 12 is a number Claude wrote, kept by the user as a pre-balance number. The refusal's sentence, the one copy and the influence were served by Claude as riders and none was struck.

The content's numbers, provisional: the card Calendar is an instant costing 2 science, aimed at nothing, cycling as any instant; the technology needs Irrigation and unlocks one copy of Calendar; the achievement counts the draw pile emptied, needs 12 and pays 1 influence.

**Doc-impact:** `docs/ages/STONE.md`, `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

- In: the two mechanisms below, each with its rules test on the fixture; the technology, its achievement and the card in the Stone Age's content; the six text entries; the strip on the chronicle screen; `e2e/calendar.spec.ts`; the sentences of the three pages.
- **The shown turn, a mechanism new to the rules.** A card's effect shows the turn of the next landing: the turn the next event is due on, or the capstone's turn where the capstone has not landed and lands on that turn or before it. The chronicle keeps the turn shown, and so does the save. It is shown while the chronicle's turn is before it, so it goes on its own turn with nothing clearing it, whatever that turn lands, a due turn that deals nothing included. While one is shown, a card that would show it is blocked in the hand, as a unit card is with nobody idle. Showing reads the timeline and never rolls it. The rules a test holds on the fixture: the play shows the due turn; the capstone's where it lands first; the card is blocked while a turn is shown and plays again once that turn has come.
- The shown turn never turns false while it stands: the next due turn moves only at a landing, and the turn shown is the earliest landing.
- Once the capstone has landed, the turn shown is the next event's alone.
- **The goal's counter, a mechanism new to the rules.** It counts each draw that takes the draw pile's last card: a pile holding a card before the draw and none after it. A dry pile with nothing to draw counts nothing, so an empty deck never counts. An emptying counts whether or not a shuffle follows it. The rules a test holds on the fixture: a draw that dries the pile counts one, a draw that leaves a card counts none.
- A corner, decided here: a draw that dries the pile, shuffles and dries it again in one turn counts two. It takes a deck of five cards or fewer with a card added on top of its draw pile, as an answer or the capstone adds one. The user was told "once a turn at most"; the hand-back says this corner.
- Neither helper takes an argument beyond the chronicle, so neither holds a decision the content did not make.
- **The strip.** It is drawn on the paper the pinned achievement is drawn on, with that paper's edge and the plain line its goal reads in, and stops a press as that paper does without ever answering one. As the mockup has it: as wide as the end-turn button, 28 tall, 2 clear of the button's top edge, the line centred. It raises no tooltip. It follows the chronicle the screen is rendered on, as the button's turn does.
- Calendar played is refused nowhere else: it aims at nothing, and a city short of science reads the standing "Costs 2 science".
- Priced against what does the job: nothing else shows anything of the timeline and nothing else costs science, so there is no card to weigh it against. Two plays of Fire pay for one Calendar.
- Science comes from Fire alone and Calendar needs Irrigation alone, so a campaign that has learned Calendar and not Fire holds a card it cannot pay for. Said to the user, who kept the link.
- The goal's need, as simulated on the draw rule: a deck of nine cards or fewer empties its pile every turn and reaches 12 on turn 12 or 13; ten to fourteen cards, turn 24 or 25; the opening deck's seventeen, turn 37 with nothing changed. Said to the user, who kept 12: weighing it is the balance pass's.
- Out: the turn shown at no cost by the technology alone; a single-use Calendar; a card that moves the next event a turn later; a recall, kept for the Bronze Age; the countdown wording and the first plural branch it would bring; drawing one card out of the top of the draw pile, the user's fallback, which stands in the ideas.
- A chronicle in progress needs no care: no save is owed anything before the Bronze Age.
- Reconcile, the strip: it goes through the pinned achievement's paper as it is. What differs is meant: its place, and its width, the button's. The mode's chip stays apart: a block of colour there says a mode is on.
- Reconcile, the refusal: it goes through the door a unit card's "No idle population" goes through, with a sentence of its own.
- Reconcile, the goal: no standing counter reads a pile, so it gets a counter of its own beside the others.
- Reconcile, the wording: no sentence in the game changes its words with its number, and with "Event on turn {turn}" none does still.

**Traps:**

- The tree stands a column in the content's order, and a technology's column is one after the furthest it needs: the technology and the achievement are declared after Pottery's and before Bread's, so Calendar's plate stands first in the third column, above Bread's.
- The plate reads its goal on two lines, measured at 179 wide on a goal column of about 156, and two reward lines under it: four, under the five Tanning's plate reads, so no plate grows.
- The glossary lint flags "calendar", the word the schedule's row forbids, on any edit of `src/ui/text.ts`: the two name entries carry the exception mark as Settlement's do, and the word stands for the schedule nowhere.
- A block is a closed set and so is a change's name: a member added to either is taken by every switch over it, in `src/rules/` and in `src/ui/` alike, and the refusal's text entry is keyed by the block's name.
- `src/rules/save.ts` reads a chronicle field by field: a fact the chronicle gains is written and read there, or a resumed chronicle loses the turn it showed.
- Nothing the player does steps the timeline's generator: the effect reads the turns the timeline already holds.
- The coherence test asks every closure its cheapest answer on a chronicle launched on each age, the settle phase included: the card's block and its effect answer there.
- An achievement's tally moves after every command, on the stages the command resolved as: the draw of a turn is among the stages of the end of the turn before it, and the first draw among those of the settle phase's end.
- The spec opens on the save it wrote: the science is gained through the helper a card's effect composes, never a stock written; the deck holds Calendar through the civilization the chronicle is launched on; the turn the strip reads is the rules', never a literal.
- `docs/PHASER.md`, _Input across scenes_ and _The pointer's readings_, for a strip that stops a press and lets the wheel through; _Under a Playwright spec_ for the spec.
- A card's name is reached in code through its text key alone, never a re-typed literal.
- No number stands on a design page: the sentences go in as written.
- The collection gains a card for a campaign that has learned Calendar; a browse or deck-editing spec red on CI for frame starvation is the known overflow the board's line _The collection scrolls_ answers, and is reported, not chased.
- Comments are for traps only, in every file the line touches.

**Plan:**

1. `src/rules/`: the goal's counter stands beside the other counters, with its test on the fixture. An inert commit.
2. `src/rules/`: the shown turn stands — the fact the chronicle keeps, the block and the effect content composes, the save reading and writing it — with its test on the fixture. An inert commit.
3. `src/content/stone.ts`: the card, the technology and the achievement stand, the last two between Pottery's and Bread's. `src/ui/text.ts`: the six entries. `src/ui/`: the strip over the end-turn button. `e2e/calendar.spec.ts`: Calendar played on screen raises the strip reading the turn the rules hold, and a Calendar drawn while it stands is refused under its sentence.
4. `docs/ages/STONE.md`, `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`: the sentences. The board line and this file are deleted; `workflow/IDEAS.md` and the pool stand as the intake left them.

Steps 3 and 4 are the line's commit, after the two inert ones.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/calendar.spec.ts`, which the line adds. CI proves on the push: `e2e/tree.spec.ts`, `e2e/pin.spec.ts`, `e2e/launch.spec.ts`, `e2e/ending.spec.ts`, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/reference.spec.ts`, `e2e/refuse.spec.ts`, `e2e/resume.spec.ts`, `e2e/continue.spec.ts`, `e2e/press.spec.ts`, `e2e/hover.spec.ts`, `e2e/pointer-sweep.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/capstone.spec.ts`, `e2e/deal.spec.ts`, `e2e/landing.spec.ts`. The visual check looks at the strip over the end-turn button on a turn and in city mode, the pinned achievement standing; at Calendar's plate, first in the tree's third column, available on a campaign that has learned Irrigation; and at the card Calendar shown large, its cost in science.
