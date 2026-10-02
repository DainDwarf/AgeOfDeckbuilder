# Hunt

**Line:** **Hunt** — the Nomadic card that hunts: an instant costing nothing, played through a worker standing on a tile carrying deer or cattle, inside the border or out, which removes the feature for a one-time gain of food, two copies in the deck the Nomadic civilization opens with; a feature removed by a card and an aim asking for one feature of several land here, each with its one test on the fixture, and the herd's feature deal goes through the placing helper that mirrors the removal; `e2e/worker-instants.spec.ts` plays Hunt on screen. Doc-impact: `docs/ages/NOMADIC.md`, `docs/MAP.md`, `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Spec:** `docs/CHRONICLE.md` _Cards_ (an instant played through a worker spends one of its action; a card aimed at a tile lands on no tile its aim does not admit, and a refused play says its one reason), `docs/MAP.md` _The tile_ (a feature, at most one, lying on its terrain; what reaches any tile a worker stands on) and `docs/ages/NOMADIC.md` _The cards_ are the spec. The sentences that change:

- `docs/GLOSSARY.md`, the **remove** row: the meaning becomes "To take a card out of a deck, the reverse of add, or a layer off a tile." and the Not column gains `clear, strip`.
- `docs/MAP.md` _The tile_, the feature bullet: "**Feature** — at most one, dealt by the generator or by an event's answer, and removed by a card played through a worker. A feature lies on its terrain, so it is gone when its tile is terraformed."
- `docs/MAP.md` _The tile_, the paragraph after the bullets opens "**Placing an improvement, removing a feature and terraforming reach any tile a worker of the player's stands on**, inside the border or not — unlike building, which is inside the border only. Each spends one of the worker's action." The rest of the paragraph stays.
- `docs/CHRONICLE.md` _Cards_, the Instant bullet: "terraform a tile where a worker stands" becomes "terraform a tile or remove its feature where a worker stands", and "An instant played through a worker — an improvement, a terraform — spends" becomes "An instant played through a worker — an improvement, a feature removed, a terraform — spends".
- `docs/CHRONICLE.md` _Units and combat_: "A worker spends its action on a card played through it — a building, an improvement, a terraform — one to a card" becomes "— a building, an improvement, a feature removed, a terraform —".
- `docs/ages/NOMADIC.md` _The units_, the worker: "the cards played through it — Gather, Trapping —" becomes "— Gather, Trapping, Hunt —".
- `docs/ages/NOMADIC.md` _The cards_, a bullet after Trapping's: "- **Hunt**, an instant costing nothing, played through a worker standing on a tile carrying deer or cattle, inside the border or out: the feature is removed and the city gains food once. The tile's standing yield against food now, and the hunt that walks from tile to tile against the worker that stays on one."
- `docs/ages/NOMADIC.md` _The cards_, "then a few Trapping and March" becomes "then a few Trapping, Hunt and March".

The player-facing entries, each ending in no period:

- The card's name: "Hunt". The herd's answer stays "Hunt it": a card name is content.
- The card's rules text: "Remove a [player:worker]'s [feature:deer] or [feature:cattle]. Gain 6[food]" — the number read on the face as the camp's pillage reads its own, in the text and in the content both.
- The refusal of a tile with a worker on it carrying no deer or cattle, a bare tile and a fertile one alike: "Wrong feature", under a reason of its own beside `wrong-terrain`.

**Doc-impact:** `docs/ages/NOMADIC.md`, `docs/MAP.md`, `docs/CHRONICLE.md`, `docs/GLOSSARY.md`. `docs/ages/STONE.md` stands: Hunt is the Nomadic Age's. `CHANGELOG.md` is written at the version bump.

**Scope:** In: the card, its text, two copies in the Nomadic deck; the feature removal helper and the feature placing helper that mirrors it, the herd's deal rewritten to draw its tile and compose the placing helper; the aim check for one feature of several, with its reason and its text; one rules test on the fixture for each of the three (the removal, the placing through the herd's deal shape, the check); Hunt's test in `e2e/worker-instants.spec.ts`; the pages.

Out: Trapping's move to deer, its goal counting hunts and the deck losing Trapping, a line of its own; a Hunt on a tile carrying a trapping, Trapping's intake; any change to Gather, to the herd's answers' texts or to the features' shares.

The numbers, provisional and to be played: cost nothing, 6 food, two copies. 6 is the growth threshold at the opening — one population, the first worker and scout — so a Hunt on the first turns is one population on the spot; a deer forest gathered every turn repays it in six worker turns, so keeping the tile is the long play and hunting it the fast one. The herd's _Hunt it_ gives 4 with no walk and stays as it is.

