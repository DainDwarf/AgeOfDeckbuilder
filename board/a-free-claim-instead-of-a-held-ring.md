# A free claim instead of a held ring

**Line:** the city's content names no ring and the settle holds the city's tile alone, one inhabitant on it, from no map argument and with no off-map corner case; the stand-in's settle sections hold six `PH_Claim` besides the settle, each claiming a tile the city may claim and bringing an inhabitant to work it; the e2e openers claim the six tiles around the city unless a spec asks for the bare city, and the culture threshold counts every tile held beyond the city's own.

This line ships after **Turn 0, the settle**, and is written against the repository as that dossier leaves it: the settle kind, the settle section, the settle helper and `e2e/chronicle-screen.ts`'s settling `open()` and `launch()` are all its. Where a name below is turn 0's, the ship reads the code turn 0 landed and holds to what its dossier fixed.

**Spec:** `docs/CHRONICLE.md` → _Cards_ (the **Settle** bullet), _Population_, _The map_ (the camps paragraph, the claim paragraph); `docs/GLOSSARY.md` row **claim**.

The rules, as the spec reads them:

- **The settle holds the city's tile alone.** The city's content names its terrain, its building, its sight and how many idle inhabitants the chronicle opens with, and nothing about a ring. The settle puts the city on its tile, one inhabitant on it, and the idle count besides: `held` is that tile, `assigned` is that tile, `population` is one plus the idle count. It reads no map and filters nothing: a ring that ran off the disc was the corner case, and there is no ring.
- **The culture threshold counts every tile held beyond the city's own.** The design's sentence — the culture threshold rises with the tiles owned — is the rule as it stands; the exemption for the tiles the settle held goes with the ring. One culture, and one more for every three tiles held beyond the city's own, whoever claimed them and however: after six free claims the first paid claim costs three.
- **A free claim is a card.** `PH_Claim`, an instant of the stand-in's settle section, aimed at a tile: it admits a tile the city may claim — the one list city mode marks — and refuses every other with the one block **claim**; its effect brings one inhabitant to the city and claims the tile with no culture asked, so the claimed tile takes an idle inhabitant at once, as any claim does. It needs no rule of its own: a card played on turn 0 leaves the chronicle, and before the settle nothing is held, so the card admits nothing and lights nothing.
- **The stand-in's decks.** Both decks' settle sections hold the settle card and six `PH_Claim`, in that order. The fixture catalogue's settle section gains one `PH_Claim`, the mechanism's one test card.

Sentences to change in `docs/CHRONICLE.md`, each quoted as turn 0 leaves it:

- _Cards_, the **Settle** bullet: replace "it puts the city there, its building in the tile's slot, and the settle holds and staffs what the city's content names." with "it puts the city there, its building in the tile's slot, held alone with one inhabitant on it and the city's idle count besides."
- _Population_: replace "The settle puts an inhabitant on each tile it holds, the city's own first, and the rest the chronicle opens with are idle; how many idle is content. 🔧 Two." with "The settle puts one inhabitant on the city's tile, and the rest the chronicle opens with are idle; how many idle is content. 🔧 Two."
- _The map_, the camps paragraph: replace "the catalogue refuses a region whose camps keep no further from the centre than the centre part reaches plus what the city sees or holds beyond its tile." with "the catalogue refuses a region whose camps keep no further from the centre than the centre part reaches plus what the city sees."
- _The map_, the claim paragraph: replace "The city stands on the tile it settled and holds, with it, every tile within so many of it as its content names — none for a city holding its tile alone; 🔧 the stand-in's holds the six around it. Every tile more is claimed." with "The city stands on the tile it settled and holds that tile alone; every tile more is claimed." After "A claimed tile takes an idle inhabitant at once when the city has one." add: "🔧 Until the deck is data the stand-in's settle section holds six **free claims** besides its settle: each is played on turn 0 at a tile the city may claim, asks no culture, and brings one inhabitant, who works the tile." The sentence "the **culture threshold**, what a claim costs, rises with the tiles owned" stays as it is: the code comes to it.

