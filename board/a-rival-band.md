# A rival band

**Line:** **A rival band** — the Nomadic Age's second event stands in its catalogue and its schedule, Fight entering a raid and Make room placing one camp near the city with a smaller raid on and around it: content tests on a settled launch show Make room placing exactly one camp, 3–4 tiles from the city, with a warrior on it, a second warrior beside the camp on a turn past 10, the search widened to the nearest tile beyond when no tile 3–4 away takes a camp, and Fight entering more warriors than Make room on an early turn and on a late one; the event and both answers have their names and sentences; `NOMADIC.md` → The events, `CHRONICLE.md` → Events and the capstone and the glossary's camp row say so.

**Ships after** _Raids enter as one group_: this line is content on the two functions that line leaves in `src/rules/` — the raid through a drawn entry (`raided`, drawing it with `raidEntry`), and the group entering on and around a given tile (`enteredAround`). If they are not there, stop and say so.

**Spec:**

1. [`docs/ages/NOMADIC.md`](../docs/ages/NOMADIC.md) → _The events_. The rival band bullet is replaced, whole, by

   ```
   - **A rival band.** _Fight_: their warriors enter the map as one raid and come. _Make room_: a new camp is placed near the city and a smaller raid enters on and around it, one warrior at first — a source of raids for the rest of the chronicle, and a capture with its rewards for a band bold enough. Both answers cost no stock: many now against fewer now and more later.
   ```

   Nothing else on the page changes; "a later rival band is larger either way" and "a rival band is a raid now against a camp later" hold as written. The page carries no number, so the 3–4 tiles and the counts stay off it.

2. [`docs/CHRONICLE.md`](../docs/CHRONICLE.md) → _Events and the capstone_, the paragraph **Enemies enter from camps.** After its second sentence, the one ending `each uncharted until seen.`, this sentence is added:

   ```
   An event's answer may place a camp too, and a placed camp is a camp in everything: it rolls its own warriors, it is a raid's door, and its capture deals the same rewards.
   ```

3. [`docs/GLOSSARY.md`](../docs/GLOSSARY.md), the **camp** row's meaning becomes

   ```
   A site enemies enter the map from, generated with the map or placed by an event, filling its tile's building slot; captured, it leaves the map.
   ```

   Its forbidden synonyms are kept.

4. Player-facing sentences, `src/ui/text.ts`:
   - `event.rival-band`: `A rival band`
   - `answer.fight`: `Fight`
   - `answer-rules.fight`: `A raid of {warriors} enters the map`
   - `answer.make-room`: `Make room`
   - `answer-rules.make-room`: `A camp is placed near the city, and a raid of {warriors} enters on and around it`

**Doc-impact:** `docs/ages/NOMADIC.md`, `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: the event `rival-band` with its answers `fight` and `make-room` in `src/content/nomadic.ts`, its entry in the `nomadic` schedule, the placement of one camp near the city with the search widened, the five text entries, the content tests, the three docs edits.
- Out: the raid's entry (`raidEntry`) and the group entering (`enteredAround`), which the line before owns and this one only calls; the stand-in and the rules fixture, which gain nothing; any announcement or reveal of where the camp lands (none: it is drawn when it is in sight, like any camp); per-camp odds or rewards (a placed camp is the catalogue's camp); the balance of any number here.
- Decided here:
  - **Counts** 🔧, tuning: Make room's raid is Ration's count — one warrior, and one more for every ten turns; Fight's is one more than that. What must hold, and what the test holds, is that Fight enters more warriors than Make room on the same turn — never a comparison with Ration.
  - **Both answers cost no stock**, and each `reads` its own `warriors` for its sentence.
  - **One camp always**, whatever the turn. Make room's first warrior enters on the camp's own tile; the rest of its raid enters ring by ring around it, by `enteredAround`, under that function's rules.
  - **Where the camp goes**: drawn seeded, uniformly, among the tiles 3–4 from the city that take a camp by the rules `besieged` already reads — a terrain the camp's building names, an empty building slot, the ground running to the city, held by nobody, no unit standing on it, at least 3 tiles from every camp standing. A tile in the city's sight, a tile carrying a feature, a tile carrying an improvement all take it, and the feature or improvement stays under the camp.
  - **The search widens until a tile is found**: when no tile 3–4 from the city takes a camp, the far end grows a tile at a time — 3–5, 3–6, … — to the edge of the map, and the camp is drawn among the first span that holds a candidate. The near end stays at 3. Only a map with no such tile anywhere places no camp; Make room's raid then enters through the ordinary entry draw (`raided`), so the answer is never a free pass. That last case needs no test of its own.
  - **The event weighs 1 from turn 1** 🔧, as Lean season does.
  - **The placed camp is a camp in everything**: it rolls at the enemy phase from the turn it is placed, it is a door for later raids, its capture deals the catalogue's rewards.

**Traps:**

- `besieged` in `src/rules/schedule.ts` owns every rule of where a camp may go, takes a fixed span, and enters one unit on each camp it places. The widening must reuse its candidate rules, never restate them: either `besieged` is called with a growing span until the map gains a camp, or its candidate filter is lifted out and shared. Which is the implementer's; a second copy of the filter is a defect.
- `besieged` draws from `chronicle.rng` only when it has candidates, so a span that holds none costs no draw. Keep that: a widened search draws once, for the span that holds the camp.
- The tile the camp landed on is what `enteredAround` needs, and `besieged` hands back a chronicle, not a tile. Reading it back — the one camp tile the chronicle gained — is fine; so is a rules function that returns it. The implementer's.
- The camp's own tile is taken by the first warrior when the rest of the raid enters, so `enteredAround` must be handed the camp's tile with its count less one, or the whole count on a camp left empty — never both, or the raid is one too many.
- Content tests need a late turn: a settled launch stands on turn 1, and the counts read `chronicle.turn`. Setting the turn on the chronicle handed to `lands` is how `nomadic.test.ts` can reach turn 10 and past without walking there.
- To show the widening, a test needs a chronicle where no tile 3–4 from the city takes a camp; holding those tiles, or standing units or camps on and near them, on a copied chronicle does it without a new map.
- `src/content/nomadic.test.ts` already sweeps every event's name, every answer's name and rules entry, and every answer's `reads` and `lands` on a settled launch; the new event falls under it with no edit, and fails it until the text entries exist.
- A camp appearing in sight in the middle of a chronicle, and enemies entering beside it on tiles that are no camp, may now happen on the real content. The stand-in's siege already raises camps at a landing; if the play-out is seen to mishandle either, report it; do not fix the UI inside this line.

**Plan:**

1. `src/rules/schedule.ts` — the one function that owns "a camp placed near the city, the search widened, its raid on and around it": the choke point for the widening invariant and for the count split between the camp's tile and the tiles around it, built on `besieged`'s candidate rules and `enteredAround`.
2. `src/content/nomadic.ts` — the two counts beside `raiders`, the event with its two answers, the schedule entry.
3. `src/ui/text.ts` — the five entries.
4. `src/content/nomadic.test.ts` — the done-condition's cases: one camp 3–4 from the city with a warrior on it; a second warrior beside it past turn 10; the widened search; Fight above Make room early and late.
5. The three docs edits.

**Verify:** `npm run check`, `npm test`, `npm run lint`, and `npx playwright test e2e/camps.spec.ts`.
