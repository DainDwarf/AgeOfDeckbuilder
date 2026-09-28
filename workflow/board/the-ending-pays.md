# The ending pays

**Line:** The ending pays — a chronicle is launched on the deck of the campaign the launch page's deck row names and its save names that deck; the command that ends a chronicle writes the save once, holding the campaign it paid into and no chronicle; the ending screen reads a ledger of the achievements reached and the influence paid under the outcome, the whole block centred; `e2e/ending.spec.ts` passes.

**Spec:** the pages and the sentences, written out.

- `docs/META.md` → _The loop_, third paragraph. Replace "**Campaign**, which leaves the chronicle standing in its save and opens the campaign screen." with: "**Campaign**, which opens the campaign screen: a chronicle in progress is left standing in its save, and an ended one has left it already."
- `docs/META.md` → _The collection and the deck_, second paragraph. After "A civilization owns its **deck**, and the deck is what the collection screen edits" and its sentence, add: "A deck has a name: the launch names the deck it launches on, and the chronicle's save keeps that name beside the chronicle, which carries the deck's content as it stood at the launch."
- `docs/META.md` → _The save_. Replace "A chronicle's save is its state and its seed, and it names the content version it was written on" with "A chronicle's save is its state and its seed, and it names the region and the deck it was launched on and the content version it was written on". After "and a chronicle in progress is continued where it stood." add: "A chronicle that ends pays into the campaign in the one write that takes it out of the save, so it pays once and an ended chronicle is never kept; one a save holds all the same is dropped at the boot, unpaid, as a chronicle the boot cannot read is."
- `docs/CHRONICLE-SCREEN.md`, the capstone's window paragraph. Replace "when the chronicle screen opens, on a chronicle begun and on one resumed alike, an ended one excepted, whose screen opens on its ending screen instead, and when the capstone lands" with "when the chronicle screen opens, on a chronicle begun and on one resumed alike, and when the capstone lands".
- `docs/CHRONICLE-SCREEN.md`, the ending screen paragraph. Replace "and then what the chronicle paid, as [`META.md`](META.md) says." with: "and under it a ledger of what the chronicle paid, as [`META.md`](META.md) says: one row per achievement reached, in the order reached, a check mark and its technology's name, and at the row's end the influence it paid, a diamond and the number, which a row that paid none does not read; then, under a rule where a row stands over it, the influence paid in all, a diamond, the word and the number, which reads 0 where nothing was paid. The outcome and the ledger are one block, centred on the screen." Add at the paragraph's end: "The ending screen is seen once: the chronicle has left the save, and the game boots next on the campaign screen."
- `docs/INTERFACE.md` → _The launch page_. After "the first of each list chosen until another is pressed," add "the deck row listing the campaign's decks by name,". The rest of the section stands.
- Player-facing text, `src/ui/text.ts`: one new entry, `'ending.reached': '✓ {achievement}'`. The ledger's total reads the existing `label.influence`; the numbers are bare digits. `launch.deck` stays.

**Doc-impact:** `docs/META.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`.

**Scope:**

In:

- The campaign holds its decks by name. A new campaign holds one, named as the catalogue deck it is opened on. The deck row of the launch page lists the campaign's decks' names, the first chosen; it stays on the page.
- A chronicle is launched on the content of the campaign's deck chosen — its city section, its settle section and its cards, each card by its id, in the deck's order — and no longer on a deck of the catalogue. The chronicle carries that content from the launch on, as it does today; a chronicle's cards carry no number of the collection.
- The chronicle's save keeps naming the region and the deck. The name is read against the campaign's decks, not the catalogue's: a chronicle naming a deck the campaign does not hold is dropped with its reason, the campaign standing.
- The rule "an ended chronicle pays into the campaign and leaves the save" lives in `src/rules/`, behind the one door the screen keeps a chronicle through: what is kept after a command is the campaign and the chronicle, or, where the chronicle has ended, the campaign paid into and no chronicle. The screen keeps what the rules answer and holds the payment for the ending screen.
- An ended chronicle in a save's text is dropped at the read, unpaid, with its reason; a save written on one is therefore refused, as anything the reading would drop is. No test for this corner, by the user's call.
- The ending screen reads the ledger from the payment, on the chronicle the screen holds in memory.
- `e2e/resume.spec.ts`'s test "an ended chronicle reopens on its ending screen, and no capstone's window rises" is deleted, by the user's call: the behaviour is no longer promised.

Out:

- The cards a technology unlocked are not read on the ending screen.
- The ending's own scaled influence: the ending itself pays nothing, the achievements pay.
- The warning on a launch over a chronicle with achievements reached; a launch over a chronicle in progress ends it unpaid, as today.
- Deck editing, a second deck, a deck's player-facing name: the row reads the name as it is kept, as the page reads an age's and a region's id today.
- Restarting a chronicle on its choices.

