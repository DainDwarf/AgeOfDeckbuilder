# The bones of a great beast

**Line:** **The bones of a great beast** — the third site, lying on the city's ground in every region of both ages, each age's building its own under the one name **Beast bones**; it deals **Bone carvings** in the Nomadic Age, and in the Stone Age **Bone carvings** against **Bone tools**, each age's lore its own; with it the infopanel's building row drops "No yield" under a name that leaves it no room, as it drops the yield chips. Done when the bones stand in both ages' content on every region, the coherence test passes, `e2e/sites.spec.ts` captures a site on screen, the building card of the painted cave reads its name clear of "No yield", and the pages say so. Doc-impact: `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

**Spec:** [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) _Sites_ and _Enemies and camps_, which decide everything a site does; [`docs/MAP.md`](../../docs/MAP.md) _The generator_ and _The region_ for where it is placed; [`docs/CHRONICLE-SCREEN.md`](../../docs/CHRONICLE-SCREEN.md) _The infopanel_ for the card a tile is read by; [`docs/ages/NOMADIC.md`](../../docs/ages/NOMADIC.md) _The sites_; [`docs/ages/STONE.md`](../../docs/ages/STONE.md) _The sites_. The sentences to add, written out:

- `NOMADIC.md` _The sites_, after the cairn's sentence: "The **bones of a great beast**, **Beast bones** where the map names them, lie wherever the city stands and deal **Bone carvings**."
- `STONE.md` _The sites_, after the cairn's sentence: "The **bones of a great beast** deal **Bone carvings**, culture once and banished, more than the Nomadic card gives, and **Bone tools**, production each time it is played, cycling with the deck for the rest of the chronicle: the beast remembered against the beast used up."
- `CHRONICLE-SCREEN.md`: nothing. The page says what the infopanel reads and not how a row is laid out, and the chips' rule stands on no page either.

Every player-facing entry, written out:

- The building's name, under both ids: `Beast bones`.
- The Nomadic card, id `bone-carvings`: name `Bone carvings`, kind instant, costing nothing, banish, aimed at nothing, gaining 2 culture; its rules entry `Banish.\n2[culture]`.
- The Stone Age's first card, id `stone-bone-carvings`: name `Bone carvings`, the same card gaining 4 culture; its rules entry `Banish.\n4[culture]`. Two cards of one name, as Cave paintings and Honour the dead are.
- The Stone Age's second card, id `bone-tools`: name `Bone tools`, kind instant, costing nothing, no keyword, aimed at nothing, gaining 2 production; its rules entry `Gain 2[production]`, the shape Old stories reads.
- The lore, the Nomadic building's: `Out on the open ground lie the bones of a beast larger than anything the band has ever hunted, bleached and half sunk in the earth. The children climb the ribs, the elders say it walked here before the first people did, and the band carries the tale on with it.`
- The lore, the Stone building's: `Out on the open ground lie the bones of a beast larger than anything the band has ever hunted, bleached and half sunk in the earth. The elders say it walked here before the first people did: do you carve what it left, or make tools of it?`

**Doc-impact:** `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`. The design pages already say a site's building, its lore and what it deals are content and the age's.

**Scope:**

In: the bones as a site of both ages, each age's slice bringing a building of its own under the one name, on the ground the city's building names, written out in each slice as the cairn's is; both ages' regions listing it after the cairn, the standing distances unchanged; its three cards, their text and the two lores; its mark and its colour, the site role; the coherence test unchanged in what it asks, walking the new entries by itself. And the fold: on the infopanel's building card, the "No yield" label of a row takes the rule the row's yield chips already follow, dropping to the next line, against the right edge, when the name leaves it no room, so the painted cave's row reads clear.

Out: the Nomadic city's culture, the neutral, any number's tuning, any other change to the infopanel's layout.

Corner cases decided:

