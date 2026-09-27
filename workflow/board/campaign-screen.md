# The campaign screen

**Line:** **The campaign screen** — the bare address boots on the campaign screen, on the save's campaign or a new one; the campaign screen and the launch page wear the navbar — the game's name, Campaign and Chronicle, the screen standing sunk in a well — and the bar reading the influence; Chronicle opens the launch page, the back key there opens the campaign screen; the menu lists Campaign over a chronicle and its ending screen and no New chronicle, and Campaign leaves the chronicle standing in its save; `e2e/campaign.spec.ts` passes.

**Spec:**

`docs/META.md` → _The loop_, the first two paragraphs, which become:

> The game boots on the **campaign screen**, the home. From it a chronicle is launched through the **launch screen**, played on the chronicle screen, and ended on its ending screen, whose way out is the campaign screen again; the **collection screen** is reached as the other two are. Four screens, and each carries the Menu button and answers the presses as every screen does.
>
> Every screen of the meta — the campaign screen, the launch screen, the collection screen — wears the **navbar**, which opens the others — **Campaign**, **Chronicle**, which opens the launch screen, and **Collection** — and the bar, which reads the influence. The campaign screen shows the campaign: the technology tree and the civilization. The launch screen offers the four choices of a launch and **Launch** under them, which opens the chronicle on its settle phase, and while a chronicle is in progress **Continue**, reading the turn it stands on and the achievements it has reached, which opens it where it stood. The collection screen is where the deck is edited and influence spent. The ending screen reads the outcome and then what the chronicle paid: the influence, and the achievements reached.

`docs/INTERFACE.md`:

- The head's summary gains "the navbar and the bar" after "the keys and how they are rebound".
- _The menu_, first paragraph, last sentence becomes: "The **Menu** button stands on every screen and opens the menu over whatever stands; **Campaign** is listed over a chronicle and its ending screen, and nowhere else."
- A new section, between _The menu_ and _The launch page_:

> ## The navbar and the bar ✅
>
> Every screen of the meta wears the same two things, and the chronicle screen wears neither. The **navbar** is a panel down the left edge, the whole height of the screen: the game's name at its head, on two lines, and under it one button per screen of the meta. The button of the screen standing is sunk in a well, as a latched reading of the resource bar is, and answers no press; the others stand in the accent, and a press opens their screen. The **bar** runs along the top from the navbar to the Menu button, where the resource bar stands on the chronicle screen, and reads the influence at its left end as the resource bar reads a stock: a diamond in the accent, the word, the number. The pointer resting on the reading raises its tooltip under it, as a reading of the resource bar does; the reading answers no press.

- _The launch page_ becomes:

> The **launch page** is a stand-in for the meta's launch screen: **Chronicle** opens it, it wears the navbar and the bar, and the back key opens the campaign screen. The page is one row per choice — the age, the region, the deck and the seed — the first of each list chosen until another is pressed, the seed typed in digits or left blank for a fresh one, and **Launch** under the rows, which opens the chronicle on those choices; Enter presses it too. While the save holds a chronicle, **Continue** stands at the head of the page, over the rows, reading where that chronicle stands — the settle phase, or its turn — and under that the achievements it has reached, and opens it where it stood; Launch then ends that chronicle, which pays nothing. The address is the developer's door and the test suite's: one that names a deck opens the chronicle straight, on what else it names and the first of each list for the rest, a launch like any other; one that names `continue` opens the chronicle the save holds straight, and the boot fails where the save holds none; any other address boots on the campaign screen; and the chronicle screen writes nothing into the address. The launch screen replaces the page; the address stays.

Player-facing text, every entry the line adds:

| Where it shows | Reads |
| --- | --- |
| The navbar's head, one entry holding its line break | `Age of` / `Deckbuilder` |
| The navbar's button for the campaign screen | `Campaign` |
| The navbar's button for the launch page | `Chronicle` |
| The bar's reading, its word | `Influence` |
| The bar's reading, its tooltip | `Spend it on copies of your cards` |
| The menu's entry, over a chronicle | `Campaign` |

The entry `New chronicle` goes. The influence's number is the campaign's, bare.

**Doc-impact:** `docs/META.md`, `docs/INTERFACE.md`.

**Scope:**

In:

- The campaign screen: the navbar, the bar, and nothing else on it. The room right of the navbar and under the bar, 1040 × 672, is left bare for the tree.
- The navbar, 240 wide from the top of the screen to its foot, in the panel's fill with the panel's edge down its right side. Its margins are the screen's margin, 24. The name stands at its head in the windows' title style, 26 bold, centred, on two lines. The buttons are 192 × 44, 12 apart, their words in the windows' label style, the first one margin under the name.
- The bar, from the navbar's right edge to the screen's, as tall as the resource bar and drawn as it is: the panel's fill, the edge along its foot. The influence stands one margin in from its left end, drawn as a reading of the resource bar: the chip turned 45° in the accent, the word in the faint ink, the number in the ink.
- The influence's tooltip, raised under the reading after the rest every tooltip waits for, on both meta screens. The reading is not pressed, so the pointer over it is an arrow.
- The well of the screen standing is the resource bar's: the well's fill, the dark edge above and to the left, the light below and to the right, the word pressed down and right by one. It is not interactive, so the pointer over it is an arrow.
- The launch page wears both; its box is centred in the room they leave. It opens on the first of each list, the seed blank, whatever the save holds.
- The back key on the launch page opens the campaign screen. On the campaign screen nothing is left to back out of, so it raises the menu.
- The menu's Campaign, listed wherever New chronicle was: it lets go of a play-out under way as New chronicle did, leaves the chronicle in its save and opens the campaign screen.
- The address: `deck` and `continue` as they are; anything else, the bare address included, boots on the campaign screen. `seed`, `age` and `region` are read only beside `deck`.
- `.claude/agents/ui-check.md` and `.claude/skills/run/SKILL.md` say what the bare address now opens.

Out:

- The tree, the civilization and the Collection button: the first is the next line, the other two wait for their content and their rung.
- What the ending screen reads and the ending's pay. An ended chronicle stays in the save, and Continue reads its turn, until that line.
- The launch page's deck row, which stays and lists the catalogue's decks.

Corner cases decided:

- A save holding a chronicle boots on the campaign screen like any other; Continue is the launch page's.
- A save that cannot be read is dropped as today, and the boot lands on the campaign screen on a new campaign.
- Pressing Campaign on the menu while the ending screen stands opens the campaign screen; the ended chronicle is still in the save.

**Traps:**

- Scene order is load-bearing: added bottom up, started top down on `READY`, and a screen reaches into the menu's scene as it is created (`docs/PHASER.md` → _Scenes and stacking_; `src/main.ts`).
- A new scene's camera paints the backing store one to one until it holds the design space (`docs/PHASER.md` → _Scenes and stacking_).
- Every scene-plugin call is queued, in order; the launch page's `open` relies on it (`docs/PHASER.md` → _Scenes and stacking_).
- The Menu button is the menu scene's, on every screen; the bar on a meta screen ends before it as the resource bar does, through the same measure (`src/ui/menu.ts`, `src/ui/bar-layout.ts`).
- A key is heard by each scene in start order, and a window of the menu takes every key while it stands (`docs/PHASER.md` → _Input across scenes_): the launch page's back key must not fire under the menu or the console.
- The back key is rebindable: it is read through the bindings, never as Escape.
- A diamond is a Rectangle turned 45°; a stroked Polygon comes out open (`docs/PHASER.md` → _Rendering under WebGL_).
- An object made interactive is hit-tested from the next frame, and a spec rests before it presses (`docs/PHASER.md` → _Under a Playwright spec_).
- `e2e/chronicle-screen.ts`'s `plant` writes a new campaign beside the chronicle; a spec that needs influence plants the campaign a won chronicle paid into, through `paidInto`, and the search for a won chronicle lives in `e2e/victory.spec.ts` today.
- Player-facing text is keyed data, one entry per sentence: the name's two lines are one entry.
- A tooltip is one bubble per surface, named after its scene, and a hover is read once a frame by the game's own pointer reading, never Phaser's over and out (`src/ui/tooltip.ts`, `docs/PHASER.md` → _The pointer's readings_); a spec waits out the rest on the game's clock.

**Plan:**

1. `src/ui/text.ts`: the six entries stand, `New chronicle` is gone.
2. The navbar and the bar stand as one piece both meta screens draw, and the campaign screen stands as a scene drawing them.
3. `src/ui/launch-page.ts`: the page wears them, centred in the room left, opens on the firsts, and its back key opens the campaign screen.
4. `src/main.ts`: the campaign screen's scene is in the tower, and every address without `deck` or `continue` boots on it.
5. `src/ui/menu.ts`, `src/ui/menu-scene.ts`, `src/ui/chronicle-scene.ts`: Campaign stands where New chronicle did and opens the campaign screen.
6. `e2e/campaign.spec.ts` stands; `e2e/boot.spec.ts`, `e2e/continue.spec.ts`, `e2e/menu.spec.ts` and `e2e/resume.spec.ts` reach the launch page through Chronicle and leave a chronicle through Campaign, their titles saying so.
7. `docs/META.md`, `docs/INTERFACE.md`, `.claude/agents/ui-check.md`, `.claude/skills/run/SKILL.md`; the board line and this file deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/campaign.spec.ts`. It holds: the bare address with no save boots the campaign screen, Campaign sunk and Chronicle in the accent, the bar reading the new campaign's influence; on a planted campaign a won chronicle paid into, the bar reads that campaign's influence, read from the rules, and the pointer resting on the reading raises its tooltip; Chronicle opens the launch page, Chronicle sunk there, and the back key opens the campaign screen again; over a chronicle the menu lists Campaign and no New chronicle, and Campaign leaves the chronicle in its save and opens the campaign screen, Continue then opening it as it stands.
- CI proves on the push: `boot`, `continue`, `menu`, `resume`, `victory`, `failed-boot`, `console`.
