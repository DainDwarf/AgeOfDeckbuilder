# A camp's wave

**Line:** A camp's wave — a camp whose guards ashore within the distance its content names are as many as it names sends as many as it names off together under one of its other scripts, drawn seeded by weight, at the enemy phase's start, the camp's holder leaving last; the Stone camp names a wave and the Nomadic one none, the rules hold it on a fixture test, and the chronicle, Stone and Nomadic pages say so.

**Spec:** `docs/CHRONICLE.md` _Enemies and camps_, `docs/ages/STONE.md` _The camps_, `docs/ages/NOMADIC.md` _The camps_, `docs/GLOSSARY.md` for the words. The edits, written out:

- `docs/CHRONICLE.md` _Enemies and camps_, the paragraph "An enemy follows its script": the sentence "A camp may send the guards gathered around it off together under another script, how many and when being the camp's content, so a camp's own enemies come as a raid and not one by one." becomes: "A camp sends its guards off in a wave: at the start of every enemy phase, once the prepares have landed and before any enemy acts, each camp standing counts the guards ashore within the distance its content names, each guard counted for the nearest camp alone, ties in tile order; where they are as many as its content names, as many as it names leave together under one of the camp's other scripts, drawn seeded among those its content names for its waves by their weights, and act under it from that phase on. The guards off the camp's tile leave first, in the order they entered, and the one on its tile last, so a wave smaller than the band leaves the camp held. How far, how many gathered, how many sent and which scripts are the camp's content, and a camp naming no wave sends none. So a camp's own enemies come as a band and not one by one, and a guard killed on the player's turn holds the wave back. A wave sent after the camp's roll, before the player's turn, was rejected: the band gathering is what the player answers."
- `docs/ages/STONE.md` _The camps_, the last sentence "A camp sends out waves: once enough guards have gathered around it, some leave together as raiders or pillagers, so a raid out of a camp arrives as a band and not one warrior at a time." becomes: "A camp sends out waves: once enough guards stand within the guard's own reach of it, some leave together as raiders or as pillagers, the one holding the camp staying, so a raid out of a camp arrives as a band and not one warrior at a time."
- `docs/ages/NOMADIC.md` _The camps_, after "a guard with no camp within its radius raids.": "The Nomadic camp sends no wave: its guards gather and stay." — one sentence, in that paragraph.
- `docs/GLOSSARY.md`: no row. "Wave" is a plain word, as "raid" is; the enemy's own verbs stay prepare, pillage, capture.

