# A card shown large holds a collection panel still

**Line:** A card shown large holds a collection panel still — every card the collection screen shows large, from a stack, a row, a pile's city section card or a small card's name, stops a fling running on any of the screen's panels as it rises, as a card shown large over a browse does. Doc-impact: none.

**Spec:** `docs/INTERFACE.md`, _What stands over what_ — "whatever they are shown over … stands under that scrim as it stood, dimmed, its ring and its scroll kept" — and `docs/META-SCREENS.md`, _The collection screen_ — "a card shown large leaves them where they stood". The pages already say it; no sentence changes. No player-facing text.

**Doc-impact:** none — the pages state the behaviour; the code follows them.

**Scope:**

- In: on the collection screen, in every mode, a card rising large stops a fling on every panel the screen has laid, whichever panel or small card raised it. A press on a panel already stops that panel's own fling; what runs on today is a fling on another panel (the collection flung, a row of the deck right-clicked) and a fling under a small card, whose name takes the press over the panel.
- In: a card rising large on a name of a card that already stands large goes the same way; nothing is flinging then, and nothing changes.
- Out: a civilization's browse or the menu rising over the collection screen — the user left it to cards shown large; the pages say nothing of it. The campaign screen's tree, which does not fling. The launch screen and the chronicle's overlay, which the last line covered.

**Traps:**

- The collection screen builds its `Inspecting` with the browse's `large` as is (`src/ui/collection-screen.ts:263-268`), and its small cards raise a name large through `large.named` directly (`:265`), not through the `Inspecting`; the browse and the overlay route both through `inspectingUnder` (`src/ui/browse.ts:288-312`) with a `rising` that calls `holdStill` (`src/ui/panel.ts:324-326`).
- The screen's panels are relaid on every edit and mode change (`lay`, `collection-screen.ts:296`); `laid.panels` is the list standing at the moment a card rises, and a rising must read it then, not at the screen's creation.
- The stacks raise a card large through `answersOf` (`src/ui/stack.ts:272-295`), the deck's rows through `rowAnswersOf` (`src/ui/deck-panel.ts:67-78`), both from the `Inspecting` handed them.
- `docs/PHASER.md` for anything else Phaser: read, never remembered.

**Plan:**

1. `src/ui/collection-screen.ts`: every card shown large on the screen raised through one rising that holds every standing panel still, small cards' names among them. Leaves standing: no fling runs on under a card shown large on the collection screen.
2. `workflow/BRANCH.md`: the line deleted, this file with it.

**Verify:** `npm run fmt`, `npm run check`, `npm test`, `npm run lint`. Proof spec: none — a fling cannot be set running from Playwright's own mouse moves, which come too far apart; the Stone Age rung carries the spec that fires a drag inside the page. CI's on the push: `collection.spec.ts`, `deck-editing.spec.ts`, `civilization-mode.spec.ts`, `browse.spec.ts`, `inspect.spec.ts`, `hover.spec.ts`, `pointer-sweep.spec.ts`, `reference.spec.ts`.