Row to change in `docs/GLOSSARY.md`:

- **claim** → "To take a charted tile adjacent to one the city holds into the border: by hand it costs culture, and a card may claim without." Forbidden words unchanged.

Player-facing text, every entry written out:

- `card.PH_Claim`: "PH_Claim"
- `rules.PH_Claim`: "Claim a tile and gain an inhabitant."
- `refusal.claim`: "The city cannot claim that tile." — the block's entry, read by `blocking`. The unpaid claim's note "Not enough culture.", which `refusedAct` reads under that key today, keeps its text under a key of the implementer's (`refusal.unpaid`, say).

**Doc-impact:** `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: the city's content without its ring field, its validator line and its test row; the settle holding the tile alone, from no map, with no filter; the culture threshold over the tiles held beyond the city's own; the claim block, the free-claim helpers and `PH_Claim` in both catalogues, in every stand-in settle section and once in the fixture's; the text entries; the openers' six claims and the bare-city option; the rules tests, the spec edits and the settle spec's new test; the docs edits above; the identifiers that carry the forbidden word.
- Out: any change to the settle kind, the settle card, turn 0's play or its end; the claim by hand, its cost by hand and city mode; a free claim in an age's real content; the numbers `CLAIM_FIRST` and `CLAIMS_PER_RISE`.
- Corner cases decided here: a `PH_Claim` played before the settle admits no tile — nothing is held — and lights nothing, and no rule says so; one left in hand at turn 0's end is gone with the others, as turn 0 rules; a claim chained outward toward a camp is the player's to make; a tile of any terrain is claimed, water included, as the ring held water before; the test that the city holds seven tiles is deleted, that behaviour no longer promised; a chronicle of the fixture's whose held ring is authored as state pays the threshold on those tiles like any other, so the threshold tests run on a city holding its tile alone.

**Traps:**

- `Chronicle.city` is optional after turn 0. `claimable` reads `held` and never `city`, so the card's aim needs no unsettled guard.
- The card's tile refusal reads `claimable(catalogue, chronicle)`, the one list city mode marks, so the tiles the card lights are exactly the claim marks; a second list would drift.
- `claim` in `src/rules/city.ts` pays the threshold and takes the tile in one function. The free claim takes the tile without paying: the taking — `held` joined, an idle inhabitant standing on it when there is one — becomes the helper both compose, and the paid claim keeps its refusal through `cityCommand`. The inhabitant the card brings is a population helper of the rules', never a field written in content: an effect changes the chronicle only through named helpers.
- `cultureThreshold` calls `founding` today to know what to exempt; it reads `held.length - 1`. `src/rules/city.test.ts` proves the threshold on `founded(3, …)`, a fixture holding the ring, so its first claim costs three under the new rule: those tests move onto a city holding its tile alone, `cityOf(['urban'], …)` with its tiles and population authored, and one test proves that six free claims make the next claim cost three.
- `src/rules/city.test.ts` builds an `ALONE` catalogue with `holds: 0`, and `src/rules/sight.test.ts` a `narrow` one with `holds: 0`; both go with the field. What `ALONE` proved — the tile alone, one on it, the idle besides — is now every settle, proven on `CATALOGUE` through the fixture helper turn 0 added that settles and ends turn 0 through `apply`.
- `founded(radius, carrying)` in `src/rules/fixtures.ts` and `founded(...)` in `src/rules/sight.test.ts` call `founding` for the ring; both author the ring as state instead — the city's tile and its six neighbours held, one inhabitant on each and two idle. Authoring state is the fixture's right; mirroring a rule is not, and there is no rule for a ring any more.
- `founding`, `founded` and `FOUNDING_CARDS` carry a word the **settle** row forbids. This line touches all three: `founding` goes as the settle helper holds the tile alone itself, the two others are renamed, the names the implementer's, without _found_ in them.
- `refusedAct` in `src/ui/refusal-note.ts` reads `refusal.claim` for the unpaid note, and `blocking` reads `refusal.<block>` for every block: the block `claim` takes the key, the note moves.
- `src/rules/state.ts` `TileBlock` gains `claim`; `Block` carries it through, and the switches that read the closed set take the member.
- The catalogue's camp rule stays valid on both catalogues with `centre: 3`, `sight: 2` and `campFromCentre: 6` as turn 0 set them: three plus two is under six.
- `src/content/stand-in.test.ts` asks every card its refusal and its admitted tiles on a launched chronicle, so `PH_Claim` is covered by the loop; turn 0's test that each deck settles and reaches turn 1 stays.
- `open()` plays the six claims by the two clicks — the card selected in the hand, then the tile pressed — never the drag: after the settle the hand holds the claims at `hand-0` onward, and each play-out is waited through `playedOut`. `launch()` mirrors it through `apply`, `{ type: 'play', index: 0, aim: 'tile', tile }` six times over `neighbours(CENTRE)` in that order, so the screen and the pure search stay one chronicle. `budget()` counts the settle's turn as one more already; the ship measures whether that covers six plays and, where it does not, adds the opening's own constant.
- `e2e/city-mode.spec.ts`: `FOUNDED`, `HELD`, `WORKED` and `TOUCHING` hold as today under the ring; the paid-claim test alone opens on the bare city, where the threshold reads one, and its tiles are the city's neighbours, all charted by the centre part. `e2e/settle.spec.ts` opens bare throughout.

**Plan:**

1. `src/rules/catalogue.ts`: `city` loses `holds`; the validator's line for it goes. `src/rules/catalogue.test.ts`: its row goes.
2. `src/rules/state.ts`: `TileBlock` gains `claim`.
3. `src/rules/city.ts`: `founding` goes; the settle helper holds the tile alone as under _The settle holds the city's tile alone_; `cultureThreshold` reads the tiles held beyond the city's own; the taking split out of `claim`; a helper answering `claim` for a tile the city may not claim; a helper bringing one inhabitant.
4. `src/content/stand-in.ts` and `src/rules/fixtures.ts`: `PH_Claim` composed of the three helpers, in the settle sections as under _The stand-in's decks_; `holds` gone from both city entries; the identifiers renamed.
5. `src/ui/text.ts`: the entries; `src/ui/refusal-note.ts`: the unpaid note's key.
6. Tests. `src/rules/city.test.ts`: the settle holds the tile alone, one on it, the idle besides; the ring test deleted; the threshold tests on a city holding its tile alone; a free claim holds the tile, brings one inhabitant and staffs the tile, asks no culture, and the next claim costs one more for every three so held; a free claim aimed at a tile the city may not claim — held, not touching the border, a camp's — is refused with `claim`. `src/rules/sight.test.ts`: the `narrow` catalogue without `holds`, the ring authored.
7. `e2e/chronicle-screen.ts`: `open` and `launch` claim the ring unless asked for the bare city. `e2e/settle.spec.ts`: opens bare; one test more — after the settle, `PH_Claim` aimed lights the six tiles around the city and no other, a press on one holds and staffs it and raises the population by one, and the card is in neither pile. `e2e/city-mode.spec.ts`: the paid-claim test opens bare on the city's neighbours.
8. `docs/CHRONICLE.md` and `docs/GLOSSARY.md` as written under _Spec_.

**Verify:** `npm run check`, `npm test`, `npm run lint`; `npx playwright test e2e/settle.spec.ts`, then `e2e/city-mode.spec.ts`, `e2e/building.spec.ts`, `e2e/press.spec.ts`, `e2e/boot.spec.ts` — the openers changed for every spec, the report names these five as run, and the suite runs on the push.
