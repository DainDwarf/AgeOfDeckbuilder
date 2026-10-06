# A campaign planted at a given state

**Line:** A campaign planted at a given state — `e2e/archipelago.spec.ts` builds both its campaigns through a helper that learns the technologies it names, their unmet needs first, with no deed search left in it; the rules door the helper goes through learns one technology into a campaign and has its one test on the fixture. Doc-impact: none.

**Spec:** `docs/META.md` → _The campaign_: a technology is learned once its achievement has paid, and what it unlocks is added to the collection with the copies it names, the achievement's influence taken with it. The door does exactly that for one technology, so a planted campaign is one the game could have reached. No sentence is added or changed, and nothing player-facing is written.

**Doc-impact:** none — the design states what a learned technology is and the door is machinery under that statement; the board line and the e2e helper are transient.

**Scope:**

- In: a rules door in `src/rules/campaign.ts` that learns one technology into a campaign: the technology appended to the learned ones, the cards it unlocks dealt into the collection with their copies as the next numbers, its achievement's influence added. It refuses a technology the catalogue does not hold, one already learned, and one whose needs are not all learned. `paidInto` goes through it for each reached achievement, so the game's own payment and a planted campaign take the same step.
- In: one rules test on the fixture for the door — a technology learned pays as the fixture's achievement earning it says and deals its cards; one already learned and one whose needs are not learned are refused — and the standing `paidInto` tests still green, their campaigns unchanged.
- In: an e2e helper in `e2e/chronicle-screen.ts` that takes a campaign and the technologies a spec needs and learns each with its unmet needs first, needs in the catalogue's order, so a spec names what it needs and never how the tree is shaped.
- In: `e2e/archipelago.spec.ts` rewritten on the helper. The first test's campaign has Bow and arrow learned on a fresh campaign, so Raft stands available; the second has Raft. The three deed searches, the fall-and-pay helper and the imports only they used go. Every screen assertion and both `expect`s on the campaign stay.
- Out: `wonCampaign` stays as it is, a real win paid in; the reconcile chose to keep it apart, since the ending specs want a real win and its cost is one seed search. The helper never calls it: Settlement is learned as a need.
- Out: the CLI that forges a save file, its own board line; the headless simulator, a rung.
- Corner cases: the influence a planted technology pays is its achievement's, so the Archipelago campaigns come out as today's do. The order the campaign's learned technologies stand in is read by nothing as an order — `agesReached`, `regionsReached`, the tree screen and the save read it as a set, and the save refuses only a technology unheld or named twice — so learning needs first is for the door's refusal alone. Card numbers follow learning order; the spec reads none.

**Traps:**

- `src/rules/campaign.test.ts` asserts `paidInto`'s own refusal wording for an achievement whose technology is already learned, naming the achievement; `paidInto` keeps that refusal in its words, and the door refuses in its own for its own callers. One refusal vocabulary, two sentences.
- The catalogue refuses a technology earned by no achievement and one earned by two (`treeHeld` in `src/rules/catalogue.ts`), so the achievement a technology is earned by is one, in whichever age owns it; `earningOf` in `e2e/chronicle-screen.ts` walks the ages for the same fact and stays where it is unless the rules now export the lookup, in which case the spec helper reads it from the rules.
- `paidInto` deals every achievement's cards from one running next number and refuses on a learned technology before dealing anything; going through the door per achievement must leave the campaign, the `Payment` and the refusal order as the standing tests read them.
- `secondEra`, `rowOf`, `firstSeed` and `addedToDrawPileTop` stay: other specs import them. Only what `archipelago.spec.ts` alone used goes.
- The spec's screen half is unchanged; `docs/PHASER.md` holds the frame and camera facts a spec rests on, should a run raise a question there.
- `npm run e2e` is refused by a hook; a spec runs one at a time, `npx playwright test e2e/<spec>.spec.ts`.

**Plan:**

1. `src/rules/campaign.ts`: the door, and `paidInto` taking it per achievement. `src/rules/campaign.test.ts`: the door's one test. `npm test` green, the standing payment tests unchanged.
2. `e2e/chronicle-screen.ts`: the helper that learns the technologies named with their unmet needs first.
3. `e2e/archipelago.spec.ts`: both campaigns built through the helper; the deed functions, the fall-and-pay helper and their imports removed.
4. `workflow/BOARD.md`: the line deleted. No `docs/` page changes.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/archipelago.spec.ts`. CI proves the whole suite on the push; no other spec changes, and `wonCampaign` is untouched.
