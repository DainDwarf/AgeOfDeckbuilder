# Pin several achievements

**Line:** **Pin several achievements** — the campaign pins any number of available technologies, every technology pinned as it becomes available; the tree toggles a pin per plate and marks a pinned plate with a dark-edged white line and a red disc; the chronicle screen stacks the pinned achievements it reads in the map's top-left corner, a reached one reading its name alone; the pins read and write with the save. Doc-impact: `docs/META.md`, `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/GLOSSARY.md`.

**Spec:** `docs/META.md` → _The campaign_, second paragraph, replaced whole:

> The player **pins** any number of available technologies, and the pins are the campaign's, kept in the save. A technology is pinned the moment it becomes available — at the campaign's opening, and at each learning for the technologies that learning makes available — and the player takes a pin off and puts it back; a technology that is learned is pinned no longer, and one taken off stays off until the player pins it again. A chronicle that reads a pinned technology's achievement shows it on its screen, as [`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md) says; any other chronicle shows nothing of it. The pins change nothing a chronicle reaches or pays.

`docs/GLOSSARY.md` → the **pin** row's meaning: "To hold an available technology in view: while a chronicle reads its achievement, the chronicle screen shows it." The forbidden column stands.

`docs/META-SCREENS.md` → _The campaign screen_, the plate paragraph, from "a left click anywhere on the plate of an available technology" to the paragraph's end, replaced by:

> a left click anywhere on the plate of an available technology that is not pinned pins it, a name in its text included, and a left click on a pinned plate takes its pin off. A pinned plate is edged in the pin's colour, the line edged dark on both sides, and wears a disc in the pin mark's colour over its top-left corner, centred on the corner. The plate of a learned technology and of an unknown one answers no left click.

`docs/CHRONICLE-SCREEN.md` → _The pinned achievement_ becomes _The pinned achievements_, its paragraph replaced whole:

> While the campaign pins technologies whose achievements the chronicle reads, those achievements stand in the map's top left corner, one under the other in the order the chronicle reads them, 8 apart, the first as far from the map's top and left edges as a mode's chip stands from its top and right ones, each on the panel's paper and as wide as a plate of the tree. Each reads its technology's name; at the right end of the name's line, the achievement's count over its need, which a need of one does not read; and under the name the goal as the plate reads it, wrapped onto as many lines as it takes, the paper as tall as they stand. Once an achievement is reached it is sunk in a well and reads the check mark and the name alone, the paper as tall as that one line, and those under it close up. A name in a goal answers the rest and the right click as on a plate. They answer no press; the wheel over them zooms the map, as over the resource bar. They stand on the settle phase and in city mode as on any turn. A pinned technology whose achievement the chronicle does not read stands there as nothing, and a campaign pinning none the chronicle reads shows nothing there.

In the same page's _The shown event_: "on the panel's paper as the pinned achievement is" becomes "as a pinned achievement is", and "as over the pinned achievement" becomes "as over a pinned achievement". `docs/INTERFACE.md` → _What stands over what_: "the frame and chip of a mode and the pinned achievement over it" becomes "the frame and chip of a mode and the pinned achievements over it".

No player-facing text is added: a reached plate reads the `achievement.reached` entry it reads today, the disc carries nothing.

**Doc-impact:** `docs/META.md`, `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/GLOSSARY.md`.

**Scope:**

In:

- The campaign's pin becomes a list of pinned technologies. Pinning adds one, taking off removes one, and a technology learned is taken off; pinning one not available is refused as today. A new campaign pins every technology available at its opening (Settlement on today's content). A learning pins every technology it makes available — not learned, and every need learned once this one is — and nothing else, so a pin the player took off stays off through later learnings.
- The save writes the list and reads it as it reads the learned technologies: a pin naming no technology, a learned one, an unknown one or one already read is dropped with its reason and the rest stand. A save written before this line carried one pin under another field; it goes unread and the pin is lost, which needs no care before the Bronze Age.
- The tree: a left click on an available plate toggles its pin; several plates wear the marking at once. The marking is the edge, a line 2 wide in the pin's colour with a line 1 wide in the pin edge's colour on each side of it, square-cornered on the plate's own edge, and a disc 14 wide in the pin mark's colour with a 1-wide line in the ink around it, centred on the plate's top-left corner. Two look entries are added, one per new meaning — the dark line of the pin's edge, the disc's red — each borrowing an existing value today: the selection edge's `0x0d1014`, the enemy's `0xb4453c`. No existing entry is reused for them.
- The chronicle screen stacks one plate per pinned technology whose achievement the chronicle reads, in the chronicle's achievement order, each as today's one is built, 8 apart, from today's corner. A reached plate shrinks to its name line: 2 × PAD_Y + NAME_LINE tall, the check mark and the name, no goal, no count, sunk; the plates under it move up. The stack is read from the campaign held when the scene is created, as today's one pin is. Each plate stops presses over the map under it, as today.
- Measured: five plates is the widest front the Stone Age's tree shows (24 of its 379 learned states); the tallest stack, Herbalism, Fire, Tanning and Raft, stands about 302 tall at gap 8 in 442 of room (the first plate's top at 72, the band's top at 538, less the inset). No overflow in this age.
- The forge builds its campaign through the rules and takes the default pins with it; no change there.

