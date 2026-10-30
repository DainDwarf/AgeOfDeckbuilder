# The map's units retained

**Line:** **The map's units retained** — one marker per unit id, made when the unit enters the chronicle the map stands on and destroyed when it leaves it, its dim parts and its prepared hue made and destroyed with it; a render writes every marker in place — position, parts, dim, hue, name — and destroys nothing but the markers of units gone; a unit's motion plays on its own marker, and the enter stage grows the marker the render makes; a unit's mark reads its parts onto an empty container, the fog unit marks' stand-in with it. Doc-impact: none.

**Spec:** `DOGMAS.md` _Stack_, "A game object is made once and changed in place", is the rule, its clause "what has an identity and is few is made when it enters and destroyed when it leaves" the shape. `docs/CHRONICLE-SCREEN.md` _The map's presses_ states what a unit's marker shows — a unit of the player's with no move points and no action left dimmed under the scrim every dim of the map is, an enemy never dimmed, a tile a unit has prepared on wearing its faction's colour from the enemy phase that prepared it until the next resolves it or the unit is killed, drawn where the unit is drawn — and _The pointer and the tile's marks_ where it stands, over the building, the badge over it, embarked shown as embarked; _The veils and the infopanel_, "a change plays on the map as it stood, and the map draws what the change leaves once it has played". None of it moves. No player-facing sentence: the player sees the same map.

**Doc-impact:** none — the dogma states the rule and the chronicle screen page states what is drawn, which does not change. `docs/PHASER.md` gains an entry only where the ship reads a Phaser fact the page lacks, cited by file and line in the package.

**Scope:**

In: the live unit markers of `src/ui/map.ts`, their dims and their prepared hues, and the one reader a unit's mark goes through. By part:

- The marker: one container per unit id, keyed by the id, made when a render or a motion first meets the unit on the chronicle the map stands on, destroyed when a render finds its unit gone from it. A unit id is never reused within a chronicle (`nextUnit` only climbs), and the map view lives one chronicle, so the key is sound. A marker whose unit stands on a tile the map does not draw live is hidden, and the fog unit mark pool draws the snapshot's unit as today.
- The parts: a unit's mark reads its shapes onto a container through one reader, the hull and the kind, adding a polygon where the container holds fewer than the shapes need and hiding the ones left over; the stand-in with its literal two polygons goes, and the fog unit mark pool makes its stand-ins empty and reads them through the same reader. The marker and the fog mark are two uses of one door, and `src/ui/infopanel.ts` keeps its made-once mark through the exported factory.
- The dim: parts of the marker, shaped as the unit's shapes are and named as today, shown while the unit is the player's with no move points and no action left, hidden else.
- The hue: one polygon per marker on the prepared layer, made and destroyed with the marker, read for its unit's tile and faction and shown while the unit has prepared; the pool of hues goes, and the map of hued units with it, the marker's record holding the hue.
- The name: the tile key, as the specs read it, written at every render for every marker, hidden ones included, so no two markers share a name at any time, one unit standing on a tile.
- The render: for every unit of the chronicle, the marker found or made, its tweens stopped, its end state written — position, scale, alpha, visibility, parts, dim, hue, name — over whatever a motion left; every marker whose unit is gone destroyed, its hue with it. `wipeMarkers` goes.
- The motions: the lunge, the bump, the slide, the shrink, the hue's fade and the arrival's growth play on the marker and the hue the render keeps; the arrival makes nothing of its own but takes the marker the render's door makes, set to scale 0, and grows it; the settle's render writes the end state and destroys the markers of the units killed.
- The grab: a press holds a unit by its id and finds its marker through the same map; the slide home runs on the retained marker, and a render during it stops the slide and writes the marker home, as a rebuild snapped it today.

Out: everything the tiles line retained; the hand's faces and the piles' tops, the next lines'. The aim's catcher and glow layer, made at the aim's open and destroyed at its close.

Corner cases decided here:

