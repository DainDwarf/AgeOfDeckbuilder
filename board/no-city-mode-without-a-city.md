# No city mode without a city

**Line:** city mode is not entered while the city stands nowhere: on turn 0 before the settle the city key and the culture and population readings do nothing, and once the city stands, on turn 0 or any turn after, each of them enters it as today.

**Spec:** `docs/CHRONICLE.md` → _The chronicle screen_, the **On turn 0** paragraph. Append this sentence to it, after "a settle card is aimed as any card aimed at a tile.":

> City mode is not entered while the city stands nowhere: the city key and the two readings that enter it do nothing.

The rule, as the spec reads it: the guard is the city standing, never the turn. After the settle plays out on turn 0 the city stands, and city mode opens on that same turn — the player may unassign the city's inhabitant or, once free claims exist, move inhabitants between claimed tiles before ending turn 0. A refused press says nothing: the precedent is the end-turn button, dead until the city stands without a word, and the unit that can do nothing coming home without a word. No player-facing text is added.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

- In: the guard on entering city mode; the docs sentence; one e2e test.
- Out: any change to how the mode is left, to what the readings look like — they show no hand cursor today and take none away — to the rules, and to the second-click entry on the city's tile, which already needs a city.
- Corner cases decided here: the back key on turn 0 before the settle finds no city mode to leave and raises the menu, as today; a window standing over the chronicle screen keeps swallowing the city key before the guard is reached, as today; a refused press leaves the selection, the inspection and a card being aimed exactly as they stand — nothing is let go of, since the mode was never entered.

**Traps:**

- The three doors into city mode — the city key, the bar's culture and population readings, the second left click on the city's own tile — all pass through the one function on the chronicle screen that raises the mode, in `src/ui/chronicle-scene.ts`. The guard goes there and nowhere else; a check at the key and another at the bar would be two enforcements of one invariant.
- That function lets go of what is pending before it turns the mode on. The guard has to come before that: a refused press changes nothing on screen.
- The chronicle's `city` field is optional and is the one fact the guard reads, at the moment of the press, from the chronicle the screen currently holds. The end-turn button tracks the same fact at render to toggle its interactivity because it has a surface to deaden; the mode has none, so nothing is tracked and no render hook is added.
- The rules already answer nothing for every tile while the city holds none: `tileRefusal` in `src/rules/city.ts` reads the held tiles, and the culture threshold is never priced on a tile with no refusal. Nothing in `src/rules/` changes, and no Vitest test is added.
- `inCityMode` in `e2e/city-mode.spec.ts` reads both marks, the frame and the chip, and asserts they agree; the new test uses it. `openOnCapstone` and `settle` in `e2e/chronicle-screen.ts` open on turn 0 unsettled and settle by hand; `open` settles and ends turn 0, so it is the wrong opener here. The capstone window is closed by clicking its card, never by the back key.
- The readings on the bar are pressed through their named zones, `reading-culture` and `reading-population`, with `click`.

**Plan:**

1. `src/ui/chronicle-scene.ts`: the function that raises city mode returns before anything else when the chronicle's city stands nowhere.
2. `e2e/city-mode.spec.ts`: one test — open on the capstone, close its window, on turn 0 before the settle press the city key, then culture, then population, each followed by a frame or two and `inCityMode` false throughout; then `settle` on the centre tile and press the city key: `inCityMode` true. The end of turn `settle` plays is one turn in `budget`.
3. `docs/CHRONICLE.md` as written under _Spec_.

**Verify:** `npm run check`, `npm test`, `npm run lint`; `npx playwright test e2e/city-mode.spec.ts`.
