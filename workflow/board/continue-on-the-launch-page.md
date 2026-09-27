# Continue on the launch page

**Line:** **Continue on the launch page** — every bare boot lands on the launch page, which offers Continue while the save holds a chronicle, reading where it stands and the achievements it has reached; the menu's New chronicle leaves the chronicle standing in its save and opens the page; the address word `continue` opens the chronicle in the save straight and every spec that opened on the bare address opens through it; `e2e/continue.spec.ts` passes.

**Spec:**

- `docs/META.md` → _The loop_ is the design, already written: the launch screen offers Continue while a chronicle is in progress. The launch page stands in for that screen.
- `docs/META.md` → _The save_: the sentence "the game boots on the save, and a reload of a chronicle in progress resumes it where it stood" becomes "the game boots on the save, and a chronicle in progress is continued where it stood".
- `docs/INTERFACE.md` → _The launch page_ becomes, whole:

  > The **launch page** is a stand-in for the meta's launch screen, and the bare address boots on it, whatever the save holds. The page is one row per choice — the age, the region, the deck and the seed — the first of each list chosen until another is pressed, the seed typed in digits or left blank for a fresh one, and **Launch** under the rows, which opens the chronicle on those choices; Enter presses it too. While the save holds a chronicle, **Continue** stands at the head of the page, over the rows, reading where that chronicle stands — the settle phase, or its turn — and under that the achievements it has reached, and opens it where it stood; Launch then ends that chronicle, which pays nothing. The address is the developer's door and the test suite's: one that names a deck opens the chronicle straight, on what else it names and the page's defaults for the rest, a launch like any other; one that names `continue` opens the chronicle the save holds straight, and the boot fails where the save holds none; any other address that names something opens the page with what it names already chosen; and the chronicle screen writes nothing into the address. A chronicle's save keeps the choices it was launched on beside it, and the menu's **New chronicle**, listed over a chronicle alone, leaves the chronicle standing in its save and opens the page on those choices, the seed blank. The launch screen replaces the page; the address stays.

- Player-facing entries, `src/ui/text.ts`:

  | Key                         | Entry               |
  | --------------------------- | ------------------- |
  | `launch.continue`           | `Continue`          |
  | `launch.turn`               | `Turn {turn}`       |
  | `launch.settle-phase`       | `Settle phase`      |
  | `launch.reached`            | `✓ {achievement}`   |
  | `achievement.first-shelter` | `The first shelter` |

  The words a failed boot shows under its title are the error's own and no entry: `the save holds no chronicle to continue`.

**Doc-impact:** `docs/INTERFACE.md` (_The launch page_), `docs/META.md` (_The save_, the one sentence).

**Scope:**

- In: the boot's landing; Continue on the page; the menu's New chronicle opening the page; the address word `continue`; an achievement's name as a text lookup the catalogue's coherence test reads for every achievement of every age; the e2e helper and the specs that boot on the bare address.
- Out: the campaign screen, the menu's Campaign entry and the entry's renaming, which are the next line's; any warning on Launch, which is the Stone Age rung's; the ending's pay.
- Continue reads one line for where the chronicle stands — `launch.settle-phase` while it is on the settle phase, `launch.turn` after — and one `launch.reached` line per achievement reached, in the chronicle's order, none where none is reached.
- Continue is the page's Launch button in shape, the precedent it follows: the accent face at the page's width, taller by the lines it reads. The page is a stand-in; its look is not a fork.
- Continue reads the chronicle the save holds at the moment the page is laid, and opens that one: reached from the menu, it is the chronicle as it stood at the last command, not as the boot read it.
- An ended chronicle in the save gets no code of its own. Until the ending pays, the save can hold one: Continue reads its turn and opens it on its ending screen, as any chronicle. The line that pays takes it out of the save.
- Launch over a chronicle in progress goes through silently and the new chronicle takes its place in the save.
- The menu's New chronicle over a play-out lets go of it as it does today, its tail committing nothing; the save holds what the last command left.
- The page opened from the menu has the chronicle's age, region and deck chosen and the seed blank.
- `continue` is read for its presence with any value that is not blank; named beside `deck`, `age`, `region` or `seed`, `continue` wins and the others are not read.
- Enter presses Launch, never Continue.

