# A console line enters a unit

**Line:** A console line enters a unit — the chronicle screen's console holds `unit <kind> [<script>]`, which enters that unit on the selected tile through the rules' own enter and chart and reopens the screen on the chronicle that leaves, kept as the save, the veils and the lines standing; the line's reading is proven in Vitest and the screen by `e2e/console.spec.ts`. Doc-impact: `docs/INTERFACE.md`.

**Spec:** `docs/INTERFACE.md`, _The debug console_.

The first paragraph's sentence "An entry is one word and Enter, with a number after it where the entry takes one, and it is answered in one line" becomes "An entry is one word and Enter, with what it takes after it where it takes anything, and it is answered in one line". Its last sentence "The console binds no key of the player's and stands in no Controls window, and a new chronicle closes it and puts every entry back where it began." becomes "The console binds no key of the player's and stands in no Controls window; a new chronicle closes it and puts every entry back where it began, and a chronicle reopened with a unit entered closes it and leaves the veils and the lines as they stand."

A new paragraph after the `seed` paragraph:

> **`unit`** enters a unit on the selected tile, and the chronicle screen alone holds it. After the word comes the unit's kind, and after that the script the unit follows where it is an enemy: a line naming no script enters a unit of the player's. The unit enters as every unit card and every camp enters one — ashore, its move and its action full, an enemy unprepared — on the chronicle as it stands, what it sees is charted as a command charts it, and the chronicle screen reopens on that chronicle, kept as the save. The line is refused in one line and enters nothing where the chronicle has ended, where the selection is not a tile, where the content holds no such kind or no such script, and where the tile refuses the unit as it would a settle card's: a kind that does not stand on it, or a unit standing on it already.

The console's text, `src/ui/text.ts`, in the `console.` group, each written out:

| Key                        | Text                        |
| -------------------------- | --------------------------- |
| `console.unit-takes`       | `unit: <kind> [<script>]`   |
| `console.ended`            | `the chronicle has ended`   |
| `console.no-tile-selected` | `no tile selected`          |
| `console.no-unit-kind`     | `no such unit kind: {kind}` |
| `console.no-script`        | `no such script: {script}`  |

The two tile refusals are answered in the standing refusal texts, `refusal.wrong-terrain` ("Wrong terrain") and `refusal.unit-standing` ("A unit already stands here"), the same two a settle card aimed at the tile would raise. A line that enters a unit answers nothing: the screen reopening is the answer, as the seed's launch is.

**Doc-impact:** `docs/INTERFACE.md`, the sentences above.

**Scope:**

- In: the `unit` entry on the chronicle screen; the campaign, collection and launch screens hold no `unit` and answer it `no such entry`, as they answer every entry they do not hold. The faction is read off the line: a script named is an enemy's, none is the player's. The script word is a script id of the content's own scripts table, the one an enemy carries; the camp's names for its scripts coincide with the ids on both ages today, and the console reads the id.
- In: the order of the refusals, one line each, the first that holds: the chronicle has ended; the line is `unit` alone or holds more than a kind and a script after the word (`console.unit-takes`); the selection is not a tile, a card selected or nothing (`console.no-tile-selected`); the kind is none the content holds; the script is none the content holds; the tile refuses the kind as a settle card's would, the terrain first and then the unit standing. Spaces around the words are trimmed as every entry's are.
- In: the entry enters the unit through the rules' one enter, charts what is in sight through the rules' one charting, keeps the chronicle as the save as a command's outcome is kept, and reopens the chronicle screen on it as the boot's `continue` and the launch screen's resume open it on a chronicle standing. The reopen closes the console and leaves the lines it ran and the veils as they stand, the map drawn under those veils from its first frame; a new chronicle, launched from the launch screen or by `seed`, still closes it and puts every entry back where it began.
- In: the entry works whatever state the screen is in, a play-out in flight let go of as the seed entry lets go of it, the selection and the inspection dropped with the screen.
- Out: a unit entered embarked, a tile typed as coordinates, a faction word, any stat or counter authored on the unit beyond what its kind gives, and any change to the specs' and the fixtures' own planting, which stay as they are.
- Corner cases decided here: an ended chronicle is refused before anything else is read, since keeping it would pay it into the campaign a second time. An enemy entered during the player's turn acts in that turn's enemy phase, standing when the phase begins, as the rules say of every enemy standing. A unit of the player's entered on the city's tile and an enemy entered on it are both allowed where the tile is free. The chronicle the save then holds is one its seed does not reproduce; nothing forbids it, the console being the developer's door.
- Reconcile: the two tile refusals go through the standing refusals and their texts; the reopen goes through the standing door a chronicle is resumed by, as it is; the specs' and the fixtures' enter-then-chart helpers stay apart, being tests' own that nothing outside a test imports, and the entry composes the two rules calls itself.

