# Guarded camps and the enemy scripts

**Line:** Guarded camps and the enemy scripts — every camp opens and rolls with a guard on or beside it, a warrior carries the guard or the raider script its entry names, and each script's decisions are held by one test on the fixture. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`.

**Spec:** `docs/CHRONICLE.md` _The turn_ (item 7), _Events and the capstone_ (the camps paragraph); `docs/ages/NOMADIC.md` _The events_ (the rival band), _The camps_. Two scripts replace the one: a **guard** keeps a camp, a **raider** goes for the city. Which one a warrior carries is named by whatever enters it, and the camp's content names both. The sentences, written out:

- `CHRONICLE.md` _The turn_, item 7, replace "each enemy in turn, on the chronicle as the enemy before it left it, moves by its script and then attacks a unit of the player's within its range, spending its action as any unit does" with: "each enemy in turn, on the chronicle as the enemy before it left it, moves by its script, which draws from the seeded generator where it draws, and then attacks the unit its script names within its range, spending its action as any unit does". Replace "Once the enemies have acted, each camp whose tile is free rolls whether an enemy enters on it." with: "Once the enemies have acted, each camp rolls whether a warrior enters on it or beside it."
- `CHRONICLE.md` camps paragraph, replace "The generator places **camps** on the map, each filling its tile's building slot, each uncharted until seen." with: "The generator places **camps** on the map, each filling its tile's building slot, each uncharted until seen, and the chronicle opens with one warrior of the camp's standing on each." Replace "A camp enters on its own too: at every enemy phase, each camp whose tile is free rolls, seeded, whether an enemy enters on it, and the odds are content. Camps spawning through events alone was rejected: the camps stand empty most of the chronicle, and a capture is a walk." with: "A camp enters on its own too: at every enemy phase, each camp standing rolls, seeded, whether a warrior enters, on the camp's tile where it is free and on the nearest free tile around it otherwise, as a raid enters around its door; the odds are content. A camp standing empty until a raid was rejected: a capture is a walk." Replace "The enemy follows its script — the default one moves toward the nearest of the player's units or the city by the cheapest way, attacks it, and attacks nothing from the city's tile: it is there to capture. Whether a script strikes from there is content." with: "A warrior follows its script, and which script it carries is named by what enters it — the opening, the camp's roll, a raid, an answer — out of the ones the camp's content names; what a script does, whom it attacks and whether it strikes from the city's tile is content."
- `NOMADIC.md` _The events_, the rival band, replace "_Make room_: a new camp is placed near the city and a smaller raid enters on and around it, one warrior at first — a source of raids for the rest of the chronicle, and a capture with its rewards for a band bold enough. Both answers cost no stock: many now against fewer now and more later." with: "_Make room_: a new camp is placed near the city with its guards on and around it, one at first — a door for the raids to come, and a capture with its rewards for a band bold enough. Both answers cost no stock: raiders at the city now against a camp beside it for good."
- `NOMADIC.md` _The camps_, replace "A camp is a rival band's, and a warrior may enter on it any turn, as the rules say." with: "A camp is a rival band's, and its warriors follow one of two scripts, **guard** or **raider**. A guard keeps its camp, the nearest one standing within a small radius of it: on the camp it stays; off it, it walks back onto the camp while the tile is free, and while a fellow holds the camp it closes on any unit of another faction it could strike from inside that radius and wanders inside it otherwise — so a camp with one guard is held, and one with several has the rest roaming around it; a guard with no camp within its radius raids. A raider goes for the city: on the city's tile it stays and attacks nothing; it steps onto that tile when it can, strikes a unit it can reach on its way, and otherwise moves toward the city by the cheapest way. Either attacks the unit of the least health within its range. The chronicle opens with a guard on each camp, the camp's roll enters a guard, Lean season's _Ration_ and the rival band's _Fight_ enter raiders, and _Make room_ enters guards." The rewards paragraph stands.