- A site's building is one per age, by decision: the ages share a site's name and nothing else, so each keys its own lore. The bones' ground is the cairn's list exactly, and each site writes its own, as the cairn and the cave do since the fold after the cairn.
- The ground measured on 100 seeds per region with the real generator, the cave and the cairn placed first and the standing distances, 7 from the centre and 4 from the other sites: no map short in any region; candidate tiles per map on the four terrains 103 on the Nomadic temperate region at the least 20, 194 on the Stone one at the least 131, 29 on the archipelago at the least 8, which deals no desert.
- The building's name is `Beast bones` and not the page's phrase, because the building card's row is 130 wide, the name starts 28 in, and "Bones of a great beast" is 103px at the row's label size, off the card's edge by 12 whatever the label does; `Beast bones` is 56px and fits the row, 3px over the label's room, which the fold answers. The page keeps the site's name and says what the map calls it.
- The fold's rule: a row's label has the room the chips have, the row's right edge less the name's end and the gap; a label short of that room goes under the name, right-aligned, and the row grows by one line as it grows for chips that drop. The painted cave is 58px for 48 of room and drops; the cairn, the camp, the city and the Stone Age's buildings with yields are untouched. The row's name never wraps: a name wider than the row is a content defect and the user's to shorten.
- Money, culture and production gained all sit in the stock whatever the deck; nothing new.
- Saves: a chronicle saved before this line holds a map of two sites and reads as it did; no care until the Bronze Age, as decided.

Provisional numbers, tuning: 2 culture, 4 culture, 2 production.

Reconcile, chosen: every gain goes through the cave's and the cairn's door as it is, an instant aimed at nothing gaining a stock, banished or cycling as its entry says; the site's declaration, the region's list and the placing are the cairn's as they are; the two buildings of one site share one mark polygon through one shared constant, as the cairn's do, and each has its entry in the colour table under the site role; the label's drop reuses the chips' reading of a row's room, one reading for both, and nothing else of the row changes.

**Traps:**

- The ids, after the standing precedent: the Nomadic building keeps the bare id, `beast-bones`, and the Stone slice brings `stone-beast-bones` in its own `brings.buildings`; an id two slices bring is refused when the catalogue is merged. The site's key in each age's `sites` table is the bare id, as `old-cairn` is in both ages.
- A building the catalogue holds must have its name in `src/ui/text.ts`, its mark in `src/ui/marks.ts`, its colour role in `src/ui/look.ts` and, as a site's, its lore in `src/ui/lore.ts`: four tables, each refusing a missing id at the first draw, and the coherence test `src/content/catalogue.test.ts` walks every site of every age through them.
- The card ids `bone-carvings`, `stone-bone-carvings` and `bone-tools` go in the slice's `brings.cards` and nowhere in a deck or a technology: the catalogue refuses a deck or a technology holding a site's reward.
- The fixture's site is `PH_Cairn` in `src/rules/fixtures.ts`, the fixture's own content under its prefix; it is not touched.
- `e2e/sites.spec.ts` takes the first site the age's sites name on seed 1's map, the cairn today; with three sites it still captures one and reads the title and the lore off the rules.
- The building card's rows are laid in `src/ui/infopanel.ts`, in the loop over a card's rows: the "No yield" branch places the label at `right` and moves on, and the chips' branch beside it reads the room off the name's end and drops when short; the fold gives the label that reading. The card's width is `CARD_WIDTH` in `src/ui/card-face.ts`, 130, and every measure inside it is a multiple of its `em`, 16.9, so nothing is placed by a literal. No test asserts a row's position: a coordinate on screen is a Phaser detail the tests never assert, and the fold is proven by the visual check on the cave's card.
- The glossary lint reads player-facing text, and lore is outside it; "beast", "bones", "carvings" and "tools" are plain words with no row.
- Two commits: the fold first, the infopanel's rule alone, its message saying the line was widened by it; then the bones, their cards, their lores and the pages.

**Plan:**

1. The infopanel's building row: the "No yield" label drops under the name when the name leaves it no room, by the chips' reading of the room. Leaves: the typecheck and the rules tests green, the cairn's card as before, the cave's card reading its name clear of the label. Commit as the fold.
2. The bones' buildings in both slices, on the city's ground; both ages' sites naming them with their rewards; both ages' regions listing the bones after the cairn; the three cards; the text entries, the two lores, the mark and the colour. Leaves: the bones on every map of both ages, the coherence test walking them.
3. The two pages as the Spec writes them, and the board line deleted. Commit.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/sites.spec.ts`; the `visual-check` skill on the building card of the painted cave and of the bones, the row's name and label at the frame's scale and after a wheel notch in. CI proves on the push: `camps`, `pillage`, `deal`, `city-mode`, `map`, `fog`, `inspect`, `settle`, `resume`, `continue`, `manage-save`.
