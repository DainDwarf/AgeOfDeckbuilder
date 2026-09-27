# The campaign's tree

**Line:** **The campaign's tree** — the campaign screen shows the technology tree: one plate per technology on its age's ground, unlocked, within reach or a mystery, moved left and right by drag and by the two pan keys; `e2e/tree.spec.ts` and the layout's Vitest tests pass. Doc-impact: `docs/META.md`, `docs/INTERFACE.md`, `docs/ages/NOMADIC.md`.

**Spec:**

`docs/META.md` → _The campaign_. The paragraph's last sentence, from "The campaign screen shows the tree whole" to its end, is replaced by the following, and no sentence is added about what it replaced:

> The campaign screen shows the tree, one plate per technology under the technology's name. A technology unlocked and one within reach — not unlocked, and needing none that is not — read their goal, the achievement's condition in words, and their reward, what the technology unlocks and the influence the achievement pays. A technology that needs one not unlocked is a **mystery**: it shows that it is there and reads nothing else. An achievement has no name of its own: wherever one is read, it is read under its technology's name.

`docs/INTERFACE.md` → a new section, **The tree ✅**, after _The navbar and the bar_, and the page's opening quote names it between the navbar and the launch page:

> The room the navbar and the bar leave the campaign screen holds the technology tree. Each age is a **ground** in a colour of its own, the grounds laid left to right in the order of history, each with its age's name at its head, and one ground washes into the next across their border. A technology stands on its age's ground, one column after the furthest technology it needs, and the technology that unlocks the next age stands on the border between the two grounds. Every column is centred on the room's middle, its technologies in the content's order, and a link runs from a technology to each one that needs it, around whatever plate stands in its way.
>
> A **plate** reads the technology's name, then **Goal** and the achievement's condition, then **Reward** and what the technology unlocks, the cards with their copies or the age, one to a line, and the influence the achievement pays, a diamond and the number; what a reward does not hold it does not read. Every plate of the tree is as tall as the tallest. A plate unlocked is sunk in a well, a check mark before its name; a plate within reach stands on the panel's paper; a mystery is greyed and reads ??? alone. A plate answers no press. A name in a plate's text stands in brackets, and the pointer resting on it raises its small card, as on a card.
>
> The tree moves left and right and no other way: the two keys that pan the map left and right move it while they are held, and a press held on the room drags it. The wheel does nothing here, whatever it is bound to. The tree stops at its ends, and a tree the room holds whole does not move. The screen opens with the technologies within reach centred in the room, from the leftmost of them where the room cannot hold them all, and on the tree's right end where none is within reach.

`docs/ages/NOMADIC.md` → _The achievement_, the section's one sentence replaced by:

> The age's one achievement is its victory. It earns the technology **Settlement** and pays influence.

Player-facing entries, every one the line foresees (`src/ui/text.ts`):

| Entry | Text |
| --- | --- |
| the technology's name, keyed by the technology's id | `Settlement` |
| the achievement's goal, keyed by the achievement's id `first-shelter` | `Build [card:shelter]` |
| the goal's label | `Goal` |
| the reward's label | `Reward` |
| a mystery | `???` |
| the age's name, keyed by the age's id `nomadic` | `Nomadic Age` |
| a reward of cards, one entry, one line per card | `{copies} [card:{card}]`, in whatever shape the reference syntax takes a parameter |
| a reward of an age, one entry | `The {age}`, fed the age's name |

`achievement.first-shelter` is removed. `launch.reached` keeps its text and is fed the technology's name, so Continue reads `✓ Settlement`.

**Doc-impact:** `docs/META.md`, `docs/INTERFACE.md`, `docs/ages/NOMADIC.md`.

**Scope:**

In:

- The plate in its three states, the grounds with their wash, the border rule, the columns, the links, the movement, the opening position, the rest on a name raising its small card.
- The Nomadic technology's id becomes `settlement`, so the id, the key and the name agree. A campaign saved with the old id drops it at the boot, as the save's design says of what it cannot resolve.
- The achievement's name leaves the game: the launch page's Continue reads the technology's name.
- One look entry per age for its ground. Only the Nomadic ground's colour lands; no colour lands for an age the catalogue does not hold.

Out:

- A right click on a plate's name showing the named thing large. The cards shown large are the chronicle's overlay's, which no screen of the meta starts; it is the next line on the board, "A plate's name is shown large".
- Zoom, and any vertical movement. A column taller than the room is not answered here: the room holds six plates to a column, and no content comes near.
- A Stone Age ground, a border and a door on the game's content: the catalogue holds one age and Settlement unlocks none. Settlement stands inside the Nomadic ground as any technology does, its reward reading the influence alone. The border rule, the second ground and the wash are built here and proven on the tests' own content.
- Glossary rows. "Plate", "ground" and "mystery" are the interface's words, as "navbar" and "well" are, and stand in `docs/INTERFACE.md` alone.

Corner cases, decided:

- **A state is read from the technologies alone.** Unlocked: the campaign holds it. Within reach: not unlocked, and every technology it needs unlocked. A mystery: anything else. The launch's choices do not exist on this screen and admit or refuse nothing here.
- **A mystery's links are drawn.** A link from a technology unlocked is pale, any other is dark and faint; a mystery's place in the tree is no secret, only what it is.
- **A reward that holds nothing** — no card, no age, no influence — reads the label and nothing after it.
- **A technology that unlocks an age and needs technologies** stands on the border whatever it needs; its column is the border's.
- **The last age's far border** carries its door where a technology unlocks an age the catalogue holds; past it the ground washes into the page.
- **Under a window of the menu** no key moves the tree, and under the debug console no key does either; the pointer still drags it under the console, as it pans the map.
- **A drag that began on a name** drags the tree, and a small card standing comes down as the tree moves.

**Traps:**

- The mockup is the reference for the look: https://claude.ai/artifact/UcPaEGYU7vtGeYFW8y5Sf8, the plate option "Two words". Its numbers, in design units: plate 236 wide, 74 tall at three lines; the name 16 bold, the text 14, the labels 11 in capitals; 70 between columns, 22 between rows; the first ground 200 wide before its border; the wash 180 wide, centred on the border; 24 of margin; the age's name 20 bold in capitals. The plate's size was set from estimated text widths: a real entry that does not fit is reported, never shrunk to fit.
- The mockup's colours: the Nomadic ground `0x2a5a41`; the mystery's fill `0x5c6068`, its ink `0x2a2e34`; a link from an unlocked technology in the pale ink, any other in the ink at 0.45. The unlocked plate is the well the navbar's standing button is sunk in; the plate within reach is the panel's fill and edge. No accent on a plate: the accent marks what answers a press.
- "Within reach" already has its rule in `src/rules/chronicle.ts`, the filter a launch reads. The tree's state and that filter are one fact; two readings of it drift.
- The map's pan lives inside `src/ui/map.ts` and is tied to the map's frame. It is not lifted out for this line and the map is not touched: the tree moves on one axis, and resemblance is not a reason to factor.
- A small card is raised from a name by where the name stands when asked (`src/ui/small-card.ts`), so it takes a name that is on no card face; its stratum is the raising scene's. The campaign screen has the bubbles' layer `wearNavbar` makes and no overlay scene.
- `docs/PHASER.md`: _The pointer's readings_ — Phaser re-checks what the pointer is over only when the pointer moves, so a name carried under a resting pointer by the keys is hovered through the game's own reading, not Phaser's; a drag ends at any button's release. _Input across scenes_ — a key is heard in the scenes' start order, and the menu's window and the console are what keep a key from the screen. _Rendering under WebGL_ — there is no geometry mask, so what keeps the tree out from under the navbar and the bar is paint order or a camera's frame, never a mask on a shape; a stroked polygon drops a point, which the links and the diamond meet. _Under a Playwright spec_ — rest before a press or a measure.
- The catalogue's coherence test reads every id through the lookups the screen uses: a technology's name, an achievement's goal and an age's name are three new lookups it must read, or a missing entry throws at the first draw.
- `src/ui/text.ts` entries take no final period, and a reference is never pluralised.
- The wheel's notches are bound to the two zooms by default and reach a scene as key presses (`src/ui/keys.ts`): the campaign screen reads the two pans and nothing else.

**Plan:**

1. `src/content/nomadic.ts`, `src/ui/text.ts`, the catalogue's coherence test: the technology renamed, the entries of the table above standing, the achievement's name gone, the three lookups read by the coherence test; `src/ui/launch-page.ts` reading the technology's name. Leaves the game as it was but for Continue's word.
2. The tree's layout as a pure computation with its Vitest tests beside it, on content the tests author: a catalogue and the technologies unlocked in, every plate's place, state and links and every ground's span out; and how far the tree may move and where it opens. Leaves nothing on screen.
3. `src/ui/look.ts` and the campaign screen: the grounds, the links, the plates, drawn from the layout in the room. Leaves the tree standing still.
4. The movement: the two pan keys and the drag, bounded, and the opening position. Leaves the tree moving.
5. The names on a plate raising their small card at the rest.
6. `e2e/tree.spec.ts`, then the three `docs/` pages, then the board line and this file deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The layout's Vitest tests, each a rule a player could state, on the tests' own content: a technology stands one column after the furthest it needs; the technology that unlocks the next age stands on the border; a column is centred on the middle; a technology needing one not unlocked is a mystery; a link goes around a plate in its way; the tree stops at its ends and a tree the room holds does not move; the screen opens on the technologies within reach.
- The proof spec, `e2e/tree.spec.ts`, new, on planted saves and the game's content, every text read through `text`: on a new campaign Settlement stands within reach inside the Nomadic ground, reading its name, its goal and its reward; on a campaign a won chronicle paid into it stands unlocked, the check mark before its name; the pointer resting on the goal's name raises the Shelter's small card; the pan keys, a drag and a wheel notch leave the tree where it stands, the room holding it whole. The game's content reaches no mystery, no border and no movement: those are the Vitest tests', and the spec says nothing of them.
- CI proves on the push, never run locally: `e2e/campaign.spec.ts`, `e2e/continue.spec.ts`, `e2e/resume.spec.ts`, `e2e/boot.spec.ts`, `e2e/menu.spec.ts`, `e2e/controls.spec.ts`, `e2e/reference.spec.ts`, `e2e/hover.spec.ts`, `e2e/victory.spec.ts`.