**Traps:**

- `src/ui/save-entry.ts` reads the save once and answers that reading ever after; the chronicle scene writes the save after every command without touching the reading. A Continue built on the boot's reading opens a stale chronicle the moment the page is reached from the menu.
- The ui scene reaches into the overlay's and the map's as it is created, and key order is start order: the overlay and the map are launched ahead of the ui scene on every path that opens a chronicle (`docs/PHASER.md` → _Scenes and stacking_, and the comments at `src/main.ts` and the launch page's launch). Opening the page from the menu stops three scenes and starts one; every scene-plugin call is queued.
- The menu scene outlives every chronicle and holds stale handles of a restarted scene: it reaches the ui scene by key at the press (`docs/PHASER.md` → _Across a restart_). The menu's scrim must be down once the page stands; `resetMenu` is what the chronicle screen calls for that, and the page has no such call today.
- The debug console is put back by a new chronicle (`resetConsole`); the page rising from the menu is not a new chronicle.
- A listener left on the game's emitter outlives a stopped scene unless taken off at its shutdown (`whileUp`).
- An object made interactive is hit-tested from the next frame: the spec rests before it presses Continue (`docs/PHASER.md` → _Under a Playwright spec_).
- `e2e/chronicle-screen.ts`'s `openSaved` is what about 130 spec openings go through; it opens through the address word and no spec gains a press.
- The catalogue's coherence test (`src/content/catalogue.test.ts`) is where a missing achievement name is caught; the fixture catalogue's achievements are not the game's and need no entry.

**Plan:**

1. `src/ui/text.ts`, `src/content/catalogue.test.ts`: the five entries and the achievement's name lookup stand, the coherence test reading it for every achievement.
2. `src/ui/save-entry.ts`: the save answers the chronicle it holds as it stands now.
3. `src/main.ts`: the bare address lands on the page; `continue` opens the save's chronicle straight, and fails the boot where there is none.
4. `src/ui/launch-page.ts`: Continue stands at the head of the page while the save holds a chronicle, and opens it.
5. `src/ui/menu.ts`, `src/ui/menu-scene.ts`, `src/ui/chronicle-scene.ts`: New chronicle leaves the chronicle in its save and opens the page on its choices.
6. `e2e/chronicle-screen.ts`, `e2e/resume.spec.ts`, `e2e/boot.spec.ts`, `e2e/menu.spec.ts`: the helper opens through `continue`; the resume specs resume through it; the boot and menu specs assert the page where they asserted a fresh chronicle, and a new chronicle through Launch. No test is deleted: each keeps the rule it asserted, reached the new way, and one whose rule is gone is reported, not dropped.
7. `e2e/continue.spec.ts`: on a planted save the bare address shows Continue reading the chronicle's turn, and the press opens that chronicle; on a planted save still on its settle phase it reads the settle phase; with no save no Continue stands; `continue` on no save fails the boot. Every reading comes from the rules and the text table.
8. `docs/INTERFACE.md`, `docs/META.md`: the sentences above.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/continue.spec.ts`. CI proves on the push: `boot`, `menu`, `resume`, `failed-boot`, and every spec that opens through `openSaved` — `attack`, `broken-motion`, `browse`, `camps`, `capstone`, `city-mode`, `console`, `controls`, `deal`, `fall`, `fog`, `hover`, `inspect`, `landing`, `map`, `move`, `pointer-sweep`, `press`, `reference`, `refuse`, `rivers`, `settle`, `victory`, `window`, `worker-instants`, `yields`.
