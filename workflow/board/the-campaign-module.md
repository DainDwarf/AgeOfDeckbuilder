# The campaign module

**Line:** **The campaign module** — the campaign as a pure module — technologies unlocked, influence, the collection of numbered card instances and the deck naming them — opened new on the civilization's deck, paid into by an ended chronicle, handing the launch its technologies, and saved beside the chronicle, each part with its own fate. Nothing on screen changes; `npm test` proves each rule on the fixture.

**Spec:** [`docs/META.md`](../../docs/META.md) → _The campaign_, _The collection and the deck_ and _The save_ are the spec, with these edits made in the ship:

- _The campaign_, the ending paragraph's first sentence, "🔧 **The ending is where the campaign takes**: when a chronicle ends, victory or defeat alike, the campaign takes the achievements it reached and the influence it pays, and unlocks what they earn; a chronicle that never ends pays nothing." becomes: "🔧 **The ending pays into the campaign**: when a chronicle ends, victory or defeat alike, the achievements it reached unlock their technologies, the cards those unlock enter the collection, and the influence they pay is added; a chronicle that never ends pays nothing." The rest of the paragraph stands. The word _take_ is the deal's and names nothing of the campaign.
- _The collection and the deck_, the first paragraph's first two sentences become: "The **collection** is every card the player owns, every copy a card of its own, so what is done to one copy is done to no other. A campaign opens with the collection its civilization's deck is made of, card for card, and its deck holding every one; a technology adds the cards it unlocks with their copies; and influence buys one more copy of a card owned, at a price that is the card's content." The third sentence stands.
- Same section, the second paragraph's sentence on the city section opens differently: "The **city section** is the deck's and stands in no collection, its card among it; it is not edited by press: what it holds — the city's building, how far it sees, the population it opens with — is what influence buys 🔧, and the collection screen shows its card at the head of the settle section, fixed there and never moved out."
- _The save_, the sentence "The campaign's save survives a content change by dropping what it cannot resolve, a card the catalogue no longer holds among it." becomes: "The campaign's save survives a content change by dropping what it cannot resolve, a card the catalogue no longer holds among it, and a city section it cannot resolve is the civilization's deck's again; a save that is not a campaign's shape at all is refused, a new campaign opened, and the boot says why on the browser's console alone." The _Why the two fates_ sentence stands.

No player-facing text, no glossary row: _pays_ is the pages' own verb.

**Doc-impact:** `docs/META.md`.

**Scope:**

In:

- The campaign's state, a pure serialisable value: the technologies unlocked by id; the influence, an integer; the number the next card instance takes, counting up from one and never dealt twice, as the chronicle numbers units; the collection, every instance owned, each its number and its content id; and the deck — its city section holding the city's building, sight, idle population and its card as an instance of its own, outside the collection, and its settle and cards sections each naming instances of the collection by number. A copy owned and a copy in the deck are one instance seen twice.
- A new campaign, opened on a catalogue deck by id: no technology, no influence, one instance per card of the deck's cards and settle sections, the deck naming every one of them in the sections they came from, the city section copied with its card as a new instance. The boot opens it on the catalogue's first deck, the one civilization's.
- An ended chronicle paid into the campaign, the one function: for each achievement the chronicle reached, in the chronicle's order, its technology is unlocked, each card the technology unlocks enters the collection as as many new instances as the copies it names, in no section of the deck, and its influence is added. It answers the campaign after and what was paid: the influence, the achievements reached, the technologies unlocked, the instances entered. A chronicle that has not ended is refused; an achievement whose technology is already unlocked is refused, since it was never open. An age a technology unlocks records nothing: the furthest age is read off the technologies.
- The launch hands the rules the campaign's technologies, where the previous line handed none, so the achievements open to a chronicle are the campaign's to say.
- The save is one text in two parts: the campaign, and the chronicle save of today — the chronicle, its region and its deck id — or none while no chronicle is in progress. The reader answers the campaign or none, the chronicle save or none, and the reasons for everything it dropped; the writer reads back what it wrote, as today, so a campaign the reading would refuse is refused at the write. A text that is not JSON or not an object drops both parts.
- The campaign part's fates. Refused whole, so a new campaign is opened: a field that is not its shape — an integer, a list, an object where one is due — an instance number the next number does not exceed, an instance number held twice, a city section whose sight or idle is not an integer. Dropped one by one, each with its reason, the rest standing: a technology the catalogue does not bring; an instance whose card the catalogue does not hold, and with it every number the deck names it by; a deck number naming no instance, or naming one a second time; a card in a section its kind no longer fits, by the checks `catalogued` holds a catalogue deck to — a settle card only in the settle section, none among the cards, no hazard, no camp reward — dropped from the deck and kept in the collection. A city section whose building or card the catalogue does not hold, or whose card is not a settle card, becomes the catalogue's first deck's city section, its card a new instance.
- The chronicle part's fate is today's: whole, or dropped with its reason.
- The entry, `src/ui/save-entry.ts`: at the boot it reads the whole save, opens a new campaign where none could be read, and answers the chronicle opening as today with the campaign's technologies for the launch; where the chronicle part alone was dropped the entry is rewritten holding the campaign alone, and where nothing could be read the entry is removed and the new campaign lives in memory until the first keep. The boot writes no new campaign into storage on its own. After every command the chronicle is kept beside the campaign held.
- The e2e helper plants the chronicle save beside a new campaign on the first deck.