Corners decided at intake:

- Hunt reaches any tile a worker of the player's stands on, inside the border or out, as placing an improvement does: a cattle plain the city works is hunted like any other, and the population keeps working the bare plain after.
- Hunt is refused where no worker with action stands, then where the tile carries no deer or cattle — the worker's reasons first, as every card played through a worker answers them.
- The worker stays on the tile, its action spent, as after Trapping.
- A feature removed is gone for the chronicle; the herd's _Follow it_ may deal deer onto that forest again, since it carries no feature then.
- A campaign begun before owns no Hunt: the collection opens with the deck card for card and nothing adds a card to a standing campaign, the standing rule, nothing added for it. A chronicle in progress plays the cards it was dealt and never sees it.
- Trapping's goal, when its line comes, reads the `played` group Hunt's play raises; Hunt adds nothing for it.

What the reconcile chose:

- The feature's removal goes through the one-tile `retiled` door every layer change of a tile goes through, as a sibling of the improvement's placing and the building's; the terraform, which drops the feature with the terrain, stays apart: the difference is meant.
- The herd's deal writes its own `retiled` change today, the feature set and nothing else; it becomes a draw composing a placing helper, the mirror of the removal, on the user's order, so the two feature changes read as one pair. The change names and the stages it raises stay what they are.
- The check for one feature of several is a sibling of the terrain check, same shape over the feature row and answering `wrong-feature`, kept apart: repetition for shape, nothing factored on resemblance.
- The worker's aim and action spend, and the food gained, go through `throughWorker` and `gained` as they stand.

**Traps:**

- The ids `deer` and `cattle` exist once the Deer and cattle line has shipped; the catalogue's coherence tests refuse a card text or a closure naming a feature the catalogue does not hold. This line ships after it.
- The one-tile retile is private to `src/rules/cards.ts`; `src/rules/schedule.ts` already imports the terraform from there, so the herd's deal reaching a placing helper beside it crosses no new boundary.
- `TileBlock` in `src/rules/state.ts` is a closed union; a member added there wants its `refusal.<member>` entry in `src/ui/text.ts`, and the typecheck says where else it is switched.
- The fixture holds one feature, `PH_Fertile`; the check's test wants a tile carrying a feature the card does not name, so the test's content, in the test file or the fixture, is the implementer's to author.
- The herd's deal is tested in `src/rules/schedule.test.ts` by its stage names, `retiled` then `charted`, and by the tile dealt; the rewrite keeps both.
- The Nomadic deck grows by two cards, so every seed shuffles and draws another hand: every spec that searches a seed for a hand holding a card lands on another seed through `firstSeed` in `e2e/chronicle-screen.ts`; one that finds no seed under a thousand is a finding to report, never a search to loosen. Deer and cattle each lie on one tile in twenty of their terrain, so a worker stepped onto one on turn 1 with Hunt in hand is found within the thousand.
- The map keeps its feature marks in a container named `features` beside `improvements`, both read by `marksIn` in `e2e/chronicle-screen.ts`; a `retiled` change redraws the tile, so the mark goes with the feature and the screen needs nothing new.
- The collection shows one card more; a browse or deck-editing spec flaking red on CI is the frame starvation seen before when panels overflowed, a finding to relay, never a timeout to raise.
- `docs/PHASER.md` holds what a spec rests for before it presses; `e2e/worker-instants.spec.ts` already does it through the helpers it uses.

**Plan:** Two commits. First, inert, the mechanism: `src/rules/cards.ts` gains the feature's removal and the feature's placing, both through the one-tile retile, and the check for one feature of several with `wrong-feature` in `src/rules/state.ts` and its text in `src/ui/text.ts`; `src/rules/schedule.ts`'s herd deal draws its tile and composes the placing helper; `src/rules/cards.test.ts` and `src/rules/schedule.test.ts` hold the three tests on the fixture; nothing of the content changes, and `npm test` passes. Second, the content and its proof: `src/content/nomadic.ts` holds Hunt and the deck's two copies; `src/ui/text.ts` its name and rules text; `e2e/worker-instants.spec.ts` plays it on screen; the four pages take their sentences; the board line and this file are deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/worker-instants.spec.ts`. CI proves on the push every other spec, each one drawing another hand: among them `e2e/landing.spec.ts`, `e2e/farm.spec.ts`, `e2e/inspect.spec.ts`, `e2e/hand-aim.spec.ts`, `e2e/refuse.spec.ts`, `e2e/collection.spec.ts`, `e2e/deck-editing.spec.ts` and `e2e/browse.spec.ts`.
