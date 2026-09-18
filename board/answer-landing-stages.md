# An answer's landing resolves as stages

**Line:** An answer's landing resolves as stages — an answer's and a capstone's landing resolve as one stage per change they make, each carrying the tile it landed on where it landed on one, so a take resolves as `answer` then the landing's stages and the capstone's turn as `capstone` then its landing's; `enter` is the one stage for a unit entering, `charted` the one way a landing charts a tile, and `carriedOver`, `camp-enter`, `reinforce` and the `events` stage are gone. Doc-impact: `docs/CHRONICLE.md`.

**Spec:** `docs/DOGMAS.md` → _Stack_, the first rule: a command resolves as "the ordered steps the command resolves as, never none, each carrying the state it leaves", because "what happened — which tile attacked which — is not in the state that follows it, and the chronicle screen has to play it". `docs/CHRONICLE.md` → _Sight_: "An answer may chart a tile as it lands. The tile is charted where it was not, and its snapshot is taken as it stands, whoever stands on it; it is in fog from then on unless something sees it." → _Events and the capstone_: the take "pays its cost, then lands on the chronicle as it stands"; the capstone "on its turn the events phase lands it alone, whatever else was due, its landing runs straight and the hand is drawn as on any turn". → _The chronicle screen_: the deal window "closes on it with the landing playing out after".

One sentence changes, in _The chronicle screen_, the capstone's window paragraph. Now: "when the capstone lands, where the end of turn's play-out ends on it and the draw plays out once it is closed." Becomes: "when the capstone lands, where the end of turn's play-out ends on it, and its landing and the draw play out once it is closed."

No player-facing sentence: a stage's name is the rules' and the screen's, never the player's.

**Scope:**

The stages. A landing raises one stage per change it makes to the chronicle, in the order it makes them; a helper that changed nothing raises nothing and draws nothing from the generator. A generator draw is not a thing that happened: it rides on the stage it drew for. Four stages carry the tile they landed on:

- `enter` — one unit entering the map by anything but a card play: a camp's roll at the enemy phase, a raid's warrior, a siege's, the capstone's second script. Replaces `camp-enter`.
- `retiled` — one tile's layers changed: a camp placed in its slot, a terrain terraformed into another, a feature dealt onto it. Which layer, the chronicle before and after say.
- `charted` — one tile charted by the landing. The stage carries the tile and its chronicle carries no snapshot of its own for it: the chronicle's charting, meeting the stage, takes that tile's snapshot as the stage's chronicle stands, whoever stands on it, over the one it had, and carries it on to every stage after. `chartedAt` leaves the content's reach; `carriedOver` and the base-and-own merging in the chronicle's charting are deleted.
- `damaged` — the unit standing on the tile hurt or killed by no attacker, as a fire does; an attack stays `attack`.

Four are plain:

- `answer` — the take: the deal popped and the answer's cost paid, nothing landed yet. Always the first stage of a take, so a take never resolves as none; an answer that changes nothing else is this stage alone. Replaces `events`.
- `laid` — a card laid on top of the draw pile.
- `gained` — resources into the city's stock.
- `population-lost` — the city one population fewer, a worker killed on a burned tile or one taken by Departure alike; the tile unassigned with it rides on the same stage.

The take resolves as `answer`, the landing's stages, then the draw where no deal waits, as today. The capstone's turn resolves as `capstone` — the timeline rolled from its turn, nothing landed yet — then its landing's stages, then the draw; the screen's play-out already stops on the `capstone` stage to raise the window, so the landing now plays as the window closes, where today it played before the window rose. The second script on the turns after resolves as its own stages alone, nothing on a turn it changes nothing: `reinforce` is gone. The camps' roll raises `enter` where it raised `camp-enter`.

