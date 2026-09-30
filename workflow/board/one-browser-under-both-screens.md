# One browser under both screens

**Line:** One browser under both screens — the chronicle's overlay is the meta's browser with its windows and its ending added: the kit both build today, the tooltip and its bubble, the small cards, the cards shown large and their taker, the carrier, the following of the pointer, the scrim and the gestures' door, is built once, and a browse is raised and taken down one way. Doc-impact: none.

**Spec:** `docs/INTERFACE.md`, _What stands over what_, and `docs/META-SCREENS.md`, _The launch screen_, as they stand. No sentence changes. No player-facing text.

**Doc-impact:** none — nothing the player sees changes.

**Scope:**

- In: one module builds the kit a screen stands on the overlay: the tooltip and its kind bubble, the small cards, the cards shown large with their taker, what faces answer with, the following of the pointer, the carrier, the scrim, and the door the wheel and the pan keys come through. The chronicle's overlay stands on it and adds its windows, its ending, its render and its play; the meta's browser stands on it and adds the civilization's browse.
- In: a browse is raised one way — scrim up, title, panel — and taken down one way, whichever pile or civilization it shows; today the two callers build and dismantle the same shape apart.
- In: the campaign screen keeps its cards shown large alone; whether the kit serves it too is the implementer's, with nothing lost.
- In, as a suggestion the implementer decides: what every piece of a screen is handed — the scene, the stratum it stands on, what its faces answer with, the following of the pointer, the carrier — travels as one value through what this line touches, so the signatures it passes through shed their threaded tuple.
- Out: any visible change; the windows' own logic; the chronicle scene beyond what the kit's shape moves.

**Traps:**

- The two builders: `standBrowse` (`src/ui/browse.ts:200-282`) and `createOverlay` (`src/ui/overlay.ts:178-243`, the setup before the windows). Both build the tooltip and bubble, the small cards, `standLarge` with a `Beneath`, `inspectingUnder`, a carrier and a follow; their `Beneath.takes` differ — the meta's closes the browse on the back key (`browse.ts:226-229`), the chronicle's routes the inspection key, the back key and the menu (`overlay.ts:811-816`) — and `overlay.takes` holds one taker (`src/ui/overlay-scene.ts:64-66`), the overlay restarting per screen.
- The chronicle wraps what faces answer with in `rise` (`overlay.ts:228-242`), which holds the scroll and takes the note down as a card rises large; the meta's does not need it, and after the grid line the hold is the panel's.
- `covering` is told at open and close by the meta's (`browse.ts:218`, `:279`) and at cover and close by the chronicle's (`overlay.ts:279`, `:294`); the chronicle gates the map's `live` on it (`src/ui/chronicle-scene.ts:386-391`), the meta screens route it to `awayUnder`. One telling.
- Small cards are built three times on the overlay: for the browse (`browse.ts:240`), for the windows (`overlay.ts:195`) and inside the large stack for the large cards' names (`src/ui/stack.ts:71`), all on the small-card stratum with the shared bubble. Whether the stack's can be the kit's is the implementer's to answer, and a change in what stands or goes down is a deviation to report.
- The two browse callers: `showBrowse` (`overlay.ts:475-502`) and `open` (`browse.ts:252-280`); `layBrowse` (`browse.ts:136-187`) is already the shared part.
- The specs read the pile browse as `browse` and the civilization's as `civilization-browse` (`e2e/collection.spec.ts:25`), their titles as `<name>-title`, their frames as `<name>-frame`, their stacks as `<name>-stack-<n>` and `<name>-card-<n>`; every name stays.
- `src/content/` is imported by a scene and by `src/ui/save-entry.ts` alone; the kit receives the catalogue from the scene (`DOGMAS.md`, _Stack_).
- `docs/PHASER.md` for anything else Phaser: read, never remembered.

**Plan:**

1. The kit built once, in the module the implementer names (`src/ui/browse.ts` is the natural home); `src/ui/overlay.ts` and `src/ui/browse.ts` standing on it, the browse raised and taken down one way; the callers `src/ui/chronicle-scene.ts`, `src/ui/collection-screen.ts`, `src/ui/launch-screen.ts`, and `src/ui/campaign-screen.ts` if the kit serves it, following the shape. Leaves standing: one kit, the same screens.
2. `workflow/BRANCH.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/browse.spec.ts`. CI's on the push: `launch.spec.ts`, `collection.spec.ts`, `deck-editing.spec.ts`, `civilization-mode.spec.ts`, `campaign.spec.ts`, `press.spec.ts`, `deal.spec.ts`, `boot.spec.ts`, `ending.spec.ts`, `menu.spec.ts`, `hover.spec.ts`, `reference.spec.ts`.
