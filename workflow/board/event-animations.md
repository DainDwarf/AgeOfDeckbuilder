# Event animations

**Line:** **Event animations** — when an event's answer lands, what it changes on the map — burned tiles, killed population and units, anything an answer does — is animated rather than simply redrawn; the tile The herd's _Follow it_ charts is one of them, wherever it lies on the map, and nothing draws the eye to it until then. Done-condition: every change on a tile the map draws — `retiled`, `charted`, `killed`, `damaged`, and `assigned` where the tile is left — plays as a motion after the pan that holds the tile, and `e2e/landing.spec.ts` proves the charted tile is brought into the frame and drawn.

**Spec:** no `docs/` page describes a motion of the map: the pan, the slide, the lunge and the arrival stand in code alone, and these join them. The stand-in gains one event on a schedule of its own, in the placeholder convention where a name is its id:

- The event `PH_Wilds`, needing a `PH_Fertile` dealable onto a plain within 4 of the city, dealing `PH_Follow` — costs nothing, reads nothing, lands the feature dealt onto one such tile and that tile charted, the herd's shape — and `PH_Ignore` — costs nothing, reads nothing, lands nothing, the `PH_Tribute` shape.
- The schedule `PH_WildsSchedule`: spacing `[3, 7]`, the capstone `PH_Siege` in `[27, 33]`, the one entry `PH_Wilds` at weight 1.
- Text-table entries: `event.PH_Wilds` "PH_Wilds"; `answer.PH_Follow` "PH_Follow"; `answer.PH_Ignore` "PH_Ignore"; `answer-rules.PH_Follow` "A [feature:PH_Fertile] is dealt onto a [terrain:plain] near the [building:PH_City], and the tile is charted"; `answer-rules.PH_Ignore` "Nothing happens".
- Lore-table entry: `event.PH_Wilds` "PH_Wilds".

**Doc-impact:** none — the design pages state what the screen shows and never how a change moves; the pan shipped the same way.

**Scope:**

- One rule for every change that names a tile: the map plays the difference between the face it drew of that tile and the face the change's chronicle gives it. The terrain changed: the face crossfades from the one colour to the other, 400 ms. A mark gone — a feature, an improvement, a building: it shrinks to nothing, 250 ms. A mark come: it grows from nothing, 250 ms. A tile newly drawn (`charted`): its face, its marks and its fog scrim fade in from nothing, 400 ms. Several differences on one tile play together. The pan that holds the tile comes first, the existing one, unchanged.
- The units: `killed` by no attacker shrinks the marker on the tile as an attack's kill does today; `damaged` bumps it as an attack's target does today. Both after the pan.
- `assigned` where the tile is no longer worked on the change's chronicle: the population mark shrinks away on that tile, 250 ms, whatever the mode — outside city mode the mark is raised for the motion alone and the render takes it down. `assigned` where the tile is worked plays nothing and is rendered at once, as today. So the player's own unassign in city mode gains the shrink, and an act on the map inside those 250 ms is dropped as any command during a play-out is; the reassign drag shrinks at the tile left and paints the tile worked at once. Accepted.
- The rule reads the change's name and the tile it names, never the group it stands under, so it plays for a card as for an answer: Trapping's funnel grows on, a farm and the shelter grow on, a captured camp shrinks away, the stand-in's settle crossfades its tile to urban. Accepted.
- A tile the map draws in fog keeps its snapshot, so a change on it finds no difference and plays nothing; an uncharted tile is drawn as nothing before and after, the same. A change on such a tile is answered with nothing, so the scene renders it, as `staged` answers today for a tile not drawn live — except that a `charted` tile is drawn in fog, so the pan and the fade-in play for a tile that is not live: the rule reads what the map draws, not what it draws live.
- The pan stays one per change: a fire's tiles are neighbours, so the first pan usually holds the rest. The fire burns its tiles in the order the rules raise them, map order and not outward from the start; a rules change, out.
- Out: the resource bar's readings do not tick on an answer's `stock` or `population` change — the same tick would delay every card play by 400 ms; a `population` change with no tile (an idle one leaving) shows nothing on the map; `laid` and the piles are the hand's and unchanged; `held` and `settled` are unchanged.
- The e2e proof: the stand-in event above; the spec opens on `PH_WildsSchedule`, finds by the headless twin the seed whose first deal's `PH_Follow` charts a tile the map does not draw, ends turns to the deal, pushes that tile out of the frame under the standing deal window with the pan and zoom keys, takes `PH_Follow`, and finds the tile inside the frame and its face and feature drawn once the play-out ends; before the take neither was drawn.

