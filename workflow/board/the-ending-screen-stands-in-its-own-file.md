# The ending screen stands in its own file

**Line:** The ending screen stands in its own file — the ending screen, its ledger and its rise leave `src/ui/overlay.ts` for a file of their own, which never holds the scrim, the browser fading its own scrim in; and Biome holds the new file to 60 lines a function and 4 positional parameters, and `src/ui/overlay.ts` to 320 lines a function and 4 positional parameters. Doc-impact: none.

**Spec:** `docs/INTERFACE.md`, _What stands over what_, and `docs/CHRONICLE-SCREEN.md` where it describes the ending screen, as they stand: nothing the player sees changes. No sentence changes. No player-facing text.

**Doc-impact:** none — the line is the code's shape, and the lint config is its own record.

**Scope:**

- In: the ending screen leaves the overlay for a file of its own: its title and line, its ledger of achievements reached, its total, its button dead until the screen has risen, its rise out of nothing and a little low, and the rise a render cuts short. The overlay keeps when it is raised and that it stands.
- In: the scrim's fade becomes the browser's own door. The browser raises its scrim whole or fading in, and stands it whole when the fade is cut short; neither the overlay nor the ending's file holds the scrim, and the browser no longer hands it out.
- In: the overlay's builder takes four positional parameters at most; what the chronicle screen hands it one argument at a time travels as one value.
- In: the ceilings, by Biome's count, as an override in `biome.json` at level error: 60 lines a function and 4 positional parameters on the new file; 320 lines a function and 4 positional parameters on `src/ui/overlay.ts`. `npm run lint` passing is the done-condition.
- Out: the windows, which stay in the overlay; the rise's length, its ease and how low it starts; any name a spec reads; any visible change.
- Corner: a ceiling is met by cutting on what a thing is — the ledger apart from the block it stands in — never by slicing a function at a line. A ceiling that cannot be met without such a slice is reported as a deviation, the number standing.

**Traps:**

- Measured today by Biome: the overlay's builder 407 lines and 6 positional parameters (`src/ui/overlay.ts:167`), the ending's drawing 76 lines (`:402`). Biome counts a function's lines with every function nested in it, so the builder's count is the whole closure; the ending is about 110 of it, which leaves about 300 against the ceiling of 320.
- The ending's pieces in the overlay: the raised screen and its button (`overlay.ts:156-160`), the chronicle it was raised on and the rise in flight (`:181`, `:187`), the rise forgotten at a wipe (`:195-199`), the drawing (`:398-484`), the rise ended, begun and cut short (`:486-519`), what it reads of the chronicle (`:521-526`, `:658-678`), and the two places that raise it (`:529-535`, `:648-650`).
- The scrim's alpha is written in two files today: the browser stops its motion and stands it whole at every raise (`src/ui/browse.ts:244-246`), and the overlay sets it to nothing, tweens it and stands it whole (`overlay.ts:499`, `:503`, `:514-516`). The scrim's strength is its fill's, so an alpha of one is the scrim whole (`src/ui/design-space.ts:378-387`).
- A tween killed announces nothing, and a promise waiting on one waits for ever (`docs/PHASER.md`, _Rendering under WebGL_); `ended` and `stopMotion` (`src/ui/card-motion.ts`) are how the rise is awaited and cut short today, and the button comes live through one path whichever way the rise ended (`overlay.ts:486-492`, `:505-507`, `:518`).
- The specs read the screen's container by the outcome's name, its rows as `ending-row-<n>` and `ending-row-<n>-influence`, its total as `ending-total-label` and `ending-total`, and its button as `end-chronicle`; `e2e/ending.spec.ts:102` proves the button answers no press while the screen rises and reads the hand once it has risen. Every name stays.
- The ending reads the catalogue for the achievements reached (`overlay.ts:407`); it receives the catalogue as an argument (`DOGMAS.md`, _Stack_).
- `noImportCycles` is an error, types counted (`biome.json`): the new file imports nothing from `src/ui/overlay.ts`, so what the two share of the ended chronicle lives in the new file or beside it.
- The override's shape, trialled on the tree: an entry of `overrides` with `includes` naming the file and `linter.rules.complexity` holding `"noExcessiveLinesPerFunction": { "level": "error", "options": { "maxLines": 320 } }` and `"useMaxParams": { "level": "error", "options": { "max": 4 } }`; the new file's entry holds 60 and 4. The collection screen's line adds entries of the same shape; whichever ships second adds to the list the first left.
- `docs/PHASER.md` for anything else Phaser: read, never remembered.

**Plan:**

1. `src/ui/browse.ts`: the scrim raised whole or fading in, and stood whole on demand, the scrim no longer handed out. Leaves standing: the ending rising as it did, through the browser's door.
2. A new file under `src/ui/`, named by the implementer, and `src/ui/overlay.ts`: the ending screen moved, the overlay raising it and asking it to stand. Leaves standing: the same ending screen, the overlay about a hundred lines shorter.
3. `src/ui/overlay.ts`, `src/ui/chronicle-scene.ts`: the builder's parameters as one value. Leaves standing: four positional parameters at most.
4. `biome.json`: the two override entries. Leaves standing: `npm run lint` holding the ceilings from here on.
5. `workflow/BRANCH.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/ending.spec.ts`. CI's on the push: `victory.spec.ts`, `fall.spec.ts`, `menu.spec.ts`, `deal.spec.ts`, `browse.spec.ts`, `boot.spec.ts`, `continue.spec.ts`, `resume.spec.ts`.
