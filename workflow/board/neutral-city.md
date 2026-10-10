# The neutral's city

**Line:** The neutral's city — every Stone Age region deals the neutral's city first, within its band of the centre, the camps and the sites keeping their distance from it; the chronicle opens with it standing, one population on its tile, yielding into stocks of its own at income and growing at the growth threshold, its tiles no claim of the player's; the map draws it in the neutral's colour and the panel names it. Done when: the generator test holds the placing and a region naming no band deals none; the rules tests hold the opening, the income, the growth and the refused claim on the fixture; the catalogue's coherence test reads the neutral's building through the screen's lookups; the proof spec sees it drawn and named; the four pages say so.

**Spec:** `docs/CHRONICLE.md` _The neutral_ ✅, `docs/MAP.md` _The tile_, _The generator_ and _The region_ ✅, `docs/ages/STONE.md` _The land_ and _The neutral_ 🔧, `docs/CHRONICLE-SCREEN.md` _The pointer and the tile's marks_ ✅. The sentences, written out:

- `docs/CHRONICLE.md` _The neutral_, the second sentence of the first paragraph becomes: "The generator places its city first, within a band of the centre the region names, and the camps and the sites keep from it as they keep from their own kind; the chronicle opens with it standing, its tile held with one population on it." The rest of the section stands as written.
- `docs/MAP.md` _The tile_: "**The city's tile is terraformed like any other, into a terrain its building stands on alone**" becomes "**The city's tile and the neutral's are terraformed like any other, each into a terrain its building stands on alone**", and the sentence goes on as written; the parenthesis "a worker's is refused, an event's passes the tile over" stands, the neutral's tile refusing every terraform of the player's as _The tile_'s building paragraph already says.
- `docs/MAP.md` _The generator_, sixth layer: the clause "the neutral's city is placed after them, kept from the centre and from everything placed before it as a camp is 🔧" becomes "Where the region deals the neutral's city it is placed first, by the same draw, among the tiles its building stands on wherever the age's camps are reached, within a band of the centre the region names, least and most; the camps and the sites placed after it keep from it as they keep from their own kind." The sentence "A map dealt fewer camps, sites or cities than the composition asks is thrown away…" stands.
- `docs/MAP.md` _The region_: "whether the neutral's city stands on it" becomes "whether the neutral's city stands on it and the band of the centre it keeps within".
- `docs/ages/STONE.md` _The land_, the archipelago paragraph's last sentence becomes: "The centre part reaches as far, and as many camps stand on it as on the temperate region, kept as far from the centre and from one another." The temperate paragraph stands: five camps are still more than the Nomadic region's.
- `docs/ages/STONE.md` _The neutral_ 🔧 becomes: "The neutral is another band that settled: a city in every one of the age's regions, standing a little further out than the centre part and no further than the camps may, with the camps and the sites kept from it. Its building is a **village** of its own, standing where the village stands and giving what the village gives, military and culture, so its border and its warriors have their sources. Its units are the age's own, and its script keeps it growing and sends its warriors at the camps."
- `docs/CHRONICLE-SCREEN.md` _The pointer and the tile's marks_: after "…are in the civilization's colour." add "The neutral's city's mark is in the neutral's colour."
- Player-facing text: the neutral's building's name entry reads `Village`. No other entry: a terraform of the player's on its tile is refused with the standing `refusal.other-faction`, a building card with the standing `refusal.slot-filled`, and no lore, since nothing captures it in this line.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/MAP.md`, `docs/ages/STONE.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- The content's shape, sized by the user: the age names its neutral's building as it names its camp's, one entry; a region names the band of the centre the neutral keeps within, least and most, or names none and deals no neutral. The Nomadic regions name none.
- The Stone Age's content: the neutral's building, a kind of its own on the village's ground (plain, forest, hills, desert) with the village's yields, military and culture, at the village's numbers; the temperate region's band 7–9 and the archipelago's 5–8; **five camps on both regions** (six today). A content change and its measurement are one commit: the regions' numbers land with the generator step, the numbers measured on 200 seeds per region — temperate never short, the archipelago short of camps on 29 of 200 deals against 36 today.
- The catalogue refuses, before any chronicle is dealt: a neutral building the catalogue does not hold or that names a feature or the river (as the camp's and a site's are refused); a neutral building that is also the age's camp's or a site's; a band whose least is within the centre part's reach plus the first steps (the camp's rule) or whose most is below its least; a region naming a band in an age naming no neutral.
- The generator: where the region names a band, the neutral is placed first by the draw camps and sites are placed by, among the tiles its building stands on, reached as the age's camps are (across the water in the Stone Age), within the band; the camps then keep their apart-distance from it and from one another, the sites theirs from it and from one another; a deal short of the neutral is thrown away and dealt again as one short of a camp is.
- The chronicle: the neutral's rows — its city tile, the tiles it holds, its population, its assigned tiles, its stocks — opened at the launch from the map: its tile held, one population assigned to it, every stock at nought; absent on a chronicle whose region deals none. The save writes and reads them, refusing a tile the map does not hold, a population below nought, an assigned tile it does not hold, as it refuses the player's.
- Income and growth: at the income phase the neutral's assigned tiles no enemy occupies yield into its stocks, after the player's tiles, in the same `income` group, one `stock` change each carrying the tile; at the growth phase its food at its growth threshold — twice its population and its units counted together, none yet — is spent and it grows one population, idle, after the player's growth, in the same `grow` group. Whose stock or population moved is read off the chronicles before and after; the changes carry no owner. Nothing shows on screen: the bar reads the player's stocks.
- A claim refuses every tile the neutral holds. A pillage spares its building, as it spares the city's, a camp's and a site's. A terraform of the player's refuses its tile as it refuses a camp's; an event's terraform into a terrain its building does not stand on passes the tile over, as the city's is. An enemy standing on its tile occupies it: the tile yields nothing that income.
- The screen: a colour role `neutral` for a building's mark, the `LOOK` entry `neutral` at the ocean's value `0x2b4f7a` under its own name; the mark is the wall the city and the camp are drawn as; the panel heads its tile's building card `Village`, its row reading what it gives.
- The fixture: the fixture's ages name a neutral building of the fixture's own on the fixture's ground, one fixture region names a band and the others none, so a test launches a chronicle with the neutral and one without.

Out, decided here:

- Everything the five lines behind this one hold: its claims, its units, its stance, the camps it takes, its fall. A unit of the player's steps onto its tile when nothing holds it, and standing there through the enemy phase captures nothing. What an enemy prepares on its tile is an idea, jotted.
- An event's answer reads the player's city alone — Wildfire kills none of the neutral's population — unless the event's content names the neutral; none does.
- A camp's roll or a raid enters an enemy on the neutral's tile when it is the nearest free one, as on any tile the player holds: no exception is written.
- The player sees nothing of the neutral's stocks or population: no reading, no panel row, no ring around its tile — a border ring is the claims line's.
- Save compatibility: a Stone Age save from before this line does not load; nothing is done about it.
- The simulator and the later rungs read the neutral's rows as they find them.

Reconcile, chosen:

- The player's growth and income and the neutral's: one rule each, "whose city" the parameter; the neutral goes through `grow`, `income` and the yield as they stand, never a copy.
- A camp's placing and the neutral's: the one draw, the neutral's keeps gaining a most; the camps' and the sites' keeps gaining what was placed before them to keep from.
- A camp's colour and name and the neutral's: the standing by-id tables, one role and one entry added.
- A claim's and a pillage's exclusions: the standing lists, the neutral's building joining the pillage's and the neutral's held tiles the claim's.
- The terraform's refusal: the standing `other-faction` block.

**Traps:**

- The neutral's draw precedes the camps', so **every Stone Age seed deals a different map** from this line on; the Nomadic maps do not change, no draw being made. Every spec launching on the Stone Age — the ones building their campaign through `campaignWith` in `e2e/chronicle-screen.ts`, and `e2e/archipelago.spec.ts` — searched its seed on the old maps: each is run as a diagnosis after the generator lands, and a search that finds no seed is a finding, never a loosened assertion.
- `inSight` (`src/rules/sight.ts`) reads `chronicle.held` as seen: the neutral's held tiles must never reach it, or the player sees the neutral's ground. `falls` (`src/rules/stages.ts`) reads `chronicle.population`: the player's alone. `growthThreshold` counts the player's units for the player's city; the neutral's counts its own units, none in this line, never the player's.
- `src/rules/map-kinds.ts` holds `Region` and cannot import `src/rules/catalogue.ts` (an import cycle the lint refuses, type-only included): the band's shape is written where `Region` is.
- `src/content/catalogue.test.ts` reads every building id of the real catalogue through the name, mark and colour lookups: the new building fails it until all three entries exist, so the screen's entries land with the content.
- `ageHeld` keeps `sitedBy`, the map that refuses a site's building equal to the camp's: the neutral's building joins it.
- `generateMap` counts `wanted` as camps plus sites: the neutral is counted where the region deals one, or a deal short of it is kept.
- `src/rules/save.test.ts` holds a fixture test refusing a unit of faction `neutral`: it stays; no unit faction is added in this line (no seam for zero instances), and no change name gains an owner field.
- A `Chronicle` row for the neutral is read by the fog's snapshot like any tile: its building is kept in fog once seen, drawn as a camp's is; nothing to add.
- The `src/ui/` change is a colour entry, a mark and a text entry; no Phaser mechanism beyond what `docs/PHASER.md` holds is touched, and no spec waits on anything new.
- The hook flags a comment block longer than three lines in `src/` and `e2e/`; comments are for traps only.

**Plan:**

1. The content's shape and its validation: `Age` names its neutral's building, `Region` its band; `catalogued` refuses what Scope lists; the Stone slice names the building and its kind, the regions' bands and five camps; the fixture's ages and one fixture region deal a neutral; the screen's three entries for the new building (`src/ui/look.ts`, `src/ui/marks.ts`, `src/ui/text.ts`) land here so the coherence test passes. Leaves: the catalogue builds, `npm test` green, the maps unchanged.
2. The generator: the neutral placed first within its band, the camps and the sites keeping from it, the deal re-dealt when short of it; the map tests. Leaves: every Stone map holding the neutral's city, the Stone specs' seeds re-searched where a search fails.
3. The chronicle: the neutral's rows opened at the launch; the save writing and reading them; income and growth through the one rule each; the claim's, the pillage's and the terraform's reading of its tiles; the rules tests on the fixture. Leaves: the neutral's economy running, the player's untouched.
4. The pages and the spec: the four `docs/` sentences, the proof spec, the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/neutral.spec.ts` — a Stone Age chronicle on its first seed, opened on the save it wrote: the neutral's building mark stands once the uncharted veil is off and the map's buildings count the camps, the sites, the neutral and the city; its tile inspected reads `Village` as the building card's heading. CI's on the push, listed for the hand-back, never run: `camps.spec.ts`, `sites.spec.ts`, `archipelago.spec.ts`, `embark.spec.ts`, `fishery.spec.ts`, `farm.spec.ts`, `irrigation.spec.ts`, `trapping.spec.ts`, `tannery.spec.ts`, `heal.spec.ts`, `calendar.spec.ts`, `refuse.spec.ts`, `inspect.spec.ts`, `map.spec.ts`, `yields.spec.ts`, `resume.spec.ts`, `continue.spec.ts`, `manage-save.spec.ts`.
