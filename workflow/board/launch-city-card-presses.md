# The city card on the launch screen answers the presses

**Line:** The city card on the launch screen answers the presses — the city section's card on a civilization's pile answers the right click, shown large, the rest on its names and the rest on its kind label, as a card face does anywhere; a left click on it still chooses the civilization, and the rest of the pile answers no right click; `npm run check`, `npm test`, `npm run lint` and `e2e/launch.spec.ts` pass.

**Spec:** `docs/INTERFACE.md`.

- _The launch screen_, the paragraph opening "The chosen age and the chosen region stand larger", append after its first sentence ("… a press on another chooses it."):

  > The city section's card on a pile answers the presses as a card does anywhere: a right click shows it large, on a scrim over the whole screen, the navbar and the bar among it, and its names and its kind label answer the rest; a left click on it chooses its civilization, as a left click anywhere on the pile does, and the rest of the pile answers no right click.

- _A card's kind label_, the sentence "Every card face answers so but a pile's top card — in the hand, in a browse, in the aim window, on the deal and capstone windows, shown large and small alike —" becomes:

  > Every card face answers so but a pile's top card on the chronicle screen — in the hand, in a browse, in the aim window, on the deal and capstone windows, on a pile of the launch screen, shown large and small alike —

No player-facing entry is added: the card's names, its small cards, its kind bubble and the card shown large all read entries that stand.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- In: every pile's city section's card, the chosen civilization's and a dimmed one's alike. A right click on it stands it large on the screen's scrim; the stack then behaves as on the campaign screen: a right click on a name on the newest card stacks the named thing, twelve at most, a press on the scrim or the back key takes down the newest, and the back key raises the menu only once none stands. The pointer resting on a name in the card's rules raises its small card; resting on its kind label raises the kind bubble. A left click anywhere on the pile, the card's names and label included, chooses the civilization, as today.
- Out: a right click on the backs, the civilization's name or the counts does nothing. A right click never chooses. The chronicle screen's piles are untouched: their top card still answers nothing.
- Corner cases decided here: under the scrim the launch screen hears no key but the back key, which walks the stack; the scrim covers Continue, Launch, the navbar and every choice, so nothing launches or chooses while a card stands large. A left click on the card re-lays the screen, destroying the face under the pointer: the small card and the kind bubble raised from it go down with it, and nothing stays raised over the new face until the pointer moves.

**Traps:**

- The campaign screen already stands a card large from a right click (`standLarge`, `src/ui/campaign-screen.ts`): the scrim, the stack, the back key, the scrim's two clicks. This screen needs the same behaviour, not a second copy of it that can drift; where the shared piece lives is the implementer's call.
- The launch screen calls `closeMenu`, not `resetMenu`: it does not hear a menu window rising today. The campaign screen passes the menu's cover through to the overlay (`COVERED`) so a hover under it ends; a card shown large here needs the same when the menu opens over it. `docs/PHASER.md` → _Input across scenes_, _Scenes and stacking_.
- The navbar restarts the overlay scene on every screen change (`overlayAhead`, `src/ui/navbar.ts`), so the launch screen's overlay is fresh at each visit, and Launch restarts it again on its way to the chronicle.
- The pile's choosing zone is added after the face and stands over it (`pilesOf`, `src/ui/launch-screen.ts`); the face's name and kind-label zones must stand over the choosing zone to hear the rest and the right click, and a left click landing on one of them must still choose.
- The whole root is destroyed and redrawn on every choice (`lay`): anything raised from a face — a small card, the kind bubble — must go down when that face is destroyed, as the tree's and the stack's already do.
- A right click on a Phaser object is a click like the left one to the input plugin: the pile's choosing handler must answer the left click only (`onClick`'s default, `src/ui/design-space.ts`).

**Plan:**

1. `src/ui/launch-screen.ts`: the pile's face is drawn with its name presses and its kind label, raising small cards and the kind bubble on the surfaces the navbar wears, as the tree does; the face answers the right click by standing its own face large. Leaves standing: the rest and the right click working on the card, the left click choosing as before.
2. The card shown large, the campaign screen's behaviour shared with this screen, the menu's cover passed through. Leaves standing: both screens standing cards large through one piece.
3. `docs/INTERFACE.md`: the two sentences above, verbatim.
4. `e2e/launch.spec.ts`, new, on a bare boot: on the launch screen, a right click on the civilization's city card shows that card large; the pointer resting on a name on it raises the named thing small; the back key takes the card down and raises no menu; a left click on the card leaves its civilization chosen. Every id read from the campaign and the face's names, never a literal.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec is `npx playwright test e2e/launch.spec.ts`. CI proves on the push, for the hand-back: `e2e/tree.spec.ts` (the shared card shown large), `e2e/continue.spec.ts` and `e2e/boot.spec.ts` (the launch screen's other presses and its back key).