Out:

- The ending paying once and the save keeping it, the chronicle launched on the campaign's deck and its instances, the ending screen reading what was paid: the pay line.
- The campaign screen, Continue, the tree, the collection screen and every press on the deck.
- The ending's own scaled influence: Stone Age content.
- A migration of today's saves: pre-demo, dropped whole.

Corner cases decided here:

- A technology unlocking a card the collection already holds adds instances; nothing merges.
- A campaign whose deck names no instance at all is a campaign, not a defect: the deck has no floor.
- The reasons for the drops are the reader's answer, in the one rejection vocabulary, and the entry logs them one by one; the rules module logs nothing.

**Traps:**

- `Deck` in `src/rules/catalogue.ts` is a deck of ids, the catalogue's seed; the campaign's deck names instances and is another type. Its name says which deck it is: the ratchet on two things sharing a generic name is one instance from a dogma line.
- `ChronicleSave` and `readSave`'s field helpers in `src/rules/save.ts` stay as they are; the campaign part is read with the same `Slot` helpers, and the outer text wraps both parts. The chronicle part is written and read exactly as today, so the specs' chronicles need no change.
- `e2e/chronicle-screen.ts`'s `plant` writes the whole text through the game's writer; `e2e/resume.spec.ts`'s second test plants a text that is not JSON and asserts the entry is null after the boot and that the console warned "the save is not JSON": the entry is removed when nothing of it reads, and the new campaign is not written until the first keep.
- `src/ui/chronicle-scene.ts` launches in `begin` and on the restart and keeps through `keepChronicle` with `Choices`; the campaign and its technologies reach both, through `Opening` or the entry's own handle, the implementer's choice, and `src/ui/` never mutates it: the module answers a new value the entry keeps.
- The previous line's launch takes the technologies unlocked; every caller in `src/rules/fixtures.ts`, `src/content/catalogue.test.ts` and `e2e/chronicle-screen.ts` passes none and stays so; only the scene passes the campaign's.
- The chronicle a test pays in must have ended and carry a reached achievement: the fixture's first age declares one whose count is the food stock against a fixture need, unlocking a fixture card with two copies, and its victory achievement paying fixture influence, from the previous line; an ending is reached through the rules' own transforms — a fall or a victory — never by writing the field.
- The victory achievement's `reached` follows the `ended` in the stage tree; the chronicle the last stage leaves carries it, and that is the chronicle paid in.
- `merged` and `catalogued` refuse content; the campaign reader refuses shape and drops content, and both speak through `refuse`'s vocabulary, the version first.
- The unlocked cards' copies come from the technology's declaration; a copy count below one was refused by the previous line's coherence, so the payer trusts it.
- A campaign of the fixture opens on `DECK_ID`; the game's opens on the catalogue's first deck as `firstsOf` lists it in `src/ui/launch-page.ts`.

**Plan:**

1. A new rules module beside `src/rules/save.ts`: the campaign's shape, a new campaign on a catalogue deck, an ended chronicle paid in; its test on the fixture: the new campaign's instances and deck, the payment's unlocks, instances, influence and answer, the two refusals, a second payment refused. Inert.
2. `src/rules/save.ts`: the outer save in two parts, the campaign part read with its fates, the chronicle part as today, the reasons answered; `src/rules/save.test.ts`: the round trip of both parts, the chronicle part dropped with the campaign standing, each campaign drop and each campaign refusal by its reason, the city section fallback, the not-JSON text dropping both. `src/content/catalogue.test.ts`: a new campaign opens on each deck of the catalogue.
3. `src/ui/save-entry.ts` and `src/ui/chronicle-scene.ts`: the campaign read or opened at the boot, its technologies handed to the launch, the chronicle kept beside it, the entry rewritten or removed as the fates say; `e2e/chronicle-screen.ts`'s `plant` beside a new campaign.
4. `docs/META.md` takes the sentences above; the board line is deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/resume.spec.ts` — the save's own reading, a chronicle resumed from beside a campaign, an unreadable text dropped with the entry removed and the console saying why. CI proves on the push: every spec, since every one plants a save of the new outer shape; `e2e/boot.spec.ts` and `e2e/landing.spec.ts` for the bare boot in particular.
