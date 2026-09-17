# Raids enter as one group

**Line:** **Raids enter as one group** — an answer that spawns enemies enters them together through one door, a standing camp likelier by far or a tile of the disc's outer ring, on the door's tile and ring by ring around it, and the outer ring stays open when every camp is captured: rules tests show a raid of three on a camp's tile and the two nearest free tiles, a raid around a camp whose own tile is taken, a raid on the outer ring when the door drawn is the ring, a raid on the outer ring of a chronicle with no camp standing, and no enemy ever entering on the city's tile; Ration and the stand-in's raids go through it and the old per-enemy camp draw is gone; the answers read `A raid of {warriors} enters the map`; `CHRONICLE.md` → Events and the capstone says so in place of the sentences it reverses.

**Spec:** [`docs/CHRONICLE.md`](../docs/CHRONICLE.md) → _The rules_ → _Events and the capstone_, the paragraph **Enemies enter from camps.** Three edits inside it, everything else in the paragraph kept as written — the camp's own roll at every enemy phase, the default script, the capture, the rewards.

1. The sentence

   ```
   An event that spawns enemies draws, for each of them, a camp whose tile is free, seeded, and the enemy enters on it; with no camp's tile free nothing more enters.
   ```

   is replaced by

   ```
   An event that spawns enemies enters them together, as one raid through one door, drawn seeded: a camp still standing, likelier by far, or a tile of the disc's outer ring that the raid's unit stands on and the ground runs to the city from; the odds between the two are content 🔧. The first enemy enters on the door's tile where it is free, and each one after on the nearest free tile it stands on that the ground runs to the city from, ring by ring around the door, seeded among tiles equally near, and never on the city's tile; a tile the city holds is entered like any other, and the enemy on it occupies it. With no camp standing the outer ring is the only door, so an event's raid always enters.
   ```

2. In the sentence on the captured camp, `so it spawns nothing again, and no raid enters a chronicle whose every camp is captured.` is replaced by

   ```
   so it spawns nothing again and is no raid's door; the outer ring stays open, so capturing every camp ends the camps' own warriors and never the events' raids. A chronicle whose every camp is captured taking no raid was rejected: an event disarmed for the rest of the chronicle is no longer a problem.
   ```

3. The closing rejection `Spawning enemies on any tile out of sight was rejected: a raid out of a hollow that turns out empty reads as nothing.` is replaced by

   ```
   Spawning enemies on any tile out of sight was rejected: a raid out of a hollow that turns out empty reads as nothing; the outer ring is the edge of the map, never a hollow. Each enemy of a raid drawing a camp of its own was rejected: a raid scattered over the map arrives one enemy at a time and reads as no raid.
   ```

Player-facing sentences, `src/ui/text.ts`: `answer-rules.ration`, `answer-rules.PH_Defiance` and `answer-rules.PH_Raid` all become `A raid of {warriors} enters the map`. No other entry is foreseen.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

- In: the door draw and the group entering around a tile, in `src/rules/`; the door odds as a number of the catalogue's `camp` content, validated like the camp's own odds; every caller of the old raid moved onto the new one and the old per-enemy camp draw deleted; the three text entries; the rules tests; the paragraph.
- Out: the camp's own roll at the enemy phase — one warrior on its own free tile, untouched; `reinforced` and `besieged`, which place their units their own way; any announcement of where a raid entered (none: the player learns a raid when it is seen); the glossary (no term is added — "raid" already stands on the cards and the age page, "door" is this dossier's word and stays out of the docs' vocabulary beyond the sentences above, "raider" stays forbidden); the rival band event itself, which is the next line and calls the group-entering half with its own camp's tile.
- Decided here:
  - **The door is any standing camp**, a unit on its tile or not; a taken tile only means the raid enters around it.
  - **The draw is two steps**: camp or ring by the odds, then which one, uniformly, seeded. Where the side drawn holds no door — no camp standing, or no outer-ring tile qualifies — the other side is the door without a further roll of the odds; where neither holds one, nothing enters and nothing more is drawn.
  - **The odds are 0.8 for a camp in the Nomadic catalogue** 🔧, tuning. **The stand-in and the rules fixture name 1** — always a camp while one stands — so the e2e suite and the existing rules tests keep reading a raid on the camps; the tests that show the ring override the odds the way `enemies.test.ts` already overrides the camp's roll.
  - **An outer-ring tile qualifies** when the raid's unit can stand on it, the ground runs from it to the city, and it is not the city's tile. A unit standing on it does not disqualify it: the raid enters around it, as around a taken camp.
  - **A tile around the door qualifies** when the unit can stand on it, no unit stands on it, the ground runs from it to the city, and it is not the city's tile. A camp's tile, a held tile, a tile with an improvement all qualify.
  - **A raid larger than the tiles that qualify enters what it can.**
  - **The raid's unit and script are the camp's**, from the ring as from a camp.
  - **A raid on a city that stands nowhere is refused**, as `besieged` refuses it: no event lands on turn 0.