No player-facing text: the unit card reads no script, the stage shows nothing, and no console line reads the wave.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/ages/STONE.md`, `docs/ages/NOMADIC.md`.

**Scope:**

In:

- The camp's content may name a wave: how far from the camp its guards are counted, how many gathered send it, how many leave, and the scripts a wave may take with a weight each. A camp naming none sends none. The catalogue refuses a wave naming a script the camp's scripts do not hold, a script at a weight not above nought, no script at all, a count gathered or sent below one, more sent than gathered, or a distance below nought.
- The count: the enemies carrying the camp's guard script, ashore, within the distance of the camp, each counted for the nearest camp within that distance of it alone, ties in tile order. An embarked guard, a guard beyond the distance, an enemy under any other script, and a unit of the player's count for nothing.
- When: inside the `enemy-phase` group, after the prepares have landed and before the first enemy acts, camps in tile order. A chronicle the prepares ended takes no wave, as it takes nothing after its ending.
- Who leaves: of the counted guards, those off the camp's tile first in the order they entered, then the one on the camp's tile; as many as the content names, never more than counted.
- The script: one draw per wave from the chronicle's seeded generator among the wave's scripts by their weights, through the one weighted draw the rules have; a wave naming one script draws nothing, as a camp of one kind does. Every guard of the wave takes the script drawn.
- The stage: one tiled change per wave, carrying the camp's tile, the chronicle after it holding the guards re-scripted; a camp whose count falls short raises no stage. Its name is the implementer's, added to the closed set.
- The rules get the reading "the nearest camp within a distance of a unit, none while it stands embarked, ties in tile order", and the content's guard script reads its camp through it; the Stone camp's wave distance and the guard's radius are one number the content names once.
- The Stone camp names a wave: counted within the guard's radius, sent once three have gathered, two leaving, raider and pillager at equal weight. The numbers are tuning and change; no test reads them.
- The Nomadic camp names no wave.
- Tests, on the fixture: the mechanism's test, at a camp's odds of nought with a fixture wave named through the tests' camp override, three sentries within the distance of one camp: the end of turn re-scripts two of them to the raider script before any enemy acts, the one on the camp's tile keeping its own, the stage carrying the camp's tile, and the two walk toward the city on that same phase; with two gathered, no stage and no change; a sentry beyond the distance, one embarked, and one standing nearer another camp are not counted; a seed draws the same script every time and seeds differ where two scripts weigh alike; a guard the player's warrior killed on its turn leaves the count short and no wave goes. The catalogue's refusals, each one asserted on the camp override the catalogue tests use.
- The catalogue's coherence test passes on the Stone content with its wave named.

Out:

- Any show of the wave on screen: the band moving is the show. A later line may give the unit card a script line; none does today.
- A wave through a raid's door, or a wave entering new enemies: the wave re-scripts guards standing on the map and enters nothing.
- A wave's band moving as one: each enemy follows its script from where it stands; leaving together is the group.
- The guard's embarked raiding: an embarked guard raids already, under its own script, and is not counted.
- A Stone event adding guards to camps: the schedule rung's.

Corner cases decided:

- A guard standing at the same distance from two camps counts for the one first in tile order, so no guard counts twice and a camp never sends a guard another camp counted.
- Where the count reaches the number and the wave takes every counted guard (sent equal to gathered), the camp's own holder leaves too; the content chose two of three for the Stone camp so the camp stays held.
- A re-scripted guard keeps its move points, action, health and tile; the re-script spends nothing.
- A camp's re-scripted guards act under the new script on the same phase, in unit order, like every enemy.
- The wave is read before the enemies act and after the prepares land, so a pillager's prepare landing on that phase changes no count, and an enemy the acts kill was already counted or not.

Reconcile:

- The guard's "which camp is mine" (`src/content/scripts.ts`, the guard script's nearest camp within its radius) and the wave's count become one: the reading moves to the rules and the guard script calls it. The standing one answers none while embarked and ties in tile order; the projected keeps both.
- The wave's script draw goes through the standing weighted draw as it is, the one unit kinds are drawn by: one entry draws nothing.
- Nothing changes a unit's script after its entry today; the re-script is new.

**Traps:**

- The enemy phase (`src/rules/chronicle.ts`) is one group: the prepares landed, then every enemy acting in unit order, then the camps rolling. The wave lands between the first and the second. A capture's `ended` must stay alone in the group where it lands; the ending walk already stops everything after it.
- The stage set (`src/rules/stages.ts`) is closed and every switch over it is exhaustive: the chronicle's ending walk, and `src/ui/hand.ts`, `map.ts`, `piles.ts`, `overlay.ts`, `resource-bar.ts`. A new change or group name is added to each, doing nothing on screen. `docs/PHASER.md` holds what the screen side needs; nothing rendered changes here.
- `Camp` (`src/rules/catalogue.ts`) is validated in the catalogue's per-age check, which already refuses a script not in the scripts table and odds out of range; the wave's refusals land beside them, and the catalogue tests' `encamped()` helper is how they are asserted.
- The scripts table is shared across ages and defined in `src/content/nomadic.ts` (`guard: guarding(2)`); the Stone camp spreads the Nomadic camp and adds the pillager. The radius the wave counts within and the guard's radius must be one number named once; where it lives is the implementer's.
- The fixture camp (`src/rules/fixtures.ts`, `CAMP`) names guard `PH_Sentry` (stays, attacks the least health) and raider `PH_Beeline` (walks to the nearest city); the tests' `camping()` override lays fields over it. The fixture camp names no wave by default, or every enemy-phase test with three sentries near a camp changes.
- The enemy's `script` is saved by name (`src/rules/save.ts`) and read back through the scripts table; a re-scripted guard needs nothing new in the save.
- Unit order is the order of `chronicle.units`, the order of entry; tile order is the order the map lists its tiles. The design names both.
- A guard beyond its radius raids under its own script already (the guard script falls back to the raider's walk); counting only within the distance keeps the wave off those.
- `src/rules` never imports `src/content`: the reading the guard script calls lives in the rules and takes the catalogue.
- Content decides nothing new here: the wave is numbers over the rules' helpers, so the Stone content gets the coherence checks alone and no walk test (`DOGMAS.md` _Testing_).
- The capstone's second-script hook and the siege fixture are a later line's; nothing here touches them.

**Plan:**

1. Rules: the camp's wave in `Camp` and the catalogue's refusals; the nearest-camp reading; the wave in the enemy phase with its stage; the closed set and every switch over it; the fixture's camp override carrying a wave; the tests named in Scope. Leaves the rules sending waves on the fixture, every test green, no content naming one.
2. Content: the guard script reading its camp through the rules; the Stone camp naming its wave on the shared radius; the coherence test passing. Leaves the Stone Age sending waves.
3. Docs: the three pages as Spec writes them.
4. Verify.

**Verify:** `npm run fmt`, `npm run check`, `npm test`, `npm run lint`. Proof spec: none; the line reaches the screen as nothing new. CI proves on the push: `e2e/camps.spec.ts`, `e2e/attack.spec.ts`, `e2e/pillage.spec.ts`, `e2e/archer.spec.ts`, `e2e/embark.spec.ts`, `e2e/archipelago.spec.ts`.
