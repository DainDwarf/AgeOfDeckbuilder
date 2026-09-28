# End chronicle on end screen

**Line:** **End chronicle on end screen** — the ending screen carries an **End chronicle** button under its ledger, part of the centred block, which opens the campaign screen once the screen has risen; `e2e/ending.spec.ts` leaves the ending screen through it and passes.

**Spec:** [`docs/CHRONICLE-SCREEN.md`](../../docs/CHRONICLE-SCREEN.md) → _The windows_, the ending screen's paragraph. Two sentences change, written out:

- "The outcome and the ledger are one block, centred on the screen." becomes "The outcome, the ledger and the **End chronicle** button under it are one block, centred on the screen."
- "The scrim swallows every press, the menu alone opens over the screen and closes back onto it, and the campaign screen is the way out." becomes "The button is drawn as a button of the menu is and opens the campaign screen; it rises with the screen and answers no press until the screen has risen. The scrim swallows every other press, the menu opens over the screen and closes back onto it, and the campaign screen is the way out, by the button or by the menu's **Campaign**."

The one player-facing entry, in `src/ui/text.ts`: `End chronicle`. No period, as every button's label.

[`docs/META.md`](../../docs/META.md) → _The loop_ and [`docs/INTERFACE.md`](../../docs/INTERFACE.md) → _The menu_ already say what stays true — the ending screen's way out is the campaign screen, and Campaign is listed over the ending screen — and are not edited.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`.

**Scope:**

- In: the button on the ending screen, victory and defeat alike; its text entry; the docs sentences above; `e2e/ending.spec.ts` leaving through the button.
- The look follows the menu's buttons, no new colour: an accent face 320 × 44, the label in the dark ink, bold, 18 px. It stands 44 under the influence total, centred, and the whole block — outcome, ledger, button — is centred on the screen as the block is today, so a taller ledger lowers the button.
- The button rises with the screen, at the screen's own fade, and answers nothing until the rise has ended: no press, and no hand for the pointer, which reads an arrow as over the scrim. Where a render cuts the rise short and stands the screen up, the button answers from then.
- A press on it does exactly what the menu's Campaign does over the ending screen; the chronicle has been paid and has left the save already, so the press writes nothing.
- Out, decided by the user: no key presses the button — Enter is the launch page's alone and goes with it. The back key raises the menu as it does today. The menu's Campaign stays listed over the ending screen. A right click on the button does nothing.
- Out: any change to the ledger, the rise, the scrim's other presses.

**Traps:**

- A new object accepts a press only from the next drawn frame, and the spec rests before it presses (`docs/PHASER.md`; `DOGMAS.md` → _Testing_, "A spec rests before it presses").
- The ending screen is raised from two places, the play-out's stage and a render, and a render may cut the rise short; "the screen has risen" must hold on both paths.
- The menu leaves the chronicle through the chronicle scene's own way out, which lets go of a play-out in the middle; the button goes through that same one way, never a second copy of it.
- The pointer's hand reads the one thing under it the moment that thing comes live under a pointer holding still (`docs/INTERFACE.md` → _The presses_): a pointer resting where the button rises reads the hand when the rise ends, without moving.
- Player-facing text is a keyed entry, never a literal; comments are for traps only.

**Plan:**

1. `src/ui/text.ts` holds the entry.
2. The ending screen in `src/ui/overlay.ts` draws the button in its block and the block stays centred with it; the button answers once the screen has risen and opens the campaign screen.
3. `e2e/ending.spec.ts` leaves through the button in place of the menu, the rest of its assertions standing.
4. `docs/CHRONICLE-SCREEN.md` takes the two sentences; the board line and this file are deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/ending.spec.ts`. CI's on the push, never run locally: `victory.spec.ts`, `fall.spec.ts`, `menu.spec.ts`, `campaign.spec.ts`, `continue.spec.ts`, `boot.spec.ts`, `pointer-sweep.spec.ts`.
