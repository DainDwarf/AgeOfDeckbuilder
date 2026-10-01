# The Stone Age is launchable

**Line:** **The Stone Age is launchable** — a second age in the catalogue, unlocked by Settlement and launched from the launch screen: its temperate region a copy of the Nomadic one, its schedule dealing the Nomadic events and capstone on a spacing and a window of its own, and no achievement yet. Done when the catalogue holds a second age after the Nomadic one that Settlement unlocks, the coherence tests pass over it, `e2e/launch.spec.ts` proves that a campaign that has learned Settlement opens the launch screen on it and launches a chronicle of it, and `docs/ages/NOMADIC.md` says Settlement unlocks it.

**Spec:** The mechanism is standing design and this line changes none of it: `docs/META.md` _The campaign_ (an age's victory's technology is the age after it), `docs/META-SCREENS.md` _The campaign screen_ (a ground per age, the technology that unlocks the next age on the border, the plate's reward reading the age) and _The launch screen_ (one segment per age, an age not reached greyed and reading ??? and answering no press, the screen opening on the furthest age reached, the region kept where the age holds one of its name), `docs/DESIGN.md` _Launching a chronicle_ (earlier ages stay playable).

- One sentence changes, in `docs/ages/NOMADIC.md` _The achievement_: "Its technology is **Settlement**, and it pays influence." becomes "Its technology is **Settlement**, which unlocks the Stone Age, and it pays influence."
- One player-facing entry is added: the age's name, `Stone Age`. Settlement's plate reads `The Stone Age` under Reward through the entry that stands for an age unlocked; no other entry is added or reworded.

**Doc-impact:** `docs/ages/NOMADIC.md`. No Stone Age page: everything the age holds after this line is a stand-in, which no page names; the region line opens `docs/ages/STONE.md`, and the board says so on that line.

**Scope:**

- In: the Stone Age as the second age of the catalogue, after the Nomadic one; Settlement unlocking it; its name; its ground's colour; the tree spec's assertions that a second age makes untrue; the launch spec that proves the line; the `NOMADIC.md` sentence.
- The age's content is the Nomadic Age's, read where it stands and never typed a second time: its regions, its camp, the events its schedule deals with their weights, and its capstone. Its own: a spacing of 6 to 9 turns, a capstone window of 26 to 34 turns (the user's numbers, to be felt in play), no achievement, and a base price equal to the Nomadic one, which nothing reads while the age brings no card. The age brings nothing to the shared tables.
- The ground's colour is grey, the user's choice from shots of the game: an entry of its own for the Stone Age's ground, holding the value the flint feature holds today, written under its own name and tied to no other entry.
- Decided with the user, not defects: a Stone Age chronicle reads the Nomadic texts that name the Nomadic Age — the Shelter card's rules, the capstone's two lores, the victory line — until the schedule rung replaces the capstone; a Stone Age chronicle reaches no achievement and its ending pays nothing; the Stone Age's ground stands empty on the tree; a campaign that learned Settlement before this line reaches the Stone Age at its next boot, with nothing migrated.
- Out: a region, a camp, an event, a capstone or a card of the age's own; any achievement or technology of the age; the ending's pay; `docs/ages/STONE.md`; any change to `src/rules/`; a rules test, since the mechanisms are proven on the fixture's several ages and real content gets the coherence checks alone; the content version, which stays as it is, since nothing a Nomadic chronicle replays on changes and a new version would drop every chronicle in progress.
- Reconcile: every job the line names is done by what stands, and goes through it as it is — the unlock through a technology's age, the grounds and the arrow through the catalogue's ages, the stand-in content through the Nomadic tables. Nothing is reshaped and nothing stays apart.

**Traps:**

- The catalogue refuses, when it is built, an age after the first that no technology unlocks, and a technology that unlocks an age other than the one after its own: the slice and Settlement's unlock land together, the slices in the order of history.
- The merge refuses an id two slices bring to one table. The Stone Age's slice brings nothing; what it reads of the Nomadic Age is in what an age owns, which is per age, and the capstone's id, which names a shared table.
- The coherence tests of `src/content/catalogue.test.ts` walk every age: they refuse an age with no name or no ground colour, and need nothing else of this one. Tried on a throwaway edit at intake: with the slice, the unlock, the name and the colour in, `npm run check` and all 660 tests passed unchanged.
- `src/ui/look.ts` keeps one entry per meaning: the new ground's value is written as a literal under the age's id, never read from the feature's entry it agrees with today.
- Every plate is as tall as the tallest: Settlement's reward now reads two lines, the age and the influence, so the plates grow by one line. Nothing to do; a spec that reads the reward's lines already reads the age's.
- `e2e/tree.spec.ts` asserts today that the first age's technology stands inside its age's ground. With a second age that plate stands on the border, which is the design: the assertion becomes the border falling inside the plate's span, the first ground ending where the next begins. Its last test reads the tree's right end off the first age's ground; the tree now ends on the last age's.
- `e2e/menu.spec.ts` holds the reading of a launch option's selection; the launch spec needs the same reading, and a second copy of it is a defect.
- `wonCampaign` in `e2e/chronicle-screen.ts` is the campaign a Nomadic victory has paid into, built through the rules' own payment: the launch spec plants it and plays no victory on screen. `firstsOf` and everything built on it stay on the first age.
- The spec's oracle is the rules': the age is the one Settlement's technology unlocks, the chronicle launched is compared with the one the rules launch on that age, that region, the campaign's civilization and the seed the screen drew, with the campaign's technologies learned. No age id is typed in a spec.
- An age not reached stands on the arrow as an object named for it that answers no press; an age reached is an option like any other. A press and a reading follow a rest, `docs/PHASER.md` _Under a Playwright spec_.

**Plan:**

1. `src/content/`: a module for the Stone Age beside the Nomadic one, the Nomadic module giving it what it reads and Settlement unlocking it, and `catalogue.ts` merging the two in the order of history; with it `src/ui/text.ts` and `src/ui/look.ts`, the age's name and its ground's colour. Leaves the catalogue building on two ages and `npm run check` and `npm test` green.
2. `e2e/tree.spec.ts`: the two assertions the second age makes untrue, as the Traps say. Leaves the tree's spec true of a tree of two grounds.
3. `e2e/launch.spec.ts`: on a new campaign the second age stands unknown on the arrow, and a press on it leaves the first age selected; on a campaign that has learned Settlement the launch screen opens on the second age with its first region, a press on the first age selects it and keeps the region, a press on the second selects it again, and Launch opens a chronicle of the second age equal to the one the rules launch. Leaves the line proven on screen.
4. `docs/ages/NOMADIC.md`: the sentence of the Spec. `workflow/BOARD.md`: the line deleted, and this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/launch.spec.ts`. CI proves on the push: `e2e/tree.spec.ts`, changed by this line, and the specs that walk the launch screen or boot on a campaign that has reached two ages — `e2e/menu.spec.ts`, `e2e/boot.spec.ts`, `e2e/console.spec.ts`, `e2e/continue.spec.ts`, `e2e/campaign.spec.ts`, `e2e/ending.spec.ts`, `e2e/victory.spec.ts`, `e2e/collection.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/manage-save.spec.ts`.