Corner cases decided:

- A campaign saved before this line holds one unnamed deck: it is not a campaign's shape, refused whole, a new campaign opened. Nothing deployed holds one.
- A city section the save cannot resolve is the first catalogue deck's again, as today, in the deck that held it.
- A defeat that reached nothing: the ledger is the total row alone, reading 0, no rule over it.
- An achievement paying no influence: its row reads the name and no diamond or number.
- A payment the rules refuse — a technology already unlocked — cannot arise from play, one chronicle being in progress at a time; the design says nothing of it.
- Reloading on the ending screen boots on the campaign screen; the address naming `continue` then fails the boot, the save holding no chronicle, as it does today.

**Traps:**

- The save is written when the command is applied, before its play-out: the ending screen rises seconds after the chronicle left the save. Nothing the play-out or the ending screen reads may come from the save.
- The navbar's influence reading and the tree read the campaign held when their screen is created; the campaign held in memory has to be the paid one by the time Campaign is pressed on the ending screen, or the bar reads the old number until a reload.
- `writeSave` reads its own text back and throws on anything dropped. Once the read drops an ended chronicle, every e2e helper that plants one throws: `openSaved`'s branch for an ended chronicle, `menu.spec.ts`'s defeat-screen test and the deleted resume test are the three sites.
- The overlay's first render stands the ending screen where the chronicle opened has ended; no chronicle opens ended any more, so that branch is dead and goes, with `CHRONICLE-SCREEN.md`'s clause.
- `launched` shuffles the deck's cards from the seed: the campaign's deck must hand the ids in the order the catalogue deck lists them, or every spec's `launchedOn(seed)` stops equalling the chronicle the page launches. `menu.spec.ts`'s Launch test holds that equality.
- e2e helpers build a campaign with `newCampaign(CATALOGUE, firstsOf().deck)` and a chronicle save with `firstsOf().deck`: the name must keep resolving, the campaign's first deck being named as the catalogue's.
- The ledger is text and rotated squares on the overlay's scrim: `docs/PHASER.md` → _Rendering under WebGL_ for a diamond drawn as a square turned and for text, → _Scenes and stacking_ for what stands on the overlay; the diamond precedent is `src/ui/tree.ts`.
- A switch over a closed set returns or ends in a `never` check; the overlay's `Carried` switches are such sites.

**Plan:**

1. `src/rules/campaign.ts` and its test: the campaign holds its decks by name, a new campaign one; the content of a campaign's deck is answered as the deck a chronicle is launched on. Leaves the rules tests green on the new shape.
2. `src/rules/save.ts` and its test: the campaign's decks read and written by name with every fate the one deck has today; the chronicle's deck name resolved against the campaign; an ended chronicle dropped at the read; the rule that an ended chronicle pays and leaves the save, with its one test on the fixture — an ended chronicle kept is the campaign paid into and no chronicle, a chronicle in progress kept is both, unpaid.
3. `src/ui/save-entry.ts`, `src/ui/chronicle-scene.ts`, `src/ui/launch-page.ts`: the launch on the campaign's deck chosen, the row listing the campaign's decks, the screen keeping what the rules answer and holding the payment. Leaves the game playing to an ending that pays, the ending screen unchanged.
4. `src/ui/overlay.ts`, `src/ui/text.ts`: the ledger under the outcome, the block centred, the dead first-render branch gone. Layout as the mockup holds it, in design units: rows in the line's 22px, one row every 34, 44 between the outcome's line and the first row, the ledger 340 wide and centred, names at its left end, numbers at its right, a 10-unit diamond in `LOOK.influence` before each number, the rule one unit in `LOOK.panelEdge`, the total row bold.
5. `e2e/`: `ending.spec.ts` added; `resume.spec.ts` loses its ended test; `menu.spec.ts`'s defeat-screen test opens on the turn before the fall and ends it on screen; `chronicle-screen.ts` loses `openSaved`'s ended branch and takes whatever the campaign's new shape asks of `plant`.
6. The `docs/` sentences above; the board line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Proof: `npx playwright test e2e/ending.spec.ts` — opened on the save `landed()` gives, the shelter played: the ending screen's ledger reads each achievement and the influence `paidInto` answers for the won chronicle; the save's text reads back as that campaign and no chronicle; Campaign from the menu opens the campaign screen with the bar reading the paid influence, and the launch page stands with no Continue.
- CI's, for the hand-back: `victory`, `fall`, `menu`, `resume`, `continue`, `campaign`, `tree`, `capstone`, `boot`, `settle`, `browse`, `press`.
