# A raid's door across the water

**Line:** A raid's door across the water — a raid through a camp the ground does not link to the city enters on the camp's island and crosses from there; the outer-ring door is any tile of the disc's outer ring the city is reached from over ground and, where the age's enemies embark, water, a coast tile among them, a raid through a coast door entering embarked on the camp's embarked move through the one way a unit enters; a raid's enemies enter around their door on the door's own medium; a raid with no door is a runtime-error; each held by a test on the fixture. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Spec:**

- `docs/CHRONICLE.md` → _Events and the capstone_ → _Enemies and camps_, the paragraph "**An event's enemies enter together**". Three edits:
  - _"or a tile of the disc's outer ring that the raid's unit stands on and the city is reached from, over the ground and, where the age's enemies embark, the water;"_ becomes:

    > or a tile of the disc's outer ring that the raid's unit stands on, ashore or embarked, and the city is reached from, over the ground and, where the age's enemies embark, the water, a raid through a coast door entering embarked;

  - _"and each one after on the nearest free tile it stands on that the door's own ground runs to, ring by ring around the door,"_ becomes:

    > and each one after on the nearest free tile the door's own ground runs to, or, through a coast door, its own water, ring by ring around the door,

  - _"With no camp standing the outer ring is the only door, and an event's raid always enters, the city's island touching the map's edge or not."_ becomes:

    > With no camp standing the outer ring is the only door, and an event's raid always enters; a map where nothing the city is reached from touches the outer ring is a defect of the content, never a map the generator deals.

- `docs/ages/STONE.md` → _The camps 🔧_. After "Embarked, a guard raids until it stands ashore.", add:

  > A raid through the map's edge comes ashore or by sea, as the edge the city is reached from is land or coast, so on the archipelago most raids out of the edge come by raft.

- No player-facing text: an embarked enemy is already named and drawn.

**Doc-impact:** `docs/CHRONICLE.md` (the raid paragraph), `docs/ages/STONE.md` (_The camps_).

**Scope:**

- In:
  - **The island camp's raid.** A raid through a camp enters on the camp's tile where free, then on the nearest free tile of the camp's own ground, ring by ring, never on the city's tile. The city's ground is read nowhere for a camp door. An island camp's raid lands on its island and rafts over on the shipped walk.
  - **The outer-ring door.** The disc's outer ring is the tiles furthest from the centre, as today. Its door tiles are those the city is reached from — over the ground alone where the age's camp names no embarked move, over ground and water where it does — on which the camp's unit stands ashore, or, where the camp names an embarked move, embarked. The draw among them is uniform, as today, so the map's own edge decides how much of a raid comes by sea. Measured on 40 seeds per region: the archipelago's ring holds about 9 reachable land tiles and 33 reachable coast tiles, the temperate region's 50 and 6. The Nomadic Age's door is unchanged.
  - **The embarked entry.** A unit may enter the map embarked: the same way in as every other, with its move the camp's embarked move and its hull drawn. A raid through a coast door enters embarked, and so do the enemies after the first, each on the nearest free tile the door's own water runs to — the tiles embarked units enter, reached from the door embarked. Through a land door the enemies enter ashore on the door's own ground, as today. A raid never mixes media.
  - **No door.** A raid drawn with no camp standing and no ring door is a `runtime-error`, as today; the generator checks nothing. Measured: on 80 Stone maps every one had a ring door over ground and water.
  - **One entry.** A guard entering around its camp and a raid entering around its door are one entry: around a tile, on that tile's own medium, so many enemies with that script. The rival band's _Make room_ guards and the fixture's enter unchanged, their camp standing on the city's ground.
- Out:
  - Archers at the camps, the pillager, camps that prepare.
  - A raid choosing land or sea by content odds: the draw is uniform among the door tiles.
  - The outer ring read as the reach's furthest tiles: rejected at intake, a map whose reach stops short being a content defect.
- Reconcile:
  - The embarked entry goes through the one way a unit enters, the embarked flag and the move as parameters.
  - The door's reach — ashore, embarked, or both — is read off the one whole-map walk the ground reach and the across-water reach already read.
  - The guard's entry and the raid's entry become one.

**Traps:**

- The one way a unit enters (`entered` in `src/rules/catalogue.ts`) stands every unit ashore with its kind's move. An embarked entry carries the camp's embarked move as its `stats.move`, as a unit the Embark card embarked does, and `embarked: true`. The fixture's `CAMP` names no embarked move; the shipped tests build a camp naming one with `agesOver({ ...CAMP, embarkedMove }, REGIONS)` in `src/rules/enemies.test.ts` and `src/content/scripts.test.ts`.
- `enteredAround` in `src/rules/enemies.ts` enters every raid on the city's ground today, whatever the door. `src/rules/enemies.test.ts` holds a test asserting an island camp's raid enters on the city's ground, two tiles from the camp: it is rewritten to the page, the raid entering on the island. The tests of the ring door and the captured camps stay as they are.
- `raidEntry` reads the ring as the tiles of the raid's ground at the disc's edge; the edge is read off the tiles' distance from `CENTRE`, the chronicle holding no radius.
- `routesFrom` in `src/rules/map.ts` walks the whole map from a tile over the media its `moves` name, and hands back the tiles reached ashore and embarked apart. `groundRunsTo` and `groundAndWaterRunTo` are its two readings.
- `MapAge['camp']` carries `acrossWater` and no embarked move: the generator reads nothing of this line.
- `src/rules/schedule.ts` `raided` is the event answer's door into the raid; `src/content/nomadic.ts` and `src/rules/fixtures.ts` call `enteredAround` for _Make room_.
- The guard's entry on an island camp is already on the camp's own ground (`guardEntered`), with a test on the fixture's `island()`.
- The console entry that enters a unit is a later line; the console plants nothing embarked yet.
- `runtime-error` is in the closed set in `src/rules/stages.ts`, and the screen logs every one.
- `src/rules/` never imports `src/content/`.

**Plan:**

1. **Rules: the entry.** A unit enters embarked on the camp's embarked move through the one way in; one fixture test, the unit standing embarked with that move and its hull drawn being the map's business already.
2. **Rules: the door's own medium.** A raid enters around its door on the door's own ground or, through a coast door, its own water; the guard's entry and the raid's become one; the island camp's raid test rewritten to the page. One fixture test per decision: the island camp's raid on its island, the coast door's raid embarked around it, a raid of several through a coast door all on the water.
3. **Rules: the ring door.** The ring's door tiles read over ground and water where the camp embarks, coast tiles among them; a raid drawn with none a `runtime-error`. One fixture test: a city on an island touching no land of the ring finds a coast door and enters embarked; the Nomadic reading unchanged.
4. **Docs.** The three sentences of the Spec and the Stone page's.
5. **Verify.** Run fmt, check, test and lint.

**Verify:**

- Commands: `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- Proof spec: none. The entries are decided in the rules and held by fixture tests; an embarked enemy is drawn as the shipped line draws it.
- CI proves on the push: `e2e/camps.spec.ts`, `e2e/archipelago.spec.ts`, `e2e/embark.spec.ts`, `e2e/fall.spec.ts`, `e2e/attack.spec.ts`.
