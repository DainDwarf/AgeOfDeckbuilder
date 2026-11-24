# The Menu button under every scrim

**Line:** The Menu button under every scrim — under a browse, the deal window, the capstone's window, a card shown large and the ending screen, on the chronicle screen and on the meta screens alike, the Menu button is dimmed with the screen and reacts to nothing, a press there being a press on that scrim, as it already is under a scrim of the menu; the back key raises the menu wherever it did; `e2e/menu.spec.ts` proves it.

**Spec:** `docs/INTERFACE.md` _The menu_ and _What stands over what_, `docs/CHRONICLE-SCREEN.md` _The capstone's window_ and _The ending screen_.

- `docs/INTERFACE.md` _The menu_, first paragraph: `and opens the menu over whatever stands; the pointer resting on it raises a tooltip under it reading `Menu`;` becomes `and opens the menu over the screen it stands on; under a scrim it is dimmed as that screen is and reacts to nothing, a press there being a press on the scrim; the pointer resting on it raises a tooltip under it reading `Menu`;`.
- `docs/INTERFACE.md` _What stands over what_, first paragraph: `the Icons button, the Faction signs button and the Hex grid button over that` becomes `the Menu button, the Icons button, the Faction signs button and the Hex grid button over that`.
- Same section, second paragraph: `The **menu** stands over all of that, on every screen and the ending screen included: its button, and a window of it on a scrim of its own that rises with the window over whatever stands, the button among it.` becomes `A window of the **menu** stands over all of that, on every screen and the ending screen included, on a scrim of its own that rises with the window over whatever stands. The Menu button stands under every scrim, on every screen: the screen's own, the menu's, and the one the window a refused save raises stands on.`
- Same section, third paragraph: `The Menu button's own tooltip stands on the menu's surface, under a scrim of the menu, and a scrim of the menu rising takes it down as any scrim does a tooltip.` becomes `The Menu button's tooltip stands with the tooltips of the screen it stands on, and a scrim rising takes it down as it does any tooltip.`
- `docs/CHRONICLE-SCREEN.md` _The capstone's window_: its last sentence, `The menu opens over the window and closes back onto it.`, is deleted.
- `docs/CHRONICLE-SCREEN.md` _The ending screen_: `the menu opens over the screen and closes back onto it` becomes `the back key opens the menu over the screen, which closes back onto it`.
- No player-facing sentence is added or changed.

**Doc-impact:** `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`; `docs/PHASER.md` where a sentence of it names the scene the Menu button stands on, if the ship moves it.

**Scope:**

- In: every scrim a screen raises on the overlay, on the chronicle screen (a browse, the deal window, the capstone's window, a card shown large, the ending screen) and on the meta screens (a civilization's browse, a card shown large). The scrims of the menu and of the refused-save window already do this and stay as they are.
- What the player sees: the button dimmed exactly as the Icons, Faction signs and Hex grid buttons beside it are under the same scrim; the pointer over it is the arrow a scrim wears, with no hover look and no tooltip; a left or a right press there does what a press on that scrim does: a browse and the capstone's window close, a card shown large comes down, and the deal window and the ending screen take it as nothing.
- The back key is untouched: it raises the menu over the deal window and over the ending screen, and from a clean screen, as today. Nothing raises the menu over the capstone's window, a browse or a card shown large any more: the back key closes those first.
- Reconciled: the button under the menu's own scrim is the standing form, and every other scrim goes through it as it is. What a press on a scrim does stays each scrim's own.
- Corner cases decided here:
  - A tooltip the button raised is taken down as a scrim rises, as under the menu's own.
  - The scrim falling under a pointer that rests on the button finds it hovered again, before the pointer moves, as anything a scrim uncovers.
  - A deal window minimized has no scrim standing: the button is lit and opens the menu.
  - The wheel over the dimmed button is the scrim's, as anywhere on it.
  - A menu window raised by the back key rises on its own scrim over the button, as today.
  - The debug console is no scrim: the button under it is as today.
- Out: any change to what the back key walks, and any new way to the menu from under a scrim.

**Traps:**

- `docs/PHASER.md` _Scenes: order and start_, _The pointer across scenes_ and _What the pointer is over_: render order is scene order, the menu's scene stands over the overlay's, and the button is drawn by the menu's scene on every screen, which is why it is lit over the overlay's scrim today. The menu's own scrim covers it only by being added after it in that one scene.
- The dimming must be the scrim's own: the three buttons beside it are dimmed by standing under the scrim's wash, and a second tint that only resembles it would differ at the button's rounded corners and soft shadow.
- The game's own once-a-frame reading of what the pointer is on is what takes hovers and tooltips down under a cover and writes the cursor; Phaser sends no over and out when a scrim rises or falls under a resting pointer.
- The overlay raises more than one scrim: a card shown large stands on a scrim of its own over a browse's or a window's. The button is under whichever stands.
- The menu's scene reads keys ahead of every screen and outlives every chronicle; the button is the same object on the chronicle screen and the meta screens.
- Specs that press or point at the Menu button over one of these scrims promise what this line withdraws, and are rewritten to the new rule, the user having decided it: `e2e/boot.spec.ts` (the menu opened by the button over the capstone's window, twice), `e2e/continue.spec.ts` (the button pressed after a launch, under the capstone's window), `e2e/menu.spec.ts` (the menu opened by the button over the defeat screen), `e2e/reference.spec.ts` (the pointer moved onto the button over the deal window, the hand expected). Any other found by reading every use of `menu-button` in `e2e/` is rewritten the same way and named in the report.
- The back key is rebindable and some specs rebind it.

**Plan:**

1. The button is under the overlay's scrims: dimmed with the screen, dead to the pointer, a press there landing on the scrim.
2. Its tooltip and its hover follow the cover, rising and falling.
3. The specs that leaned on the lit button are rewritten, and `e2e/menu.spec.ts` gains the proof.
4. The pages.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof is `npx playwright test e2e/menu.spec.ts`, with a test added: under a browse a press on the Menu button closes the browse and raises no menu; under the deal window a press there raises nothing and the back key raises the menu; over the ending screen the back key raises the menu and Campaign leaves; the button's tooltip is down under each. CI proves on the push: `boot.spec.ts`, `continue.spec.ts`, `reference.spec.ts`, `buttons.spec.ts`, `browse.spec.ts`, `deal.spec.ts`, `capstone.spec.ts`, `ending.spec.ts`, `collection.spec.ts`, `civilization-mode.spec.ts`, `launch.spec.ts`, `hover.spec.ts`, `press.spec.ts`, `controls.spec.ts`, `refused-save.spec.ts`, `launch-warning.spec.ts`, `neutral.spec.ts`, `campaign.spec.ts`, `manage-save.spec.ts`.