**Traps:**

- The chronicle holds no radius and no region: the outer ring is read off `chronicle.tiles` — the tiles farthest from the disc's centre, or those with fewer than six neighbours on the map. Which is the implementer's.
- "The ground runs to the city from" already has an owner: `besieged` in `src/rules/schedule.ts` reads it off `pathCosts` with the `whole-map` walk and a blocker that blocks nothing, reading only which tiles were reached. Use the same reading; do not let standing units block it.
- Whether a unit can stand on a tile already has an owner too: the settle cards that enter a unit (`entersOn` in `src/rules/cards.ts`) refuse a tile the unit cannot stand on. One reading, not a second.
- `src/rules/enemies.test.ts` — _a chronicle whose every camp is captured takes no raider at all_ asserts the rule this line reverses: it is rewritten to a raid entering on the outer ring, not kept passing. _a captured camp is silent: the raid enters on a camp still standing_ should hold at odds of 1.
- `src/rules/schedule.test.ts` compares two walks of one seed to show that nothing the player does steps the timeline's generator; the raid draws from the chronicle's generator, never the timeline's. Any draw added here stays on `chronicle.rng`.
- `src/rules/fixtures.ts` re-exports `raided` and its fixture catalogue lands it; `src/content/stand-in.ts` lands it twice; `src/content/nomadic.ts` once. All three catalogues must name the new odds or `catalogued` refuses them.
- `e2e/camps.spec.ts` — _the raid's warrior stands on one_ — must pass untouched at the stand-in's odds of 1. If it does not, that is a deviation to report, not a spec to bend.
- An enemy entering in sight on a tile that is no camp has never happened on the screen. Nothing in this line makes it likely on the stand-in, but if the play-out is seen to mishandle it, report it; do not fix the UI inside this line.

**Plan:**

1. `src/rules/catalogue.ts` — the door odds beside the camp's own odds, refused outside 0–1 by `catalogued` where the camp's odds are; the three catalogues name it (Nomadic 0.8, stand-in 1, fixture 1).
2. `src/rules/enemies.ts` — two functions. One enters a group of the camp's unit on and around a given tile and owns the ring-by-ring invariant: nearest first, seeded among equals, never the city's tile, never a taken tile, only tiles the ground runs to the city from. The other draws the door — camp or outer ring by the odds, then which — and hands it to the first. The first is exported on its own: the next line's content calls it with a tile it placed. `enteredFromCamp` is deleted; `enteredOnCamp` stays for the camp's own roll, `reinforced` and `besieged`.
3. `src/rules/schedule.ts` — `raided` becomes the door draw then the group, keeping its name and signature so the three catalogues' answers need no edit beyond the odds; its comment says what it now does.
4. `src/ui/text.ts` — the three entries.
5. Tests, in `src/rules/enemies.test.ts`: the five cases of the done-condition, and the captured-camps test rewritten.
6. `docs/CHRONICLE.md` — the three edits above.

**Verify:** `npm run check`, `npm test`, `npm run lint`, and `npx playwright test e2e/camps.spec.ts`.
