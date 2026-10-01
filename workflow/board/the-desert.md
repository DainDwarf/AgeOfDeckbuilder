# The desert

**Line:** The desert — the Stone Age's temperate region deals one desert biome among its lands, rolled rounder than the land and kept away from the seas; the desert terrain and the oasis stand in the catalogue with their names, their colours and the oasis's mark, the city and the camp standing on desert and the Shelter not; a region's cluster on the launch screen is drawn from the first age that holds a region of its name, so the screen draws what it draws today, and one test on the fixture holds that rule; one test on the fixture holds that a card gaining its worker's tile's yield gains nothing on a tile that gives nothing and still spends the action; the catalogue's coherence test passes, `docs/ages/STONE.md` says the land and `docs/META-SCREENS.md` the cluster. Doc-impact: `docs/ages/STONE.md`, `docs/META-SCREENS.md`.

**Spec:** [`docs/MAP.md`](../../docs/MAP.md) _The tile_, _The river_, _The generator_ and _The region_ are the rules and change in nothing: the desert is content on the generator as it stands, the first biome a region keeps away from a kind. The content, every number of it:

- the terrain `desert`: yields nothing, a movement cost of one move point, not water, elevation 0, and food 1 along a river;
- the feature `oasis`: lies on `desert`, yields food 1;
- the biome `desert`: origin `desert`, interior and rim both `desert` 0.9 and `hills` 0.1, rim widths `[1]`, a growth weight of 1, compactness 1;
- the Stone Age's `temperate` region: biome shares `sea` 0.2, `mountain` 0.1, `woodland` 0.1, `desert` 0.07 keeping away from `sea`, `land` 0.53, in that order; feature shares `fertile` 0.1, `wildlife` 0.1, `flint` 0.1, `oasis` 0.1, in that order; nothing else of the region moves;
- the buildings `city` and `camp` go on `plain`, `forest`, `hills` and `desert`; `shelter` stays on `plain`, `forest` and `hills`.

The look: the desert's face is `0xd6c08a`; the oasis's mark is a square of half-side 4 about its centre, the corners `[-4, -4, 4, -4, 4, 4, -4, 4]`, in `0x2f8f83`, a value of its own.

The player-facing entries, both written out: `terrain.desert` reads `Desert`, `feature.oasis` reads `Oasis`. No other entry is added: a bare desert tile reads `No yield` through the entry that stands, and a settle or a Shelter refused reads the refusals that stand.

In `docs/ages/STONE.md`, _The land_ becomes, whole:

```markdown
## The land ✅

The Stone Age's temperate region is the Nomadic one on a bigger disc, with a desert on it: the Nomadic terrains and features in the same shares, the Nomadic biomes cut as fine, more of each of them, and rivers rising in its ranges. The ground around the centre is the same biome of its own, and the centre part reaches as far, so the settle chooses among as many tiles. More camps stand on it, kept as far from the centre and from one another as the Nomadic ones, so the nearest is as near and the rest lie further out.

The desert is a biome of its own, desert nearly throughout with hills among it, rolled rounder than the land and kept away from the seas. A desert tile gives nothing, lies flat and is walked as plain is, and the river gives it food as it does plain and forest. The city and a camp stand on it. The oasis, its feature, gives food and is dealt as rarely as the others. So the desert is ground to cross, and its oases and its river banks are what is worth the walk.

| Terrain | Gives   | Feature   | Gives |
| ------- | ------- | --------- | ----- |
| desert  | nothing | **oasis** | food  |
```

In `docs/META-SCREENS.md`, _The launch screen_, second paragraph, straight after the sentence ending "each in the colour of the terrain its biome grows from, the hexagons of one biome side by side.":

> The cluster is drawn from the region of that name in the first age that holds one, in the order of history, so a region looks the same in every age.

**Doc-impact:** `docs/ages/STONE.md`, `docs/META-SCREENS.md`.

**Scope:**