Out:

- What a stack does when it outgrows the room: no age reaches it.
- Any reading of pins on the launch, collection or ending screens.
- Re-pinning on a later learning a technology the player took off.

Reconcile: the disc stays apart from the count badges of the draw pile and the browse, which read a number; the pin's edge stays apart from the selected card's ring in meaning and colour entries, and whether one helper strokes both two-line edges is the implementer's call.

**Traps:**

- `docs/PHASER.md` → _Input across scenes_ and _Under a Playwright spec_: a zone inside a container is over the container, and an object made interactive is hit-tested from the next frame. Each plate's stop zone keeps presses off the map under it.
- The glossary forbids "reachable" and "within reach" for available; the board line used it, the code and the pages never do.
- `wonCampaign()` and `freshCampaign()` now carry pins, so every spec opening a chronicle sees plates in the corner: one 56-tall plate on a Nomadic chronicle (Settlement), four plates about 284 tall on a Stone Age one (Herbalism, Agriculture, Trapping, Fire). A press or a drag landing in x 24–260, y 72–356 lands on a plate. A spec that needs that corner free takes the pins off in its fixture through the rules' own helper, one technology at a time; a spec never plants a campaign the rules did not make.
- `e2e/pin.spec.ts` asserts today's one-pin behaviour (a second click moves the pin) and reads `pinned-achievement-*` names; it is rewritten to toggles and to one name per technology. `e2e/map.spec.ts`'s `pinningRead` pins one technology on a fresh campaign whose default pins already hold it: the spec's `pinned-achievement` reading becomes the technology's plate. `e2e/press.spec.ts` and `e2e/tree.spec.ts` read the pinned plate too.
- `src/rules/save.test.ts` and `src/rules/campaign.test.ts` state the one-pin shape; they are rewritten to the list, including: a new campaign's pins, a learning's pins, a pin taken off surviving a later learning, and the save dropping each bad pin with its reason and keeping the rest.
- The chronicle scene builds its plate from `campaignHeld().pin` at create; the campaign screen's tree gets the pins at opening and reports each toggle. The campaign screen's save write goes through `keepCampaign`.
- The disc is a UI shape, not a placeholder mark: a circle is fine.
- Content is the Stone Age slice's; no content changes.

**Plan:**

1. `src/rules/campaign.ts` and its test: the pins list, pinning and taking off, a new campaign's and a learning's default pins; `npm test` green.
2. `src/rules/save.ts` and its test: the list written and read, each bad pin dropped with its reason.
3. `src/ui/look.ts`, `src/ui/tree.ts`, `src/ui/campaign-screen.ts`: the two look entries, the toggle, the edge and the disc on every pinned plate.
4. `src/ui/pinned-achievement.ts` and `src/ui/chronicle-scene.ts`: the stack, the reached plate's name line.
5. The five `docs/` pages, the sentences above.
6. `e2e/pin.spec.ts` rewritten; the specs that read the pinned plate adjusted; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/pin.spec.ts`. CI proves on the push: `e2e/tree.spec.ts`, `e2e/map.spec.ts`, `e2e/press.spec.ts`, `e2e/campaign.spec.ts`, `e2e/launch-warning.spec.ts`, `e2e/manage-save.spec.ts`, `e2e/console.spec.ts`, `e2e/resume.spec.ts`, `e2e/ending.spec.ts`, and every spec that opens a chronicle, since the corner is no longer bare.
