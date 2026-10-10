# Specs reach their cards through the campaign

**Line:** Specs reach their cards through the campaign — every chronicle a spec launches is launched as the launch screen launches one on a campaign built through the rules, a Stone card reached by its technology learned with its needs, a copy bought and the deck edited, and the save planted holding that campaign beside the chronicle. Done when nothing in `e2e/` spreads a civilization, carries an age and a learned list of its own (`Era`, `firstEra`, `secondEra`, `withCard` gone) or plants a chronicle beside a campaign it was not launched from, `npm run check`, `npm test` and `npm run lint` pass, and `DOGMAS.md` says so.

**Spec:**

- `DOGMAS.md`, _Testing_, the dogma opening "**A spec opens on the save it wrote, on the game's content.**": after its first sentence ("...the game's content.**") insert "Its campaign is built through the rules too — a technology learned with its needs, a copy bought, the deck edited — and the chronicle is launched as the launch screen launches one on that campaign, in the age it reached, on the region and the civilization it holds, the save planted holding that campaign beside it; nothing in `e2e/` builds a civilization or a learned list by hand." The paragraph stays one line.
- No player-facing entry; no `docs/` page.

**Doc-impact:** none — the suite alone changes; the standing rule goes to `DOGMAS.md`, the repository's own file.

**Scope:**

- In: every spec chronicle launched from a campaign through the launch screen's own door — the campaign's opening choices (the latest age reached, its first region, the campaign's civilization) — the fresh campaign where a spec learns nothing, so a bare spec changes nothing but the door it goes through; the card specs (`tannery`, `trapping`, `farm`, `heal`, `fishery`, `embark`, `calendar`, `irrigation`, `refuse`, the hand-aim helper `hand-aim` and `press` share) reaching their card by the technology that unlocks it learned with its needs and the dealt copy added to the deck, so they play in the Stone Age; the Stone-era specs (`pillage`, `pin`, `launch-warning`, `press`) launching on the civilization their campaign holds; the save a spec plants holding the campaign the chronicle was launched from.
- Deck shapes, each a player's move: Calendar's second copy is bought (`bought`) out of the influence the learning paid — measured, the campaign holds 7 and the copy costs 2 — then added; Irrigation's one-card deck stays, every other card removed (`removedFrom`, the deck has no floor), or the spec searches for the card in hand on the full deck, the spec's own choice; a card the deck already holds every owned copy of is bought before it is added.
- Out: `wonCampaign` — the campaign a win leaves — stays as it is, for the specs on the campaign screen and for the Stone-era specs alike, since it reached the Stone Age through the rules; where the helpers live and what shape they take.
- Corner cases decided here: a seed search runs in the Stone Age now; the first seed with any one Stone card in hand on the full deck is 5 in either age (measured for every card above), and a search that finds no seed in the Stone Age is a finding, never a fall back to the Nomadic Age.
- Reconcile: `launchedOn` and `Era` become one with `launchedAs` and `openingChoices`, in the projected form; `withCard` is replaced by the learning and the editing, nothing between; `wonCampaign` and a campaign that learned Settlement straight stay apart, the difference meant.

**Traps:**

- `learnedWithNeeds` lives in `tools/learned-with-needs.ts`, the forge's helper, and `archipelago.spec.ts` and `collection.spec.ts` import it from there already; `openingChoices` is `src/ui/launch-layout.ts`'s, pure, and `archipelago.spec.ts` imports it too.
- The technology that unlocks a card is found by reading `catalogue.technologies[*].unlocks.cards`; nothing in the rules answers it by card, and `AIMED_AT_HAND` resolves to Fire, a Stone card like the rest.
- `chronicleSaveOf` (`src/rules/save.ts`) refuses a chronicle save naming a civilization the campaign beside it does not hold, and the launch screen reads the deck from the campaign: a chronicle holding Stone cards planted beside a fresh campaign reads today and is the defect this line removes.
- The Stone Age's schedule spreads the Nomadic one (`src/content/stone.ts`, `NOMADIC.owns`) and its first region is `temperate`, radius 12 against the Nomadic 10 (469 tiles against 331); `pillage`, `pin` and `press` already open Stone chronicles green on CI, and the frame starvation CI showed came from panels overflowing, not tiles.
- `fishery` ends a turn and `embark`'s Disembark test ends up to a deck's length of turns in the search: the Stone Age's events and camps now fall in those turns, and the search passes a seed whose chronicle ends.
- Every chronicle fixture helper in `e2e/chronicle-screen.ts` that takes a civilization or an era (`launchedOn`, `settledOn`, `paidOnGround`, `paidOnDeer`, `bareWith`, `reachedByClaims`, `aimableAtHand`) and every planter (`plant`, `plantSaved`, `openSaved`, `launchScreenOver`) is reshaped by this; `docs/PHASER.md` for anything the planters touch on screen.
- The learning's influence: Settlement pays 3, each Stone technology 1; no spec writes a campaign's influence.

**Plan:**

1. The one door: a spec's chronicle launched from a campaign and its opening choices, the planters taking the campaign beside the chronicle, the bare specs unchanged in what they launch; `Era`, `firstEra`, `secondEra`, `launchedOn` gone. Leaves every spec launching what it launched, through the campaign.
2. The card specs: each reaching its card through the learning, the buying and the editing, playing in the Stone Age; `withCard` gone. The Stone-era specs launching on the civilization their campaign holds.
3. `DOGMAS.md`'s sentence; the line deleted from `workflow/BOARD.md`.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: `npx playwright test e2e/calendar.spec.ts` — a Stone card learned with its needs, a second copy bought and both added, the chronicle launched in the Stone Age on the campaign's civilization and planted beside it. CI on the push: `tannery`, `trapping`, `farm`, `heal`, `fishery`, `embark`, `irrigation`, `refuse`, `hand-aim`, `press`, `pillage`, `pin`, `launch-warning`, `archipelago`, and every spec that opens a planted chronicle through the reshaped planters.
