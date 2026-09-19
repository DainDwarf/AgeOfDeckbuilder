# Gather outside the border

**Line:** Gather outside the border — Gather is refused on a tile the city holds, the note over the tile says so, and the refusal is held by one test on the fixture. Doc-impact: `docs/ages/NOMADIC.md`.

**Spec:** `docs/ages/NOMADIC.md` _The cards_, the Gather bullet. Gather works outside the border: a worker gathers the map, and the tiles the city holds are the population's to work. Today a worker at home gathers the city's own tile, its building's military and culture with it, three points where the best tile on the map gives two, and doubles any tile the population already works without leaving the border's safety, against the age's own theme that the wealth is out on the map. The sentences, written out:

- `NOMADIC.md` _The cards_, replace "**Gather**, the age's card, costing nothing: aimed at a worker, it spends the worker's action and gains the yield of the tile the worker stands on, whatever its layers and the river give. It is the most copied card in the deck by far, so a hand rarely lacks one. Units act on tiles through cards." with: "**Gather**, the age's card, costing nothing: aimed at a worker outside the border, it spends the worker's action and gains the yield of the tile the worker stands on, whatever its layers and the river give; on a tile the city holds it is refused, for the border is the population's to work. It is the most copied card in the deck by far, so a hand rarely lacks one. Units act on tiles through cards, and the wealth is out on the map. Gather inside the border was rejected: a worker at home doubled the tiles the population already works, the city's own building among them, and never left."
- The Trapping bullet stands: an improvement counts inside the border at income and outside it through Gather, which is exactly the split this line draws.

Player-facing text, written out:

- The card's rules text, `rules.gather` in `src/ui/text.ts`: "Through a worker outside the border: gain the yield of its tile".
- The refusal the note says over a held tile, `refusal.held`: "Inside the city border." — the mirror of "Outside the city border." that a building card says on the other side.

No glossary row: **border** is the term, and Gather is a card name.

**Doc-impact:** `docs/ages/NOMADIC.md`.

**Scope:**

In:

- One rules helper, the mirror of the one that refuses a building card outside the border: a tile the city holds is refused with a reason of its own, a new member of the closed set of tile reasons. Its one test on the fixture: a card played through a worker composed with it is refused on a held tile with that reason and admitted on a tile outside the border with a worker on it, the worker's own reasons coming first, in the shape the farm card's reason-order test already has.
- Gather's closure in the nomadic content names the helper as its tile check, where today it checks nothing.
- The refusal text and the card's rules text, verbatim above.
- The age page sentence, verbatim above.

Out:

- Trapping stays playable inside the border: an improvement is standing income, and the age page promises it counts there.
- The city's tile as a Gather site is gone with the rule and needs no rule of its own: it is held from the settle.
- A building's yield through Gather anywhere else: no building stands outside the border, since a building card is inside only and the camps yield nothing. Nothing to decide.
- No stand-in card gathers, so the e2e content is untouched.

Corner cases decided here:

- The settle's worker enters on the city's tile, which is held: Gather is refused there from turn 1, and the worker steps out before its first Gather, which its move covers on the same turn. That is the design, not a snag.
- The order of reasons is the worker's first, as every card through a worker has it: no worker, then no action left, then the tile held. The note says the first alone.
- A tile an enemy occupies is held and refused all the same; no worker can stand on it anyway.

**Traps:**

- `TileBlock` in `src/rules/state.ts` is a closed union, and `src/ui/refusal-note.ts` builds the text key from the member name; a member with no `refusal.<member>` entry in `src/ui/text.ts` fails at the first refused play, on screen, not at the typecheck.
- `throughWorker` in `src/rules/cards.ts` puts the worker's reasons ahead of the tile's; the helper is composed as the tile check, never in front of the worker's.
- The nomadic coherence test in `src/content/nomadic.test.ts` asks Gather's refusal on an unsettled chronicle, where no worker stands, so it holds nothing of this line; the mechanism test is the fixture's in `src/rules/cards.test.ts`.
- No e2e spec plays Gather. The card's rules text is drawn on the face in the nomadic launch `e2e/boot.spec.ts` walks; a longer rules text running under the cost chip is the card-face overlap accepted until the look and is not a finding.

**Plan:**

1. The helper in `src/rules/cards.ts`, the member in `src/rules/state.ts`, the refusal text in `src/ui/text.ts`, the test in `src/rules/cards.test.ts` on a fixture card. Every existing test passes unchanged.
2. Gather's closure in `src/content/nomadic.ts` and its rules text in `src/ui/text.ts`.
3. The age page, the sentence above verbatim.

**Verify:**

```
npm run check
npm test
npm run lint
npx playwright test e2e/boot.spec.ts
```
