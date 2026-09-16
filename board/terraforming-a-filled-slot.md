# Terraforming a filled slot

**Line:** **Terraforming a filled slot** — a worker's terraform is admitted on a filled slot and razes the building the new terrain does not name, the city's tile is terraformed into a terrain its building stands on alone and stands untouched otherwise, a unit left on ground it cannot stand on is killed, and `docs/CHRONICLE.md` says all three. Doc-impact: `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Spec:** `docs/CHRONICLE.md` → _The map_, and one glossary row. The decisions, settled with the user on 2026-09-16:

1. A building follows an improvement's rule under any terraform, a worker's or an event's: kept through a terrain it names, removed with one it does not. The building slot no longer refuses a worker's terraform. The settle and the building card keep their slot refusal untouched.
2. The city's tile is terraformed like any other tile, but only into a terrain the city's building stands on. Into any other terrain the terraform does not happen on that tile: a worker's is refused, an event's passes the tile over and leaves it exactly as it stands — terrain, feature, improvements, building. The rule owns this, never the content: an event's script is not expected to know where the city is.
3. A camp's tile keeps refusing the player's terraform until the camp is captured, as the page already says. An event's terraform reaches a camp as it does today.
4. A unit standing on a tile terraformed into a terrain it cannot stand on is killed, whatever its faction — the worker that terraformed the tile under itself no exception. No refusal guards against it: the dogmas forbid the safety net, and the user wants the natural disasters this makes possible.

The `docs/CHRONICLE.md` edits, written out:

- The _Building_ bullet of the layer list. Replace the sentence "A building names its terrains as an improvement does, and a terraform that reaches it — an event's, since a worker's is refused on a filled slot — keeps it through a terrain it stands on and removes it with one it does not." with: "A building names its terrains as an improvement does, and a terraform — a worker's or an event's — keeps it through a terrain it stands on and removes it with one it does not." The sentence after it, on the city and the camp filling their slots and the camp refusing the player's terraform, stays as it is.
- The paragraph beginning "**Improving and terraforming reach any tile a worker of the player's stands on**". Delete the sentence "A tile whose building slot is filled is not terraformed." and, after the paragraph's last sentence, add: "**The city's tile is terraformed like any other, into a terrain its building stands on alone**: a terraform into one it does not leaves the tile as it stands, feature and layers included — a worker's is refused, an event's passes the tile over — so no terraform takes the city off the map or leaves it where it cannot stand. **A unit standing on a tile terraformed into a terrain it cannot stand on is killed**, whatever its faction, the worker that terraformed the tile under itself no exception."

The `docs/GLOSSARY.md` edit: the **killed** row's definition becomes "What happens to a unit that loses or that a terraform leaves on ground it cannot stand on, or to an inhabitant an event kills: the unit leaves the map, the inhabitant the city." The forbidden-synonym column stays.

Player-facing text: none added. A worker's terraform refused on the city's tile says the existing `refusal.terrain`, "Wrong terrain." — the terrain is what is wrong. A worker's terraform refused on a camp's tile keeps saying `refusal.slot`, "A building already stands there."

**Doc-impact:** `docs/CHRONICLE.md` (_The map_), `docs/GLOSSARY.md` (the **killed** row). `docs/ages/NOMADIC.md` already reads the new way (Wildfire) and is not touched.

**Scope:**

- In: the rules and their tests, the two content copies of the terraform card (`src/content/stand-in.ts` and `src/rules/fixtures.ts`), the two doc edits above.
- Out: any content that terraforms into water or mountain — none exists; the kill rule is written and tested through the rules fixture, not through a new card or event. The Wildfire event itself belongs to the nomadic line.
- Corner cases decided here:
  - A worker's terraform on a tile whose building names the new terrain keeps the building (a camp on plain terraformed to forest by an event keeps the camp: already tested).
  - A worker's terraform on the city's tile is admitted where the source terrain, the worker and the city's building all allow it; the stand-in cannot reach that case (the city is urban and the one terraform card starts from plain), so the test builds a catalogue whose city stands on the terrains the test needs.
  - An event's terraform that passes the city's tile over kills nobody there and removes nothing there: the tile is untouched entirely.
  - The settle's own terraform (the tile made the city's terrain before the city is put down) runs while the chronicle has no city, so the city guard does not fire on it and nothing changes there.
  - A terraform kills the unit outright — it does not damage it; killed is killed, health is not read.
  - A killed player's unit takes its inhabitant with it, as a unit killed in combat does: nothing new, the unit leaves and the population count is untouched (the inhabitant became the unit when it entered).

**Traps:**

- The terraform card exists twice: `PH_Urbanisation` in `src/content/stand-in.ts` and in `src/rules/fixtures.ts`, each composing `made(...)` and `slotFree(tile)`. Both change the same way, and the camp refusal replaces `slotFree` in both; `slotFree` itself stays for the settle and the building card.
- `Block` already holds a `'city'` reason meaning "a unit already stands on the city" (`refusal.city`). Do not reuse it for the city guard: the refusal is `'terrain'`.
- In the fixture catalogue the city is `urban` and its building `PH_City` names `['urban']` alone, while `PH_Camp` names plain, forest and hills. `PH_Quake` terraforms the fixed tile `UPHEAVAL` into forest. A test of the city's tile going through needs a catalogue whose city's building names the target terrain — `changed({...})` in the tests already builds such catalogues, and `catalogued` refuses a city whose building does not stand on the city's terrain.
- Whether a unit stands on a tile is `standsOn(catalogue, stats, tile)` in `src/rules/units.ts`, read against the tile _after_ the terraform.
- Existing tests to flip, not delete: "a tile with a building in its slot is not terraformed" (becomes: the worker's terraform razes the farm) and the last line of the admitted-tiles test for `PH_Urbanisation`, which expects `'slot'` on a farmed tile and now expects the play admitted.
- The e2e suite has no spec on the slot refusal of a terraform; `e2e/worker-instants.spec.ts` plays the terraform on a bare plain and stays green.

**Plan:** rules first, content second, docs last.

1. `src/rules/cards.ts` — `terraformed` owns the invariant. It gains the two rules: on the chronicle's city tile, when the city's building does not name `to`, it returns the chronicle untouched; otherwise, after the tile is relayered, every unit standing on it that cannot stand on the new tile is removed. One predicate — the city's building stands on `to` — is written once and exported, so the refusal and the effect cannot disagree. A second exported predicate refuses a camp's tile (`'slot'`) for the player's terraform; a third refuses the city's tile as `'terrain'` when the city's building does not name the target. How these are cut and named is the implementer's.
2. The terraform card in both content copies composes the new refusals in place of `slotFree`.
3. Tests in `src/rules/cards.test.ts`: the farm razed by the worker's terraform; the camp still refused as `'slot'` with a worker standing on it; the city's tile terraformed by an event into a terrain its building names, building and all still there; the city's tile passed over by an event into one it does not name, tile untouched; a worker's terraform refused `'terrain'` on the city's tile in that case; a unit of each faction killed under a terraform into ground it cannot stand on, and the worker killed under its own; a unit that can stand on the new terrain left standing.
4. The two doc edits, verbatim from _Spec_.

**Verify:**

```
npm run check
npm test
npm run lint
npx playwright test e2e/worker-instants.spec.ts
```
