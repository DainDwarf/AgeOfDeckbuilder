# The throwaway selection page

**Line:** the game boots on a page choosing the content, a region, a schedule, a deck and a seed and opening the chronicle on them; an address that names a deck opens the chronicle straight and any other opens the page; the rules never learn the word scenario.

**Spec:** `docs/INTERFACE.md`, a new section between _The menu_ and _The debug console_, written out:

> ## The launch page 🔧
>
> The game boots on the **launch page**, a stand-in for the meta's launch screen: one row per choice — the content, the region, the schedule, the deck and the seed — the first of each list chosen until another is pressed, the seed typed in digits or left blank for a fresh one, and **Launch** under the rows, which opens the chronicle on those choices; Enter presses it too. The address is the developer's door and the test suite's: one that names a deck opens the chronicle straight, on what else it names and the page's defaults for the rest, and any other opens the page with what it names already chosen. The chronicle screen writes the choices and the seed it begins on into the address, a new chronicle included, so a reload replays the chronicle on screen and the bare address is how the page is reached again. The launch screen replaces the page; the address stays.

The player-facing entries, in `src/ui/text.ts`, written out:

- `launch.title`: `Launch a chronicle`
- `launch.content`: `Content`
- `launch.region`: `Region`
- `launch.schedule`: `Schedule`
- `launch.deck`: `Deck`
- `launch.seed`: `Seed`
- `launch.fresh`: `Fresh` — what the seed slot reads while nothing is typed
- `launch.button`: `Launch`

An option's face reads its id raw — `PH_Deck`, `PH_Region`, `PH_Schedule` — and the content's face reads the catalogue's `version`, `stand-in`. No entry is added for an option: every one is a stand-in the page dies with.

The run skill, `.claude/skills/run/SKILL.md`, step 5, replaced whole:

> 5. **Say what the address opens.** The bare address boots the launch page. `?deck=PH_Deck` (a deck id from `src/content/stand-in.ts`) opens a chronicle straight; `&seed=<integer>` replays one, and `&region=`, `&schedule=` and `&content=` name the rest, the page's defaults standing in for what is not named.

**Doc-impact:** `docs/INTERFACE.md`; `.claude/skills/run/SKILL.md`.

**Scope:**

- In: the launch page as a Phaser scene; the boot deciding between the page and the chronicle by whether the address names a deck; a list of every catalogue the game ships, one entry today; the chronicle screen writing the address on every chronicle it begins; the text entries; the docs section; the run skill; the boot spec rewritten.
- Out: the menu — **New chronicle** keeps relaunching the same content, region, schedule and deck on a fresh seed straight into the chronicle, the map dealt and the timeline rolled anew from it, as `launched` already does; a way back to the page from the chronicle screen; any bundle of choices under a name — five independent choices and no scenario type, in the rules or the UI; any look beyond the Controls window's, which is the precedent: a label on the left, pressable faces on the right, the chosen face in the accent and the others in the panel fill, two buttons' worth of room under the rows for the one button; any glossary term.
- The content is the fifth choice, sized by the user for the Nomadic Age's catalogue that v0.0.4 brings: the page lists every catalogue the game ships, one today. Changing the content on the page resets the region, the schedule and the deck to the new catalogue's firsts, since the old ids may not be held.
- Defaults, the same on both doors: the first catalogue of the list; the first key of its regions, of its schedules and of its decks; a fresh seed. The stand-in lists `PH_Region` and `PH_Schedule` first, so the address door opens exactly what it opens today.
- Corner cases decided here: an address value the catalogue does not hold stops the boot on either door, through the catalogue's own lookups, as a missing deck stops it today; a seed on the address that is not an integer is a fresh one, as today; the seed slot takes digits alone, at most ten, and Backspace, and shows a seed the address handed it, negative included, since the fresh draw may be negative; the chronicle's `seed` field is what the address is written with, not the int32 the generator folds it to; the back key, the console key and every other key do nothing on the page; the page has no Menu button and no scrim.

