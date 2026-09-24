# Cards carry counters

**Line:** - **Cards carry counters** — a card in a chronicle is an instance carrying its counters, named numbers its content declares with what they start at, set when the card is made and read by its strike and its face, with the dogma, the chronicle page, the interface page and the glossary saying so. Doc-impact: `DOGMAS.md`, `docs/CHRONICLE.md`, `docs/INTERFACE.md`, `docs/GLOSSARY.md`.

**Spec:** the four pages, each sentence written out.

- `docs/GLOSSARY.md`, one row, after **single use**: `| **counter** | A named number a card carries in a chronicle, declared by its content and set when the card is made. | token, marker, charge, stack, variable, modifier |`
- `DOGMAS.md`, _Architecture_, the second bullet: replace "a card carries no identity, so the piles are the rows and one movement between them is one change however many cards it carries" with "a card carries its counters and no identity of its own, so the piles are the rows and one movement between them is one change however many cards it carries". The rest of the bullet stands: two copies with equal counters are still what two chronicles cannot tell apart.
- `docs/CHRONICLE.md`, _Cards_, after "Every card has a resource cost, possibly none.": "A card in a chronicle carries **counters**: named numbers its content declares with what each starts at. Whatever makes a card in a chronicle — the deck at the opening, an event laying one, a capture's reward — makes it at those values or sets them otherwise, and sets none its content does not declare; the card's own strike reads them, and so does its face, so what a card does and what it says are one fact. A closure reading the turn in place of a counter was rejected: a card in the hand whose face cannot say what it will do."
- `docs/INTERFACE.md`, _The presses_, the paragraph on a thing named in a card's text, after "a card as its face, anything else as the card the infopanel reads it by": "a card named is shown as its content makes it, at the counters it starts with, since a name stands for the card and not for one copy in a pile".

No player-facing sentence changes: every card the game ships with declares no counter, and every face reads as it did.

**Doc-impact:** `DOGMAS.md`, `docs/CHRONICLE.md`, `docs/INTERFACE.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: the piles of the state — the draw pile, the hand, the discard pile — hold card instances, each its content id and its counters. A card's content declares the counters it carries and their starting values; a card that declares none carries none. One maker every path goes through makes an instance from an id: the opening for the deck's two sections, the laying of a card by an event or a capstone, the reward a capture lays in the discard pile; the maker takes the counters to set and refuses one the content does not declare, in the one rejection vocabulary. The strike is handed the card it strikes as, so a hazard reads its own counters. A face fills its rules entry from the instance's counters; a face drawn from no instance — the small card a name raises, the card shown large from a name — fills it from the content's starting values. The e2e helpers read the piles as instances. The fixture gains a card with a counter, and the mechanism's tests.
- Out: changing a counter on a card already made, which waits for the first card that ticks and is its own line then. The effect closure of a played card is not handed the card: no content reads a counter there yet. Modifiers, triggers on the draw or the discard, the meta's modified copies: none of it, the instance is the object they land on later. Hunger's own counter is the next line, not this one.
- Corner cases decided here: a card that declares counters set to none by its maker starts at its declared values; a maker setting a counter on a card that declares none is refused like any undeclared one. A settle card and a single use card leave the chronicle as instances and are never made again. Recall moves the instance whole. Two copies with equal counters are one and the same to the flow: the places-in-the-pile mechanism of the changes stands unchanged, and no change name is added. The browse sorts the draw pile by the instance's kind and name as before. The catalogue's deck sections and a deal's rewards stay ids until made.

**Traps:**

- `src/rules/` never imports `src/ui/`: the check that a card's rules entry has every placeholder filled by a counter the card declares lives in the content coherence tests (`src/content/nomadic.test.ts`, `src/content/stand-in.test.ts`) by reading the entry with the card's starting counters — `text()` in `src/ui/text.ts` already refuses an unfilled placeholder and ignores a value no placeholder takes — and never in `catalogued`.
- The fixture (`src/rules/fixtures.ts`) and the stand-in (`src/content/stand-in.ts`) share card ids and so share text entries: `rules.PH_Hunger` is the stand-in's face on screen, and the stand-in's Hunger empties the stock. The fixture's card with a counter is a card of its own with an entry of its own, never PH_Hunger.
- The e2e suite reads the state through `chronicleOf` in `e2e/chronicle-screen.ts` and indexes the piles by id (`chronicle.hand.indexOf('PH_Worker')`, `toEqual(opened.hand)`, and the like across the specs); every such read goes through the instance's id now. `cardOnFace` reads the face's id, which stays the content id.
- The rules tests build chronicles with pile overrides of ids (`hand: ['PH_Hunger']` in `src/rules/cards.test.ts`, `src/rules/schedule.test.ts`, `src/rules/chronicle.test.ts`); a fixture goes through the transform production uses, so the fixture's builder makes those instances through the same maker the opening does, never by an inline copy.
- `src/ui/piles.ts`, `hand.ts`, `overlay.ts`, `small-card.ts`, `aim-line.ts` and `chronicle-scene.ts` read card ids off the piles; `src/ui/card-face.ts` builds the face. The name reference kind `card` (`src/ui/text-run.ts`) names a content id and needs no change.
- No chronicle save exists: nothing serialised holds the old pile shape.
- `docs/PHASER.md` is cited, not restated, for anything the UI sweep meets; nothing in this line draws differently.

**Plan:**

1. The four `docs/` edits, verbatim from _Spec_, and the glossary lint clean.
2. `src/rules/state.ts` and `src/rules/catalogue.ts`: the instance in the piles, the declared counters on a card, the strike handed the card; then the maker and its refusal, and the opening (`src/rules/chronicle.ts`), the laying and the reward (`src/rules/schedule.ts`), the strike and the recall (`src/rules/cards.ts`) going through it. `src/rules/stages.ts` stands. The three content files compile: a card declares no counters unless it has them.
3. `src/rules/fixtures.ts`: a hazard of its own declaring one counter and striking it; the fixture's builders make instances through the maker. The tests: a card laid with its counter set strikes for that value; laid with none set, for its declared start; laid with a counter its content does not declare, refused; every existing pile assertion reads instances.
4. `src/ui/`: the face fills its entry from the counters, a face from a name from the starting values; the pile, hand, overlay, small card and aim line reads. One Vitest on the pure face: the entry of the fixture's counted card reads its counter. The content coherence tests read every card's entry with its starting counters.
5. `e2e/chronicle-screen.ts` and the specs that index the piles by id.
6. `npm run check`, `npm test`, `npm run lint`, then the spec.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The spec: `npx playwright test e2e/press.spec.ts`, the spec that reads the piles off the state the most, proving the e2e sweep holds. CI proves the rest on the push: every other spec, `browse.spec.ts`, `recall.spec.ts`, `refuse.spec.ts`, `reference.spec.ts` and `deal.spec.ts` walking the piles most directly.
