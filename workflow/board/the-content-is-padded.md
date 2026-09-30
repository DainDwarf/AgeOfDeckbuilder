# The content is padded

**Line:** The content is padded — twenty placeholder cards, Placeholder 1 to Placeholder 20, one copy each in the Nomadic civilization's deck, each an instant costing nothing, aimed at nothing and doing nothing; the catalogue's coherence test passes on them, and the whole suite on CI. Doc-impact: none — the padding never reaches `main`.

**Spec:** `workflow/BRANCH.md`, _The padding_. No `docs/` page names a stand-in's content (`DOGMAS.md`, _Docs_), and this content leaves before the merge, so the age page is not touched. Player-facing text, forty entries, verbatim: for each N from 1 to 20, the card's name **Placeholder N** and its rules entry **Does nothing.**

**Doc-impact:** none — the padding never reaches `main`.

**Scope:**

- In: twenty cards of the Nomadic Age, ids `placeholder-1` to `placeholder-20`, each an instant with no cost, aimed at nothing, whose effect changes nothing, neither single use nor a hazard; the Nomadic civilization's deck holds one copy of each after the cards it holds today.
- In: a new campaign then owns 28 distinct cards, so every surface of the meta overflows: the collection mode's panel at six to a line, the deck editing mode's collection at four and its rows, the civilization mode at seven, and a civilization's browse at eight. A chronicle deals from a deck of 37, twenty of them dead draws.
- In: the whole suite passes on CI on the branch. A spec that searches for a seed searches the padded content, and one whose search now finds nothing, or whose seed now leads somewhere its assertions no longer hold, is a finding: the implementer diagnoses it and reports it under _Deviations_, and never loosens an assertion to pass.
- Out: any change to how the rules play an instant; any other age, civilization or campaign; the catalogue's version.
- Corner: a save a browser already holds keeps the campaign it was begun on, which owns no placeholder; the padding shows on a new campaign, through **Manage Save**, **Clear save**. Decided so: nothing migrates a campaign.

**Traps:**

- The content is `src/content/nomadic.ts`: a card declares its kind, its cost and its aim (`:89-172`), and the civilization's deck is the list at `:175-182`. A hazard's no-op is `unchanged(paid)` (`src/rules/cards.ts:49`, `src/rules/stages.ts:145`), the shape a card that changes nothing answers (`DOGMAS.md`, _Architecture_: a helper answers no change where it moved nothing).
- Every card needs a name and a rules entry in `src/ui/text.ts` (`card.<id>`, `rules.<id>`, `:77-102`), which the coherence test checks (`src/content/catalogue.test.ts:135`); the rules entry is laid out and its names resolved (`:142`), so it holds no bracket.
- The collection's order is age, then kind, then name (`src/ui/collection-layout.ts:38-40`): the placeholders stand among the instants, Gather and March before them, Trapping after. Names compare as text, so Placeholder 10 stands before Placeholder 2; that is the order and nothing is to be fixed.
- A card's price is its age's base price doubled per copy owned (`src/rules/campaign.ts:153-157`); the placeholders need nothing for it.
- The specs search seeds at thirteen sites (`firstSeed`, `e2e/chronicle-screen.ts:809`, and its callers across `e2e/`); every one reads its oracle from the rules, so a changed seed is expected and a search that finds none is the finding.
- Every spec runs on the game's content (`DOGMAS.md`, _Testing_), so a count or an order a spec reads off the rules moves with the padding by itself; a spec that fails on a literal is a spec that broke the dogma, a finding to report.

**Plan:**

1. `src/content/nomadic.ts`, `src/ui/text.ts`: the twenty cards, their entries, and the deck's twenty copies. Leaves standing: the padded content, the coherence test passing.
2. `workflow/BRANCH.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/collection.spec.ts`, whose first test reads a new campaign's stacks off the rules and finds each on the screen, placeholders among them. The rest is CI's on the push of the branch, the whole suite: every spec, the thirteen seed searches most of all.