What each real landing resolves as: Wildfire's Let it burn, per tile burned, `population-lost` where one worked it, `retiled`, `damaged` where a unit stood; the herd's Follow it, `retiled` then `charted` on the one tile; a rival band's Fight, one `enter` per warrior; Make room, `retiled` for the camp then one `enter` per warrior; Lean season's Share, `laid`; Departure's Let them go, `population-lost`; Hunt it, `gained`; the stand-in's siege, one `retiled` per camp placed then one `enter` per warrior; the nomadic capstone, `laid`.

Corner cases decided here: a raid whose ground holds no free tile draws no door and enters nobody, so the door is drawn only where a warrior can enter; a fire that burns a tile into the terrain it already had still retiles it, since the feature and the layers go with the burn. A landing whose city has fallen on one of its stages is cut there by the chronicle's fall, as any command's stages are today; making the fall earlier is the next line's, not this one's.

Out: a card play stays one `played` stage and a hazard's strike one `strike` stage, whatever they do; Make room's fallback to a full raid and its widening band keep their behaviour, the line after this one owns them; what the screen animates on the new stages is the Event animations line's — here the screen plays `enter` as it played `camp-enter` and renders the rest.

**Traps:**

- The screen's play-out in `src/ui/chronicle-scene.ts` cuts the stages at the `capstone` stage and plays the rest once the window closes: it needs no change, and that is what puts the siege after the window.
- Every part of the screen switches over the whole stage set with no default — `src/ui/map.ts`, `src/ui/hand.ts`, `src/ui/piles.ts` — so the typecheck names every switch to touch. The map's arrival animation grows every unit the shown chronicle lacks, so a per-unit `enter` plays one at a time through it unchanged.
- The chronicle's charting in `src/rules/chronicle.ts` carries the snapshots stage to stage and drops the units from them on the tick; the `charted` stage's snapshot has to enter that carrying, or the stages after lose it.
- The content's coherence tests call every `lands` and `continues` on a launched chronicle; the tests in `src/rules/schedule.test.ts` and `src/rules/enemies.test.ts` assert stage lists by name and read the landed chronicle off the `events` stage. They change to the new promise; none is weakened.
- `src/rules/fixtures.ts` composes the same helpers as the content and is the catalogue the mechanism test runs on.
- The raid's door draw in `src/rules/enemies.ts` steps the generator before any warrior enters; the corner case above moves the free-ground check ahead of it.
- The `besieged` helper already hands back the tiles it placed; the capstone's siege in `src/content/stand-in.ts` reads through it.

**Plan:**

1. The landing helpers in `src/rules/schedule.ts` and `src/rules/enemies.ts`, and the answer's and capstone's shapes in `src/rules/catalogue.ts`: every helper answers the stages it raised and the chronicle it leaves, the raid draws no door where no warrior can enter. Leaves the helpers in the new shape, the content not yet on it.
2. `src/rules/chronicle.ts` and `src/rules/sight.ts`: the stage set as listed, the take and the capstone's turn resolving as above, the camps' roll and the second script on `enter`, the charting taking the `charted` stage's snapshot, `carriedOver` deleted. Leaves the rules whole.
3. `src/content/nomadic.ts`, `src/content/stand-in.ts`, `src/rules/fixtures.ts`: every landing composes the helpers in the new shape; the herd charts nothing by hand. Leaves the tree typechecking but for the screen.
4. `src/ui/map.ts`, `src/ui/hand.ts`, `src/ui/piles.ts`: the switches list the new set; the map plays `enter` and renders the rest. Leaves the tree typechecking.
5. The tests: the stage lists asserted, the landed chronicle read where it now stands, and one mechanism test on the fixture catalogue that a landing resolves as one stage per change carrying its tile, and that a tile a landing charts is charted through the chronicle's charting and stays so through the stages after. Leaves `npm test` green.
6. `docs/CHRONICLE.md`: the one sentence.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the specs `npx playwright test e2e/deal.spec.ts`, `npx playwright test e2e/capstone.spec.ts`, `npx playwright test e2e/camps.spec.ts` — the take's landing, the capstone's landing behind its window, the camps' roll.