**Traps:**

- `unitKind` (`src/rules/catalogue.ts`) refuses an id the content does not hold by throwing, and play stops: the kind is checked against the content's units before the enter is asked for. `entered` stores an enemy's script string unread; an id the content's scripts table does not hold would be met at the enemy phase, so the script is checked against that table before the enter.
- `keepChronicle` (`src/ui/save-entry.ts`) pays an ended chronicle into the campaign and drops it from the save: the ended refusal stands first.
- `resetConsole` runs in the chronicle scene's `create` on every start, and the map view is created with both veils on: a reopen on a chronicle continued must neither reset the console nor lose the standing veils, which the new map view has to be handed, while a new chronicle resets everything as today. Which call distinguishes the two is the implementer's.
- The console scene outlives every screen and holds closures of the screen that offered them (`docs/PHASER.md`, _Across a restart_): `offerEntries` replaces them on the new screen's `create`, and its `SHUTDOWN` clears only its own.
- `openChronicle` from a scene's plugin launches the map and starts the chronicle screen, the start of a running scene shutting it down first (`docs/PHASER.md`, _Scenes and stacking_); `launchOn` lets go of the play-out in flight before it, and the entry does the same.
- `charted` (`src/rules/sight.ts`) hands back the very chronicle it was given where nothing new is in sight: the save is kept and the screen reopened all the same.
- The refusal texts the tile answers in are `refusal.wrong-terrain` and `refusal.unit-standing`; the refusal names are `TileBlock` members in `src/rules/state.ts`, and `entersOn` (`src/rules/cards.ts`) composes the same two checks for a settle card.
- The spec selects a tile by clicking where it stands and rests before it (`docs/PHASER.md`, _Under a Playwright spec_); a tile beside the city is charted on the opening and selectable under both veils.
- Comments are for traps only; the brief says so outright.

**Plan:**

1. `src/ui/text.ts`: the five `console.` entries above stand.
2. `src/ui/console-line.ts` and `src/ui/console-line.test.ts`: the `unit` line is read — the word, the kind, the script where one stands — and refused in the order above, the screen under the console answering what reads the content, the chronicle and the selection; the test covers each refusal and a line that enters, as the seed's are covered, on a screen fixture of its own.
3. `src/ui/debug-console.ts`: the screen's holding offers the unit entry beside `seed`; a reopen on a chronicle continued keeps the lines and the veils and hands the veils to the map view now rising, a new chronicle resetting as today.
4. `src/ui/chronicle-scene.ts`: the chronicle screen offers the entry — reads the selection, checks the kind, the script and the tile's refusal against the content and the chronicle standing, enters and charts, keeps the save, lets go and reopens on the chronicle that leaves. The campaign, collection and launch screens offer none.
5. `docs/INTERFACE.md`: the Spec's sentences.
6. `e2e/console.spec.ts`: the proof below.
7. `workflow/BOARD.md`: the line deleted; `workflow/board/console-unit.md` deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/console.spec.ts`, with one new test: the screen opened on a saved chronicle, the fog veil taken off, a free tile beside the city the warrior kind stands on selected by a click, `unit warrior` with the camp's raider script id entered; the chronicle on screen and the chronicle the save holds both equal the oracle, the opened chronicle with that unit entered and charted through the rules (`unitEntered` in `e2e/chronicle-screen.ts` composes it); the console is closed, and opened again reads the lines it ran before and the fog veil still off, no fog mark on the map. In the same test, before the enter: `unit` alone answers `console.unit-takes`, `unit warrior` with nothing selected answers `console.no-tile-selected`, `unit` with the city's tile selected answers `refusal.unit-standing`. The ended-chronicle refusal and the unknown kind and script are the Vitest's.
- CI proves on the push, listed for the hand-back and never run locally: `e2e/console.spec.ts`, and the specs that run an entry at the console — `e2e/fog.spec.ts`, `e2e/camps.spec.ts`, `e2e/city-mode.spec.ts`.