**Traps:**

- The `charted` change's chronicle already carries the tile's snapshot: `charting` in `src/rules/chronicle.ts` takes it on the change's own chronicle, so the map's drawing of that chronicle has the tile, in fog. The map reads the difference between the chronicle it stands on and the change's, never the one after.
- `staged` in `src/ui/map.ts` answers nothing for a stage on tiles not drawn live, which is right for a unit's motions and wrong for `charted`: a charted tile is drawn in fog. The tile-difference rule reads `drawnOf` on both chronicles.
- The population mark stands only while city marks are on (`paintCityMarks`); outside city mode nothing marks a worked tile, so the motion raises the mark itself, on the tile at `ASSIGNED_DROP`, and the render that follows wipes it.
- A render repaints every layer of every tile and takes every motion down (`flight`); a motion on a mark is on the objects the map drew for the chronicle it stands on, and the render on the change's chronicle paints the outcome. The improvement marks carry no name today; the feature and building marks do.
- No change or group name is added: `src/rules/stages.ts` is untouched, and every part's exhaustive `switch` stays as it is but the map's.
- The stand-in's `PH_Settle` terraforms its tile to urban, so every spec's settle now plays a 400 ms crossfade under `playedOut`; the settle's budget in `e2e/chronicle-screen.ts` covers it. `PH_Urbanisation` crossfades in `e2e/worker-instants.spec.ts`, the road, the mine and the trapping grow on, the farm grows on in `e2e/building.spec.ts`, the captured camp shrinks in `e2e/camps.spec.ts`.
- The text table `src/ui/text.ts` is glossary-linted by path; the answer-rules sentence above uses glossary words only ("dealt", "charted"). The lore table `src/ui/lore.ts` refuses a missing entry, and `src/content/stand-in.test.ts` reads every stand-in event's name, lore and answers through the screen's lookups, so the entries above land with the event or the coherence test fails.
- Under the deal window a drag lands on the scrim; the pan and zoom keys reach the map beneath it (`docs/INTERFACE.md`, _What stands over what_). `e2e/map.spec.ts` holds `pushOut` and `inside` for a tile pushed out by a drag; the new spec pushes by the keys, and a helper two specs share moves to `e2e/chronicle-screen.ts`. At zoom 1 the frame's edge can come within 4 px of the city's own tile sideways and 48 px above or below it, so a tile a column or two rows away can be pushed out; a zoom notch or two under the window makes it certain.
- A spec rests before it reads what a pan or a fade just placed: `docs/PHASER.md`, _Under a Playwright spec_.
- The e2e budget is 10 s a turn; a landing's motions add under 2 s.

**Plan:**

1. The stand-in event, its schedule, its text and lore entries. Leaves both coherence tests green and nothing on screen changed.
2. The map's motions: the tile-difference rule for `retiled` and `charted`, the unit's kill and bump for `killed` and `damaged`, the population mark's shrink for `assigned`, each after the pan. Leaves the screen as the mockup shows it.
3. `e2e/landing.spec.ts`, and the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof is `npx playwright test e2e/landing.spec.ts`. CI proves on the push `e2e/settle.spec.ts`, `e2e/building.spec.ts`, `e2e/worker-instants.spec.ts`, `e2e/camps.spec.ts`, `e2e/deal.spec.ts`, `e2e/map.spec.ts` and `e2e/play-out.spec.ts`, the paths the rule now plays on.
