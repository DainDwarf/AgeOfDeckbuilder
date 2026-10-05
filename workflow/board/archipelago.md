# Archipelago

**Line:** **Archipelago** — the archipelago region stands in the Stone Age's content, unlocked by Raft: a disc of islands in a sea of shallows and open sea, the centre's island among them, its camps on the islands; a biome may grow at a compactness below zero, in arms, held by one test on the fixture; the catalogue's coherence test passes, `e2e/archipelago.spec.ts` proves the launch row and Raft's plate before and after Raft is learned and the chronicle launched on the region, and `docs/ages/STONE.md` says so. Doc-impact: `docs/ages/STONE.md`, `docs/MAP.md`.

**Spec:**

- `docs/MAP.md` → _The generator_, the first paragraph. "so at zero any open tile is drawn alike and the higher it is the rounder the biome grows." becomes "so at zero any open tile is drawn alike, the higher it is the rounder the biome grows, and below zero the tiles the biome holds fewest of around are the likelier, so it grows in arms."
- `docs/ages/STONE.md` → _The land_, a paragraph after the desert's table: "The archipelago is the age's second region, the one Raft unlocks: a disc as big as the temperate one, of islands in a sea. The ground around the centre is the temperate region's own, the same biome dealt to the same size, an island here. The other islands are a biome of their own, the land's terrains dealt to a size and rolled rounder than the centre's, and two dealt side by side are one island. Between them lie the shallows, coast throughout and grown in arms, and the open sea, ocean throughout behind a coast rim as wide as the temperate sea's, with no island in it. No mountain range and no desert is dealt, so no river runs there and no oasis lies there; the other features lie in the temperate shares. The centre part reaches as far, and as many camps stand on it, kept as far from the centre and from one another."
- `docs/ages/STONE.md` → _The technologies_, Raft's line. "It unlocks the card **Embark** and pays influence." becomes "It unlocks the card **Embark** and the archipelago region and pays influence."
- Player-facing entry, in `src/ui/text.ts`: `'region.archipelago': 'Archipelago'`.

**Doc-impact:** `docs/ages/STONE.md`, `docs/MAP.md`.

**Scope:**

