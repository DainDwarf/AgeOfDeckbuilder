# Wildlife on the plain

**Line:** **Wildlife on the plain** — the catalogue's wildlife lies on forest and on plain and gives food on both, and both ages' temperate regions deal fertile and wildlife each over one tile in twenty of every terrain it lies on; a terraform still takes the feature, and the herd is still followed onto forest alone; `docs/MAP.md` and `docs/ages/NOMADIC.md` say so; `npm test` passes, with the generator dealing a feature over each terrain it names, and `e2e/inspect.spec.ts` shows a feature the generator dealt. Doc-impact: `docs/MAP.md`, `docs/ages/NOMADIC.md`.

**Spec:** `docs/MAP.md` _The tile_'s layers and _The generator_'s feature deal, and `docs/ages/NOMADIC.md` _The land_ and _The events_, are the spec. The sentences this line writes:

- `docs/MAP.md`, the **Feature** layer, in place of "A feature lies on its terrain, so it is gone when its tile is terraformed.": "A feature names the terrains it lies on, one or several, and is gone when its tile is terraformed, into a terrain it names or not. A feature kept through a terraform into a terrain it names, as an improvement is, was rejected: the feature is part of what a terraform costs."
- `docs/MAP.md`, the **Improvement** layer, in place of "Each names the terrains it goes on — one or several, as a building does, where a feature names the one it lies on — and stays through a terraform into a terrain it names;": "Each names the terrains it goes on, one or several, as a building and a feature do, and unlike a feature stays through a terraform into a terrain it names;".
- `docs/MAP.md` _The generator_, in place of "Fourth, the **feature deal**: each feature names the terrain it lies on and is dealt onto a share of the tiles of that terrain, for the same reason the biomes are dealt.": "Fourth, the **feature deal**: each feature is dealt onto a share of the tiles of every terrain it lies on, the same share of each, terrain by terrain, for the same reason the biomes are dealt; a tile takes one feature at most, so a feature dealt after another is dealt among the tiles still bare."
- `docs/ages/NOMADIC.md` _The land_, the table's plain row reads `| plain | food | **fertile** or **wildlife** | food |`, the forest row stays, and in place of "Features are dealt rarely enough to be sought after; their shares are tuning." stands: "Wildlife lies on forest and on plain and gives the same on both. Features are dealt rarely enough to be sought after, fertile and wildlife rarer than flint, so going for more of either is a journey; their shares are tuning."
- `docs/ages/NOMADIC.md` _The events_, the herd's item, after "The herd needs such a forest near the city, and is not dealt without one.": "The herd is followed into the forest alone, though wildlife lies on plain too: dealt onto plain as well, the event would need nothing of the map."

No player-facing entry is new or changed: the answer's entry "One [terrain:forest] gains [feature:wildlife]" stands, and so do the feature's name, mark and colour.

**Doc-impact:** `docs/MAP.md`, `docs/ages/NOMADIC.md`. `docs/ages/STONE.md` stands: its region still deals the Nomadic features in the same shares.

**Scope:** In: a feature naming the terrains it lies on; wildlife on forest and plain; the two ages' temperate feature shares; the herd's answer naming forest; the two pages; the rules tests below.

Out: Hunt and Trapping, each a line of its own; any card, text, mark or colour; a share per terrain; any change to what a terraform does.

The numbers, provisional and to be played, the same in both ages' temperate regions: fertile over 0.05 of plain, wildlife over 0.05 of forest and 0.05 of the plain still bare; flint and the oasis stay at 0.1. The user chose the scarcest of six combinations served: going for more wildlife is a journey, and no share is raised to put it near the centre.

The generator change: the process is fixed in how many and rolled in which. Each feature of the region's shares is dealt in the order the region lists them; a feature naming several terrains is dealt terrain by terrain in the order it names them, forest before plain for wildlife; on each terrain it takes the share, rounded, of the tiles of that terrain still bare, drawn by one shuffle of its own. Dealt so, the trial run at intake on seeds 1 to 200 of the Stone Age's temperate region gave, against today's deal: wildlife on the whole map 12.3 on average against 10.7; wildlife within 6 tiles of the disc's middle a median 4, 1 at the tenth map and 6 at the ninetieth, half of it on plain, against 3, 1 and 5; fewer than 3 within 6 tiles on 60 maps against 77; fertile on the whole map 7.3 against 14.6; food on the 19 middle tiles 14.4 against 14.9. The Nomadic region reads within one tile of that. The pitch: https://claude.ai/artifact/W5ybSMoMToRPMADL5Tvyrc.