- In: the desert terrain, the oasis and the desert biome brought by the Stone Age; the Stone Age's region dealing them; the city and the camp standing on desert; the names, the two colours and the mark; the launch screen's cluster read from the first age holding the region's name, with its test; the test of a yield gained on a tile that gives nothing; the two `docs/` edits.
- Out: the generator, which this line does not touch; any card, improvement, event or technology that acts on desert; a desert region, a later one, which deals its desert with no keep-away; the Nomadic Age's region, land and page; the colours of anything drawn over sand.
- The process is rolled, and the generator dealing it is unchanged. The desert spreads at the land's growth weight, rounder by its compactness, and is kept from the seas by the region's keep-away, which is a lean and not a promise. Measured at the intake over 200 seeds on these numbers, on the game's own generator: 5 to 62 desert tiles, 32 the median, 6.8% of the disc; desert lies beside water on 58 maps; the centre part holds desert on 17 maps, 2 tiles the median and 14 the most; a map holds 1 to 6 oases, 3 the median, never none; no river runs along a desert tile on 139 maps, and 21 tiles is the most. No test is written on these numbers: they are tuning.
- The desert is not kept away from the centre: the settle phase may show it, and the settle lands on it. A city settled on a bare desert tile works a tile that gives nothing, and nothing warns of it.
- A camp may be dealt on desert, and a rival band's camp may be placed on it: both read the camp's building. The Shelter is refused on desert through the refusal that stands for a wrong terrain.
- Gather on a bare desert tile spends the worker's action and gains nothing, and a population on a held desert tile works nothing; neither is refused and nothing warns of either. No content reached a tile that is walked and gives nothing before this line, so the path gets its one test on the fixture: a card that gains its worker's tile's yield, played through a worker standing on a tile of a terrain that gives nothing, spends the worker's action and leaves the stock where it stood.
- The launch screen draws what it draws today. A region's cluster — its middle hexagon and the six around it — is read from the region of that name in the first age, in the order of history, that holds one, whichever age is selected; the regions in the row, their names and what a press selects stay the selected age's. The Stone Age's `temperate` therefore draws the Nomadic one's cluster, with no sand hexagon. One test on the fixture holds the rule: two ages holding a region of one name with different shares draw the first age's cluster under either.
- Gold units on sand hold by their dark outline, about 1.3 to 1 on the fill; the user accepted it until v0.0.6. Not a defect of this line.
- The catalogue's version stays as it is: a Stone Age chronicle a save holds keeps the tiles it was dealt.
- `docs/ages/NOMADIC.md` does not change: its settle and its Shelter are told on the Nomadic land, which holds no desert. `docs/MAP.md` and `docs/GLOSSARY.md` do not change: a terrain's and a feature's name is content, not vocabulary.
- Reconcile, the ground a building stands on: the city's, the camp's and the Shelter's stay three lists, the first two gaining desert. They are not made one list: the Shelter already differs.
- Reconcile, the region's picture: the two become one, in the projected form. The standing cluster was read from the selected age's region; it is now read from the first age holding the name, through the ring rule that stands, unchanged.
- Reconcile, the yield test: it goes through the forage card `src/rules/cards.test.ts` already plays on the fixture, on a terrain of the test's own that gives nothing.
- Reconcile, the rest: the terrain, the feature and the biome go through the catalogue's tables as they are, the names, the colours and the mark through the screen's tables as they are, the keep-away through the rule that stands, its first user, and the content page takes the Nomadic page's land table for its one row.

**Traps:**

- The tables are shared by every age and an id two slices bring is refused: `city`, `camp` and `shelter` are entries the Nomadic slice brings, in `src/content/nomadic.ts`, and that is where the two lists gain `desert`, a terrain the Stone slice brings. The catalogue is validated merged, and nothing builds one from the Nomadic slice alone.
- `src/content/stone.ts` brings nothing to a table today; the terrain, the feature and the biome are its first entries. Its region is written whole there already.
- The Nomadic region's maps must come out the same, tile for tile: every e2e spec but one searches its seeds on them. They do: the Nomadic region names no desert, so a camp is drawn among the same tiles, in the same order, on the same draws. Every Stone Age map changes, and no spec or test holds one: `e2e/launch.spec.ts` reads its chronicle against the rules.
- The catalogue refuses a share that deals no biome, and a region that leaves a biome over its shares while its centre's kind is dealt to a size. At radius 12 and 30 tiles to a biome these shares deal three seas, two ranges, two woodlands, one desert and seven lands, nothing left over; the numbers above went through the catalogue's validation at the intake.
- The catalogue's coherence test reads every terrain's colour, every feature's name, mark and colour, and for every region of every age a colour for each hexagon the ring rule hands out; a missing entry fails it, and one missing on the screen throws at the first draw.
- `src/ui/launch-screen.ts` reads the catalogue through what it is handed, never an import of the content (`DOGMAS.md` _Stack_). `docs/PHASER.md` is touched by nothing here: the line adds entries to tables the screen reads and changes which region a cluster's colours are read from; no object, camera or input changes.
- The doc comment over the feature marks in `src/ui/marks.ts` lists each mark; a comment is for a trap only, and the hook flags a block over three lines.
- `docs/ages/STONE.md` carries no number, and the markdown is Prettier's: a paragraph is one line and the table is formatted by `npm run fmt`.

**Plan:**

1. `src/ui/launch-layout.ts`, `src/ui/launch-layout.test.ts`, `src/ui/launch-screen.ts`: a region's cluster is read from the first age holding a region of its name, held by one test on the fixture. Leaves the launch screen drawing exactly what it draws today, the two ages' `temperate` being alike until step 3.
2. `src/rules/cards.test.ts`: the test of a yield gained on a tile that gives nothing. Leaves the rule proven on the fixture; a failure here is a deviation to report, not a rule to change.
3. `src/content/stone.ts`, `src/content/nomadic.ts`, `src/ui/look.ts`, `src/ui/marks.ts`, `src/ui/text.ts`: the desert, the oasis, the biome, the region's shares, the two buildings' ground, and the names, colours and mark. Leaves the catalogue building, its coherence test passing, and a Stone Age chronicle dealt a desert. Steps 1 and 2 are inert and come before the content, so they can be committed ahead of it as `DOGMAS.md` _Git_ asks.
4. `docs/ages/STONE.md` and `docs/META-SCREENS.md`, as written above.
5. The board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/launch.spec.ts`: it stands the launch screen on the Stone Age's region and launches a Stone Age chronicle from it, read against the rules. CI proves on the push: `e2e/menu.spec.ts`, which presses the launch screen's region, and every other spec, none of them changed, each on the Nomadic maps it searched before.
