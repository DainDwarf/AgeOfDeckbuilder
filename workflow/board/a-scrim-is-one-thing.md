# A scrim is one thing

**Line:** A scrim is one thing — one function draws every scrim and wires its two clicks as the one step back its owner hands it, and the overlay, the browse, the cards shown large and the menu's two each own one built through it. Doc-impact: none.

**Spec:** `docs/INTERFACE.md`, _The presses_: "A press on a scrim is one step back, and the two clicks are one press there." That sentence is the invariant; it is enforced today at five sites by convention. No sentence changes. No player-facing text.

**Doc-impact:** none — nothing the player sees changes.

**Scope:**

- In: one function draws a scrim over the whole design space in the look's colour and strength, its origin at the corner, down until raised, and wires its left and right click to the one step back its owner hands. Every scrim is one: the chronicle overlay's, the browse's, the cards shown large's, the menu's and the refused-save window's.
- In: the browse's scrim, rebuilt at every opening today, becomes one built once and raised, like the others.
- In: the ending's rise still brings the overlay's scrim up from nothing; how the scrim serves the rise is the implementer's.
- Out: the scrim's look, the Menu button, what each scene stops, any visible change.

**Traps:**

- The five sites: `src/ui/overlay.ts:187-191` with its clicks at `:803-804`, shown and hidden with its interactivity toggled (`:278`, `:293`) and tweened by the ending (`:290-295`, `:695-719`); `src/ui/browse.ts:254-260`, rebuilt per opening and destroyed at the close (`:212-219`); `src/ui/stack.ts:191-197` with its clicks at `:208-209`, at depth 1; `src/ui/menu-scene.ts:239-245` twice, its clicks at `:210-213`, the refused-save's at depth 1 and always interactive, visibility alone toggled (`:77-84`).
- A hidden object is skipped by the hit test whether or not it is interactive (`docs/PHASER.md`, _The pointer's readings_); the menu's scrims rest on that, the overlay's toggles both. One convention.
- Depths matter: a Layer draws by depth first and by add order among equal depths (`docs/PHASER.md`, _Scenes and stacking_). The large stack's scrim stands at depth 1 over a window's pieces added to the scrim layer after it; the refused-save scrim and its window at depth 1 over a window of the menu raised after them; the browse's scrim stands under its title and panel by add order.
- `onClick` (`src/ui/design-space.ts:324-371`) is the click, and the two calls per scrim are the repeated shape; what a scene stops is its `stopsThePointer` (`design-space.ts:269-291`), which a scrim inherits from its scene, nothing to move.
- The specs press scrims by coordinates (`e2e/chronicle-screen.ts:623-640`, `e2e/menu.spec.ts:94`, `e2e/refused-save.spec.ts:114`); none names a scrim, so a name is free to give and nothing to keep.
- `docs/PHASER.md` for anything else Phaser: read, never remembered.

**Plan:**

1. The one scrim, where the implementer puts it (`src/ui/design-space.ts` or a file of its own), and the five sites through it: `src/ui/overlay.ts`, `src/ui/browse.ts`, `src/ui/stack.ts`, `src/ui/menu-scene.ts`. Leaves standing: every scrim drawn and pressed the same way, one place saying what a press on a scrim is.
2. `workflow/BOARD.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/menu.spec.ts`, whose tests press the menu's scrim with either button and back out of a browse. CI's on the push: `refused-save.spec.ts`, `browse.spec.ts`, `deal.spec.ts`, `press.spec.ts`, `launch.spec.ts`, `collection.spec.ts`, `inspect.spec.ts`, `ending.spec.ts`, `boot.spec.ts`.
