# A technology unlocks a region

**Line:** **A technology unlocks a region** — a technology may unlock one region, by its name: the campaign has reached a region once that technology is learned, in every age holding a region of that name, and a region no technology unlocks from its first chronicle; the launch screen opens on a region reached and stands one not reached greyed, reading ??? and answering no press, and a plate reads the region among its reward; the catalogue refuses what it cannot hold; held by tests on the fixture, and no content of an age uses it yet. Doc-impact: `docs/META.md`, `docs/MAP.md`, `docs/META-SCREENS.md`.

**Spec:**

- `docs/META.md` → _The campaign_. "a civilization, authored with its city section and the deck it opens with, or the next age:" becomes "a civilization, authored with its city section and the deck it opens with, a region, or the next age:". After the sentence ending "so the tree runs through the ages and each age is a region of it." add: "A technology unlocks one region at most, by its name, and no two technologies unlock the same one. The campaign has **reached** a region once the technology that unlocks it is learned, in every age that holds a region of that name; a region no technology unlocks is reached from the first chronicle, and every age holds one such."
- `docs/MAP.md` → _The region_. "so one name deals a different map in each age; 🔧 every age offers the same regions by name." becomes "so one name deals a different map in each age, and an age offers only the regions it holds."
- `docs/META-SCREENS.md` → _The launch screen_.
  - After the sentence ending "so a region looks the same in every age." add: "A region the campaign has not reached stands in the row all the same: its seven hexagons greyed, ??? on the middle one and no name under it, and it answers no press."
  - "The screen opens on the furthest age the campaign has reached, on the first region and on the first civilization." becomes "The screen opens on the furthest age the campaign has reached, on that age's first region the campaign has reached and on the first civilization."
  - "Selecting another age keeps the region where that age holds one of its name, and takes the age's first region where it does not." becomes "Selecting another age keeps the region where that age holds one of its name, and takes the first region of that age the campaign has reached where it does not."
- `docs/META-SCREENS.md` → _The campaign screen_. "then **Reward** and what the technology unlocks, the cards with their copies or the age, one to a line," becomes "then **Reward** and what the technology unlocks, the cards with their copies, the region and the age, one to a line,".
- Player-facing entries, in `src/ui/text.ts`:
  - `'plate.region': '{region} region'` — the plate's reward line, the region read by its name; "Archipelago region" measures 118 of the line's 161 at the plate's size. Claude wrote it and the user picked it over "The {region}".
  - `'launch.unknown-region': '???'` — on the middle hexagon of a region not reached, an entry of its own as `'plate.unknown'` and `'launch.unknown-age'` are.

**Doc-impact:** `docs/META.md`, `docs/MAP.md`, `docs/META-SCREENS.md`.

**Scope:**

- In: the declaration on a technology; the catalogue's refusals; the regions a campaign has reached, read off the technologies it has learned; the launch screen's choices and its row; the plate's reward line; the two text entries; the tests.
- The declaration is sized by the user: one region at most a technology, by name, as it unlocks one age at most. The name is every age's: a technology of one age opens the region of that name in a later age too, and that age's region needs no technology of its own.
- Nothing is stored: a region reached is read off the campaign's learned technologies, as an age reached is, so a campaign that learned the technology before the region existed has reached it at once. Saves from before this line need no care.
- The catalogue refuses, when it is built: a technology unlocking a region no age holds; a region two technologies unlock; an age none of whose regions is open from the first chronicle. One rejection vocabulary, as every refusal there.
- The launch screen: the opening choices and a change of age take the first region reached, in the order the age lists them. A region kept across a change of age is reached already, the name being what is reached.
- A region not reached is drawn as an age not reached is on the arrow: the fill and the ink of the unknown, no dimming, no selection edge. Its container is named `launch-region-<id>` and carries `selected` false, as the unknown age's is named `launch-age-<id>`: the Archipelago line's spec reads it by that name.
- The plate's reward reads, in order: the cards, the region, the age, the influence.
- The reconcile's choices: a region unlocked takes the age's shape — one a technology, none twice, greyed and ??? while not reached — and differs where it is meant to: it is named for every age, and a region no technology unlocks is open. The launch row's cluster goes through the standing rule as it is.
- No launch is refused in the rules for a region not reached, as none is for an age not reached: the launch screen offers only what is reached and no other path names a region, and no guard stands against a state no path reaches.
- Out: any region of an age and any technology of an age unlocking one — the Archipelago line's; the ending's pay by region; an achievement the launch's choices admit.

**Traps:**

- `treeHeld` in `src/rules/catalogue.ts` is where a technology's unlocks are refused, and `agesReached` in `src/rules/campaign.ts` is the age's counterpart of what this line adds. `firstRegion` there answers the first region listed, reached or not.
- `src/ui/launch-layout.ts` holds what the launch screen computes before it draws and is tested in Node, `src/ui/launch-layout.test.ts`; `src/ui/launch-screen.ts` only draws. `DOGMAS.md` _Stack_: a piece beside the scene receives the catalogue, and the campaign with it, as an argument.
- `REGIONS` in `src/rules/fixtures.ts` is the one table every fixture age holds, and the standing launch tests open on its first region with nothing learned: a fixture technology unlocking one of its regions moves what those tests open on. `agesOver(camp, regions)` there builds ages over regions handed in.
- `docs/PHASER.md` for anything drawn: an object answers a press only once made interactive, so a region not reached is given no hit.
- The plate's height is the tallest plate's lines, computed in `src/ui/tree.ts` from the same reward lines it draws; a reward kind added there is counted there.
- The unknown age's drawing in `arrowOf` (`src/ui/launch-screen.ts`) is the precedent to read before drawing the unknown region.

**Plan:**

1. `src/rules/catalogue.ts`, `src/rules/campaign.ts` and the tests beside them: the declaration, the refusals, each by its message, and the regions reached — leaves a catalogue that holds a region's unlock or refuses it by name, and a campaign that answers which regions of an age it has reached: one test that a region a technology unlocks is not reached until the technology is learned and is reached in every age holding its name once it is, and that a region no technology unlocks is reached from the start.
2. `src/ui/launch-layout.ts` and its test: the choices and the row over the regions reached — leaves the screen opening on the first region reached, a change of age taking the first reached, and the row naming each region reached or not.
3. `src/ui/launch-screen.ts`, `src/ui/tree.ts`, `src/ui/text.ts`: the region not reached drawn and answering no press, the plate's reward line, the two entries.
4. The `docs/` edits above.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No proof spec: no content of an age reaches the mechanism, and `e2e/archipelago.spec.ts`, the Archipelago line's, proves its screen. CI proves the whole suite on the push; the specs that walk the launch screen and the plates are `e2e/launch.spec.ts`, `e2e/launch-warning.spec.ts`, `e2e/menu.spec.ts`, `e2e/console.spec.ts`, `e2e/continue.spec.ts`, `e2e/tree.spec.ts`, `e2e/pin.spec.ts` and `e2e/campaign.spec.ts`.