Mechanisms, each held by one test on synthetic content:

- A feature naming several terrains is dealt its share of each, and lies on no terrain it does not name.
- A terraform takes the feature of the tile, into a terrain the feature names as into any other.
- A feature an answer deals near the city lands on the terrain the answer names, and on no other terrain the feature lies on.
- The catalogue refuses a feature naming a terrain it does not hold, and one naming none.

Corners decided at intake:

- A wildlife plain gives what a fertile plain gives, and a river adds to it as to any plain.
- A fire over a wildlife forest leaves a bare plain: the feature goes with the terraform.
- The herd is followed onto a forest near the city carrying no feature, and is not dealt without one; a plain is never dealt wildlife by it. An answer naming a terrain its feature does not lie on is content wrong on every chronicle, refused where it is met.
- A farm is built on a wildlife plain as on a fertile one, the feature staying, and Agriculture's goal counts it as plain.
- Trapping still goes on forest, with or without wildlife, until its own line.
- A chronicle in progress keeps the map it was dealt; a campaign is untouched.

What the reconcile chose:

- A feature names its terrains in the form an improvement and a building name theirs. The two stay apart on a terraform, which keeps an improvement through a terrain it names and always takes a feature: the difference is meant.
- The generator's feature deal goes through as it stands, once for each terrain the feature names.
- The herd's deal goes through the deal near the city as it stands, which is handed the terrain by the event's content now that the feature no longer names one alone.

**Traps:**

- Every seed of both ages deals another map: the features move, and the rivers and the camps after them, since the generator's state threads through the feature deal. Every spec that searches seeds through `firstSeed` in `e2e/chronicle-screen.ts` lands on another seed; a search that finds no seed under a thousand is a finding to report, never a search to loosen.
- The fixture's one feature and its region's feature shares in `src/rules/fixtures.ts` deal the maps the rules tests' seeds stand on: a terrain added to that feature, or a share added to that region, deals every one of them again. The test of a feature on several terrains is built on a catalogue changed inside the test, as `src/rules/catalogue.test.ts` and `src/rules/map.test.ts` already change theirs.
- A feature's one terrain is read in three places of `src/rules/`: the catalogue's validation, the generator's feature deal in `src/rules/map.ts`, and the tiles a feature is dealt onto near the city in `src/rules/schedule.ts`; and by three tests, in `src/rules/map.test.ts`, `src/rules/city.test.ts` and `src/rules/catalogue.test.ts`.
- The terraform in `src/rules/cards.ts` already takes the feature on every terraform; it changes in nothing, and gains the one test that holds the decision.
- The herd's content in `src/content/nomadic.ts` names its feature and its reach and no terrain; the fixture's herd in `src/rules/fixtures.ts` is the same shape, and `src/rules/schedule.test.ts` plays it on a disc of plain.
- A share is rounded on the tiles still bare: a map holding fewer than ten bare tiles of a terrain is dealt none of a feature at 0.05 of it.
- The Stone slice takes its features from the Nomadic one and lists its own shares in `src/content/stone.ts`: both regions change.
- The catalogue's version has stood at `'1'` through every content line and this one does not move it; a save names no feature's terrain.

**Plan:** Two commits. The work lands in this order:

1. Inert, the mechanism: in `src/rules/`, a feature names its terrains, the catalogue's validation, the generator's deal and the deal near the city read them, with the four tests above; `src/content/` and the fixture say the same things in the new form, wildlife still on forest alone and the herd naming forest, so no seed deals another map and every test stands as it stood.
2. The content: `src/content/nomadic.ts` puts wildlife on plain and deals fertile and wildlife at their new shares, `src/content/stone.ts` its region's; `docs/MAP.md` and `docs/ages/NOMADIC.md` take their sentences; the board line and this file are deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/inspect.spec.ts`. The visual check: on the chronicle screen, a wildlife mark on a plain tile, outlined whole and told apart from the fertile mark beside it, and the terrain card of that tile giving wildlife a row of its own. CI proves on the push every other spec, each one opening on a map dealt anew: first among them `e2e/landing.spec.ts`, which follows the herd, `e2e/rivers.spec.ts`, `e2e/map.spec.ts`, `e2e/yields.spec.ts`, `e2e/camps.spec.ts`, `e2e/worker-instants.spec.ts` and `e2e/farm.spec.ts`.
