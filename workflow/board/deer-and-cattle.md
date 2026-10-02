# Deer and cattle

**Line:** **Deer and cattle** — the catalogue's wildlife is deer, the forest's feature, and cattle lie on plain, each giving food; both ages' temperate regions deal fertile, deer and cattle each over one tile in twenty of its terrain; `docs/ages/NOMADIC.md` says so; `npm test` passes with the catalogue's coherence tests, and `e2e/inspect.spec.ts` shows a feature the generator dealt. Doc-impact: `docs/ages/NOMADIC.md`.

**Spec:** `docs/MAP.md` _The tile_ (a feature, at most one, lying on its terrain, gone when the tile is terraformed) and _The generator_ (the feature deal, each feature over a share of the tiles of its terrain, in the region's order) stand as the spec and do not change: a second feature on plain is dealt as fertile is. `docs/ages/NOMADIC.md` takes the sentences below, and no other page names the feature.

- `docs/ages/NOMADIC.md` _The land_, the table: the plain row reads `| plain | food | **fertile** or **cattle** | food |` and the forest row `| forest | production | **deer** | food |`; the other rows stay.
- `docs/ages/NOMADIC.md` _The land_, in place of "Features are dealt rarely enough to be sought after; their shares are tuning.": "Features are dealt rarely enough to be sought after, fertile, deer and cattle rarer than flint, so going for more of any of them is a journey; their shares are tuning."
- `docs/ages/NOMADIC.md` _The events_, Wildfire: "so the wildlife and the trapping go with the forest" becomes "so the deer and the trapping go with the forest".
- `docs/ages/NOMADIC.md` _The events_, the herd: "_Follow it_: wildlife is dealt onto a forest tile near the city that carries no feature" becomes "_Follow it_: deer are dealt onto a forest tile near the city that carries no feature".

The player-facing entries, each ending in no period:

- The forest feature's name: "Deer", in place of "Wildlife". The plain feature's name: "Cattle".
- The herd's answer: "One [terrain:forest] gains [feature:deer]", in place of the same sentence naming wildlife.
- Nothing else is new: a feature's row on the terrain card and its mark read the name and the yield as every feature's do.

**Doc-impact:** `docs/ages/NOMADIC.md`. `docs/ages/STONE.md` stands: its region deals the Nomadic features in the same shares, as the page says. `docs/MAP.md` stands. `CHANGELOG.md` keeps "wildlife": it is history.

**Scope:** In: the forest feature renamed deer, id, name, mark and colour alike; cattle on plain, a feature giving food, with its name, the deer's mark and a colour of its own; both ages' temperate feature shares; the herd's answer naming deer; the page.

Out: Hunt and Trapping, each a line of its own; any card; any rules change; a feature lying on several terrains, dropped at this intake for the two features: a card then names its feature and nothing else, and the map shows which family a tile is for.

The numbers, provisional and to be played, the same in both ages' temperate regions, listed in this order so cattle are dealt among the plain fertile left bare: fertile over 0.05 of plain, deer over 0.05 of forest, cattle over 0.05 of plain, flint over 0.1 of hills, the oasis over 0.1 of desert. The user chose the scarcest of six deals served, in words "forest wildlife halved, half of plain's fertile becoming wildlife": going for more is a journey, and no share is raised to put a goal's ground near the centre.

What the deal gives, run at intake on seeds 1 to 200 of the Stone Age's temperate region, against today's: deer and cattle together on the whole map 12.3 on average against 10.7 wildlife; within 6 tiles of the disc's middle a median 4, 1 at the tenth map and 6 at the ninetieth, half of it cattle, against 3, 1 and 5; fewer than 3 within 6 tiles on 60 maps against 77; fertile on the whole map 7.3 against 14.6, within 4 tiles a median 1 against 2; food on the 19 middle tiles 14.4 against 14.9. The Nomadic region reads within one tile of that. The pitch, run on the same deal under the one-feature name: https://claude.ai/artifact/W5ybSMoMToRPMADL5Tvyrc.

No mechanism is new, so the line adds no rules test: a feature on plain is dealt, yields, shows and is burned as fertile is. The content gets the coherence checks alone.

Corners decided at intake:

- A cattle plain gives what a fertile plain gives, and a river adds to it as to any plain; a tile carries one feature, so no plain carries both.
- A fire over a deer forest leaves a bare plain, as a fire over a wildlife forest did.
- The herd deals deer onto a forest near the city carrying no feature and is not dealt without one; it never deals cattle.
- A farm is built on a cattle plain as on a fertile one, the feature staying, and Agriculture's goal counts it as plain.
- Trapping still goes on forest, with or without deer, until its own line; Gather on cattle gains the tile's yield as on any tile.
- The forest feature's id changes with its name. A chronicle saved before the change names wildlife on its tiles, which the catalogue no longer holds; the save reader refuses a feature the catalogue does not hold, and what it then does with that chronicle is its standing rule, nothing being added for it.

What the reconcile chose:

- Cattle go through what fertile goes through, as it stands: the plain, the yield, the deal, the mark row, the terrain card. The difference is meant and lies ahead: which family's cards work the tile.
- Cattle's mark is the deer's triangle, the user's call, in a colour of its own: a new entry of the look under its own name, white, the value the lit and the selected carry.
- The deal goes through the region's share list as it stands, one entry more.

**Traps:**

- The id `wildlife` stands in `src/content/nomadic.ts` three times, the feature, the herd's constant and the region's shares, in `src/content/stone.ts`'s shares, and in `src/ui/text.ts`, `src/ui/look.ts` and `src/ui/marks.ts` under the feature's key; `e2e/` names it nowhere, and the fixture has no feature by that name.
- The coherence tests in `src/content/catalogue.test.ts` read every feature by name, mark and colour, and refuse a feature share naming a feature the catalogue does not hold.
- Every seed of both ages deals another map: the shares change and a deal step is added, and the rivers and the camps are dealt after the features from the generator's state. Every spec that searches seeds through `firstSeed` in `e2e/chronicle-screen.ts` lands on another seed; a search that finds no seed under a thousand is a finding to report, never a search to loosen.
- A share is rounded on the tiles still bare: a map holding fewer than ten bare tiles of a terrain is dealt none of a feature at 0.05 of it.
- `docs/PHASER.md` _Rendering under WebGL_: a stroked Polygon skips a point whose origin-shifted position lands on the raw point before it. The deer's triangle draws today, and cattle take the same corners.
- A feature's colour is an entry of `LOOK.feature` in `src/ui/look.ts` under the feature's id; the look's values are read by the coherence test through the feature's id.
- The catalogue's version has stood at `'1'` through every content line and this one does not move it.

**Plan:** One commit, nothing inert before it, since no mechanism is new. The work lands in this order:

1. `src/content/nomadic.ts` and `src/content/stone.ts`: wildlife is deer, cattle stand in the features table on plain giving food, the herd deals deer, and both regions list the shares in the order above.
2. `src/ui/text.ts`, `src/ui/look.ts`, `src/ui/marks.ts`: the deer's entries under its new id, cattle's name, colour and mark, the herd's answer, so the coherence tests pass.
3. `docs/ages/NOMADIC.md` takes its sentences, and the board line and this file are deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/inspect.spec.ts`. The visual check: on the chronicle screen, cattle's white triangle on a plain tile, outlined whole and told apart from a fertile mark and from the deer's brown triangle on forest, and the terrain card of each naming Deer or Cattle with its row. CI proves on the push every other spec, each one opening on a map dealt anew: first among them `e2e/landing.spec.ts`, which follows the herd, `e2e/rivers.spec.ts`, `e2e/map.spec.ts`, `e2e/yields.spec.ts`, `e2e/camps.spec.ts`, `e2e/worker-instants.spec.ts` and `e2e/farm.spec.ts`.