**Traps:**

- `src/rules/` never imports `src/content/`, and `src/ui/` only renders. The list of catalogues is content, in `src/content/`, and the page and the boot read it; nothing in `src/rules/` learns of it. `catalogued` already refuses a catalogue that does not hold together, so the list is validated by being built.
- The chronicle scene builds its chronicle in its constructor from constructor arguments, and **New chronicle** restarts the scene with `scene.restart()`, which keeps the instance and its fields. Whatever way the page's choices reach the chronicle scene — `scene.start` with data read in `init`, or the scene constructed once with the choices — the restart must still find them; a `restart()` with no data keeps the data the scene was last started with.
- `begin` in `src/ui/chronicle-scene.ts` is the one place entropy enters the game, and the one place the address is written: the page never draws a seed, it hands `undefined` for a blank slot as the address door does today.
- `main.ts` today throws `no deck on the address` before Phaser starts. That throw goes: a bare address is the page.
- `applyDesignSpace` gives a scene its two layers and cameras and moves every object made after it onto the UI layer; the page uses it for the UI surface and the render factor, and `onResize` and `whileUp` unsubscribe at the scene's shutdown, so switching scenes leaves no listener behind. `readsKeyboard` in `src/ui/keys.ts` is how the debug console takes keys; the seed slot takes digits the same way, and every other key falls through to nothing.
- `named` and `counted` in `e2e/chronicle-screen.ts` search the layers of the scene keyed `chronicle` alone, and `onScreen` and `click` go through them. The page's spec presses `launch-button`, so both search every scene that is running instead; `openOnCapstone` still waits on `scene.isActive('chronicle')`, and no other helper changes.
- Named objects the spec reads: the root `launch`; one face per option, `launch-content-<version>`, `launch-region-<id>`, `launch-schedule-<id>`, `launch-deck-<id>`; the slot `launch-seed`; the button `launch-button`. A chosen face is told apart by its data, `chosen` true or false, not by its colour.
- `e2e/boot.spec.ts` is the spec, and its first test is what CI asks first of every push: it must still reach the chronicle on the address door and log nothing.

**Plan:**

1. `src/content/catalogues.ts`: the list of every catalogue the game ships, `[STAND_IN]`, and the lookup of one by its version, refused when none holds it.
2. `src/ui/launch-page.ts`: the scene keyed `launch`: the title, the five rows, the button; the choices it opens with are what the boot hands it; Launch and Enter start the chronicle scene on the choices, the seed `undefined` while the slot is blank.
3. `src/ui/chronicle-scene.ts`: takes the content, the region, the schedule, the deck and the seed from whoever starts it; `begin` writes the five choices and the chronicle's seed into the address with `history.replaceState`, on the boot's chronicle and on every new one.
4. `src/main.ts`: reads content, region, schedule, deck and seed off the address, resolves each named one through the catalogue's lookups, fills the rest with the defaults; registers both scenes and starts the chronicle when a deck is named, the page otherwise.
5. `src/ui/text.ts`: the entries under _Spec_.
6. `e2e/chronicle-screen.ts`: `named` and `counted` search every running scene.
7. `e2e/boot.spec.ts`: three tests. The address door as today, `?deck=PH_Deck` reaching the chronicle and logging nothing. The bare address booting the page, `launch` standing and `chronicle` not active, and logging nothing. The page's Launch pressed on its defaults reaching the chronicle, whose `seed` then equals the `seed` on `page.url()`, whose deck's cards are `PH_Deck`'s, and whose `content` is `stand-in`; then `menu-new-chronicle` pressed and the address's seed following the fresh chronicle's.
8. `docs/INTERFACE.md` and `.claude/skills/run/SKILL.md` as written under _Spec_.

**Verify:** `npm run fmt`, `npm run check`, `npm test`, `npm run lint`; `npx playwright test e2e/boot.spec.ts` and `npx playwright test e2e/menu.spec.ts`, the second because New chronicle now writes the address.