No player-facing text: the scripts are content ids, never shown, and no glossary row is added.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`.

**Scope:**

In:

- The camp's content names two scripts, one the guards carry and one the raiders carry, both validated as scripts the catalogue holds. The one script field goes.
- The two scripts in the content, each decision with one test beside the script, the real closure played on the fixture's ground. The raider's decisions: on the city's tile it stays and attacks nothing; the city's tile free and in reach, it steps onto it ahead of any attack; a unit it can strike this phase, it lands in range of it and strikes, the landing nearest the city among those; otherwise it moves toward the city by the cheapest way; among targets in range, the least health. The guard's decisions: its camp is the nearest camp standing within the radius of it, ties in tile order; on its camp it stays; off it with the camp's tile free, it lands on the camp or, failing the reach, as near it as it can; the camp held by a fellow, it lands in range of a unit of another faction it could strike from inside the radius, the landing nearest the camp among those, and failing the reach closes on that unit within the radius; nothing to strike, it wanders to a landing drawn uniformly from the seeded generator among the reachable tiles inside the radius, the one it stands on included; no camp within the radius of it, it acts as a raider; among targets in range, the least health. Ties on a target or a landing fall to tile order, the convention the scripts already use. The radius starts at 2 and is the content's number, the balance pass's to tune.
- The rules: the chronicle opens with one guard standing on each camp the map was dealt; at every enemy phase every camp standing rolls, and on a hit a guard enters on the camp's tile where it is free and on the nearest free tile of the raid's ground around it otherwise, a camp a unit of any faction stands on included; a raid enters raiders; a script's move may draw from the seeded generator, and the phase carries the generator the script leaves, so a chronicle replays from its seed. Each of those three mechanisms gets one test on the fixture.
- The content's calls: the nomadic camp names guard and raider; Lean season's _Ration_ and the rival band's _Fight_ enter raiders; _Make room_ places the camp and enters its count as guards, the first on the camp; the stand-in's camp names the same two scripts, its siege enters raiders — its rules text says the camps close in — and its reinforcement enters guards.
- The specs and tests whose promises the change turns over, adapted and named in the report: the raid's warrior stands beside a camp, not on it, since every camp is guarded from the opening; a spec that counts the chronicle's units counts the player's.

Out:

- The camp spacing. The generator keeps its camps four apart and seven from the centre, a rival band's camp three from any camp; with a radius of 2 a guard can read another camp as its own only on the one tile halfway between two camps, after wandering there. Accepted: a swapped guard still guards a camp. Widening the spacing is a generator change and a line of its own if the balance pass wants it.
- Attacking from the city's tile: the raider attacks nothing from it, as the page says today.
- The enemy's unit kind: guards and raiders are both the camp's warrior. Whether a guard wants a kind of its own is a feel question for the user after this ships.
- The camp's odds and the raid's count are numbers, the balance pass's.

Corner cases decided here:

- A raid entering through a camp emptied by a kill puts its first raider on the camp's tile; it is a raider all the same, since the script is the entry's and never the tile's.
- A camp captured while its guard is out, or a guard rolled beside a camp the player's unit is standing on the turn of its capture, leaves that guard with no camp within its radius: it raids from the next phase.
- A guard entered by the roll acts from the next phase, as any enemy entered during the phase does, so the capture of a camp it was rolled beside goes through if the capturing unit survives the phase.
- Neutrals do not exist in the code; both scripts attack any faction but their own, so they fall under the scripts the day they do.

**Traps:**

- A script's move answers a landing and no generator today; the wander is the first script that draws. The draw goes through the chronicle's generator and nothing else, and a script that draws nothing leaves it as it was: the existing tests that compare the generator across odds read on that. One test holds that the same seed wanders the same and seeds differ.
- The scripts' tests read the closures on the fixture's ground the way `src/content/scripts.test.ts` does today, the fixture's catalogue overridden to name the content's scripts; the fixture's own catalogue keeps its own script, and may name it for both entries. The mechanism tests that read which script a unit entered with — the opening's guards, the roll's on-or-beside, the raid's raiders — need two distinct ids on the camp, overridden the way the roll's odds already are in `src/rules/enemies.test.ts`.
- The guards entered at the opening take the first unit numbers, before the settle's units; enemies act in unit order. `e2e/attack.spec.ts` refuses a run unless the chronicle holds exactly one unit after the warrior's play, and `e2e/camps.spec.ts` asserts the raid's warrior stands on a camp; `e2e/deal.spec.ts` says it wants a camp free to enter on. All three read the guards now.
- The stand-in's camp odds are nought, so on the e2e content every camp holds one guard from the opening and never a second: no stand-in guard ever wanders, and the specs' maps stay still before the raid, as their comments assume.
- The comment above `enteredAround`'s call in the nomadic and stand-in content and the fixture — the first warrior lands on the camp because the placing asks the ground to run to the city and no unit to stand there — stays true and is left standing.
- An attack spends no move points today, so a warrior that kills a guard steps onto the camp the same turn; the next board line changes that and is not pre-empted here.
- The least-health choice was a helper's while the page said nearest; the page now says least health, so the helper is the spec and nothing is reconciled.
- The raid's ground — standable by the camp's unit, the ground running to the city, never the city's tile — is what the roll's "beside" entry draws from, as a raid's does; the roll enters no guard on a camp on ground that runs nowhere, and that is a content defect the catalogue already refuses.
- Nothing on the screen changes: a unit over a building is already drawn, and the scripts have no text.

**Plan:**

1. The catalogue's camp names two scripts and validates both; the fixture, the stand-in and the nomadic content name them, the one existing script for both, and every entry of the camp's unit says which it enters. The tree typechecks and every test passes with today's behaviour.
2. The two scripts in `src/content/scripts.ts`, the one there today becoming the raider, with their tests beside them; the generator threaded through a script's move; the nomadic and stand-in content naming them. The rules tests on the enemy phase pass unchanged but for the promises the new scripts turn over, each named in the report.
3. The rules in `src/rules/chronicle.ts`, `src/rules/enemies.ts` and `src/rules/schedule.ts`: the opening's guards, the roll on every camp on or beside, the raid's raiders, the content's calls in `src/content/nomadic.ts` and `src/content/stand-in.ts`; their tests in `src/rules/enemies.test.ts` and `src/rules/schedule.test.ts` adapted where the promise changed, one new test per mechanism.
4. The specs: `e2e/camps.spec.ts`, `e2e/attack.spec.ts`, `e2e/deal.spec.ts`.
5. The two design pages, the sentences above verbatim.

**Verify:**

```
npm run check
npm test
npm run lint
npx playwright test e2e/camps.spec.ts
npx playwright test e2e/attack.spec.ts
npx playwright test e2e/deal.spec.ts
```