- A render while a marker shrinks, lunges or slides stops the tween and writes the end state; the fog spec that pauses every tween mid-shrink and resumes it finds the same marker shrinking and then gone.
- A unit entering on a tile not drawn live gets its marker at the render, hidden; it shows at the first render that draws its tile live, with no growth.
- The scene's restart destroys everything with the scene, as today; nothing is kept across chronicles.
- A veil switched is a render: shows and hides markers, destroys nothing.
- Hit-testing is unchanged: `tileUnder` reads the drawn set, not objects.

The reconcile, three likenesses: the retained pool's reset at reuse — visible, alpha one, scale one, tweens stopped — is what a render writes over a marker, and the marker goes through that same reset, the pool's `asPainted` as it stands; the map of hued units and the map of markers become one record per unit, since the hue is the marker's; the fog unit mark's reader and the marker's are one function, the fold the user ordered.

**Traps:**

- `docs/PHASER.md` _Scenes and stacking_: a hidden object is neither drawn nor hit; a Layer draws by depth first and add order among equal depths; a Container's `removeAll(true)` destroys its children where a Layer's destroys nothing. _Rendering under WebGL_: `killTweensOf` destroys a tween silently and a promise waiting on it waits for ever; `stopMotion` in `src/ui/card-motion.ts` stops, which resolves.
- A Polygon's `setTo` reruns its bounds and its triangulation every call (`Polygon.js:133-141`): the page's "costs nothing where nothing changed" is false of it. A marker read every render for a handful of units is cheap; a reader that compares before it writes is the implementer's call, never a guard the design asks for.
- `e2e/chronicle-screen.ts`'s readers answer the shown and prefer the first shown object of a name, falling back to the first found; a hidden marker keeps a name, so every marker's name is written at every render or a stale name is read.
- `e2e/fog.spec.ts`, "an attack that kills the unit whose sight alone held its tiles", reads the marker by `unit-<tile>` while it shrinks and pauses the map scene's tweens; `e2e/attack.spec.ts` reads `unit-dim-<tile>` standing for the warrior and not for the enemy; `e2e/map.spec.ts` and `e2e/neutral.spec.ts` read `unit-<tile>` where it stands after a drag home. `e2e/pillage.spec.ts` reads `prepared-<tile>` standing and its fill.
- The `hued` map is read by `hueOn` for the shrink that takes the hue with a killed unit and by `preparedOn` for the fade; both become reads of the unit's record.
- `homing` is keyed by the mark object and outlives a render now that the mark does: a render that writes the mark home stops the slide through its `onStop`, which clears the entry.
- `src/ui/infopanel.ts` builds its unit mark through `unitMark`, exported; the factory stays for it and reads through the one reader.
- A snapshot answers for its tile whole: one taken of an empty tile hides the unit that has walked onto it since (the standing comment in `paintTile`).
- A hook flags a comment block longer than three lines touched under `src/` or `e2e/`; advisory.
- `src/ui/map.ts` is past 2,100 lines; this line adds no second file, and a cut is a line of its own.

**Plan:**

1. `src/ui/map.ts`: the one reader of a unit's mark onto a container of any size, the fog unit mark pool's stand-ins made empty and read through it, the stand-in with the literal two gone. Leaves the fog marks drawn as today through the folded reader.
2. `src/ui/map.ts`: the per-unit record — marker, dim parts, hue — made by one door and destroyed by one, the render writing every record in place and destroying the records of units gone; `wipeMarkers`, the hue pool and the hued map gone. Leaves every render destroying nothing but what died.
3. `src/ui/map.ts`: the motions on the retained markers — the arrival through the render's door, the kill's shrink settling into the destroy, the hue's fade and growth on the kept hue, the slide home across a render. Leaves the suite's motion specs green on retained markers.

One commit, the line's.

**Verify:** `npm run check`, `npm run lint`, `npm test`. The proof spec: `npx playwright test e2e/attack.spec.ts` — it walks a lunge and a bump on retained markers, the dim shown on the spent warrior and not on the enemy, and the render that follows the attack. CI proves on the push every spec that opens a chronicle, the most direct among them `fog`, `map`, `move`, `embark`, `pillage`, `neutral`, `settle`, `camps`, `console`, `city-mode`, `inspect`, `archer`, `flood`, `pointer-sweep`, `hover`, `broken-motion`.