- In: the three biomes, the region, Raft unlocking it, the region's name, the catalogue accepting a compactness below zero with its one test, the spec, the pages.
- **The composition, the user's own, dialled on the game's generator** (the numbers are the content's and stand on no page):
  - The region: radius 12, centre part 3, 25 tiles a biome, so 19 biomes; the centre's biome is the heartland as it stands; besides it, 9 islands, 6 open seas and 3 shallows, shares of 0.5, 0.33 and 0.17, none kept away from any other; the features fertile, deer and cattle at 0.05 and flint at 0.1, the oasis not named; 6 camps, no nearer the centre than 7 nor one another than 4; the rivers' numbers the temperate region's, rising in the mountain biome, of which none is dealt.
  - The island: origin plain; interior and rim plain 0.55, forest 0.25, hills 0.2, the land's own; one rim width; dealt to a size of 8; compactness 2.
  - The open sea: origin ocean; interior ocean alone; rim coast alone, its widths the sea's, 0.2, 0.6 and 0.2; growth weight 1.2, the sea's; compactness 0.
  - The shallows: origin coast; interior and rim coast alone; one rim width; growth weight 1; compactness −3.
- **The process is rolled.** Over 1000 seeds of this composition, the Stone Age's camps standing across the water: no launch throws, 178 seeds throw a deal away for its camps, three times at most; the centre's island stands alone at 12 tiles on three maps in ten and is 20 at the median and 44 on one map in ten, an island dealt beside it being one with it; 5 other islands of 3 tiles and more at the median, 3 to 7 on eight maps in ten; a camp stands on the centre's island on 28% of the maps; some land lies out of a raft's reach on 17%, and no camp is dealt there. These are tuning, to be moved at the balance pass, never asserted by a test.
- The reconcile's choices: the centre's island goes through the heartland as it is, the same 12 tiles and the same roundness; the island is a biome of its own beside the land, its size and its roundness being the point; the open sea is one beside the sea, which keeps its odd island on the temperate maps; the shallows are new. The launch row's cluster goes through its standing rule and comes out plain in the middle, three plain, two ocean and one coast around.
- A compactness below zero is the one mechanism the content needs: the catalogue refuses it today, and the generator already raises a count of one and more to whatever power it is handed. It lands as its own commit ahead of the content, with one test on the fixture.
- Corners decided here, each left as it falls:
  - No river runs on the archipelago, so the card Irrigation is placed nowhere there and Irrigation's goal is not reached there.
  - The event that places a camp beside the city is seldom dealt there, for want of room; the schedule is to be reworked.
  - An event's raid through a camp across the water enters on the city's ground nearest that camp, the Camps across the water line's rule, until the enemies have rafts.
  - The Nomadic Age holds no archipelago: selecting it from the archipelago takes its first region, by the launch screen's standing rule.
- Out: the ending's pay by region; any change to the temperate region or to the sea; a path of shallows dealt from island to island, which would be a new layer of the generator.
- Saves from before this line need no care; a campaign that learned Raft before it has reached the region at once.

**Traps:**

- The catalogue refuses a region that "leaves biomes over its shares" while its centre's biome is dealt to a size: the three shares must deal exactly the 18 biomes besides the centre's — 9, 6 and 3 — and 0.5, 0.33 and 0.17 do.
- The refusal of a compactness below zero stands in `catalogued` (`src/rules/catalogue.ts`), and its test in `src/rules/catalogue.test.ts` asserts the refusal: that promise changes by the user's decision, and the test changes with it.
- Adding biomes and a region to the catalogue moves no other region's deal: the generator draws by region, and the specs' seeds stand.
- No terrain is new, so the look holds a colour for everything dealt.
- The spec reads the region not reached by the name the unlock line gave it, `launch-region-<id>` carrying `selected` false, and plants its campaigns through the rules' own helpers, as `e2e/launch.spec.ts` does for a campaign that has learned the first age's technology. `docs/PHASER.md`: a spec rests before it presses.
- Raft's plate comes to four lines under its name, the tallest plate standing five, so no plate grows.
- `src/content/catalogue.test.ts` is the coherence test: it reads every region of every age through the screen's lookups, its name and a colour for each hexagon of its cluster, so the region's name and its biomes' origin terrains are held there.
- `DOGMAS.md` _Design page at altitude_: no number on the age page.

**Plan:**

1. `src/rules/catalogue.ts`, `src/rules/catalogue.test.ts`, `src/rules/map.test.ts`: a compactness below zero accepted — leaves a biome that grows in arms, held by one test on the fixture, its own commit.
2. `src/content/stone.ts`, `src/ui/text.ts`: the three biomes, the region, Raft unlocking it, the region's name — leaves the archipelago launched on by a campaign that has learned Raft, the coherence test passing.
3. `e2e/archipelago.spec.ts`: on a campaign that has reached the Stone Age and not learned Raft, the archipelago stands on the launch row reading ??? and a press on it leaves the selection where it was; on one that has learned Raft, a press selects it, Launch opens the chronicle the rules launch on that region, and Raft's plate reads the region among its reward — every value read from the rules and the text table.
4. The `docs/` edits above.

**Verify:** `npm run check`, `npm test`, `npm run lint`, and the proof spec `npx playwright test e2e/archipelago.spec.ts`. CI proves the whole suite on the push; the other specs that walk the launch screen and the plates are `e2e/launch.spec.ts`, `e2e/launch-warning.spec.ts`, `e2e/menu.spec.ts`, `e2e/console.spec.ts`, `e2e/continue.spec.ts`, `e2e/tree.spec.ts`, `e2e/pin.spec.ts` and `e2e/campaign.spec.ts`.
