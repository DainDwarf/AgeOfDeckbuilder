# The overlay's scrim at its strength

**Line:** The overlay's scrim at its strength — the chronicle's overlay scrim shows at the look's scrim strength, 0.82, as every other scrim does: a pile's browse, the aim, deal and capstone windows and the ending dim the screen as the menu and the collection's and launch screen's browses do, and the ending still rises with its scrim out of nothing. Doc-impact: none.

**Spec:** `docs/CHRONICLE-SCREEN.md`, the ending screen's paragraph ("rises with its scrim out of nothing"), as it stands. The strength is the look's (`LOOK.scrim` in `src/ui/look.ts`), which no design page states. No sentence changes. No player-facing text.

**Doc-impact:** none — no design page states a scrim's strength.

**Scope:**

- In: the chronicle's overlay scrim shows at `LOOK.scrim.strength` and nothing less: everything that stands on it today — a pile's browse, the aim window, the deal window, the capstone's window, the ending — stands on a scrim as dark as the menu's. Settled with the user over real screenshots: every scrim at 0.82, the chronicle's growing darker, rather than the look's value lowered to the 0.67 the chronicle shows today.
- In: the ending's rise still brings the scrim up from nothing to its full strength in the same time and ease, and a render cut short still stands it at full strength.
- In, following from it: a card shown large over a chronicle window stands on two scrims, the large stack's over the overlay's, and is darker behind it than today. Accepted as part of the choice.
- In, following from it: once a raise stands the scrim at full object alpha, that alpha and the `stopMotion` before it move into the browser's `raise` (`standBrowser`, `src/ui/browse.ts`), the meta's browses unchanged by it since their scrim already stands at full object alpha, and `raiseOnScrim`'s `raise` parameter (`src/ui/overlay.ts`) goes: it exists only because `browser.browse` raises the scrim itself.
- Out: the look's value itself, every other scrim, the large stack's scrim, anything else on screen.

**Traps:**

- The cause: the scrim's rectangle carries the strength as its fill alpha (`createScrim`, `src/ui/design-space.ts`), and the overlay sets the object's alpha to the same strength at every cover and at the ending's rise and stand (`src/ui/overlay.ts`, `raiseOnScrim`, `raiseEnding`, `stand`). Phaser multiplies the two (`node_modules/phaser/src/gameobjects/shape/rectangle/RectangleWebGLRenderer.js:49`, `src.fillAlpha * alpha`), so the scrim shows at 0.82 × 0.82.
- The ends of a fade are not colours: an object alpha of `0` or `1` stays a literal at its use site and never enters `LOOK`, which holds only a strength something rests at.
- An object at alpha 0 fails `willRender` and is no hit (`docs/PHASER.md`, _The pointer's readings_); the ending's scrim swallows presses once it has risen, which the rise's start at nothing already rests on.
- No spec reads the scrim's alpha, and none may: a test asserts no Phaser detail (`DOGMAS.md`, _Testing_). The ending's specs read the ending screen's own alpha (`e2e/chronicle-screen.ts:646`, `:654`; `e2e/ending.spec.ts:51`, `:116`), which this line leaves alone.
- `docs/PHASER.md` for anything else Phaser: read, never remembered.

**Plan:**

1. `src/ui/overlay.ts` and `src/ui/browse.ts`: the scrim shown at its fill's strength alone, every raise standing it at full object alpha through the browser's `raise`, the ending's rise and stand going to full object alpha. Leaves standing: one strength on every scrim, read from the look once, and one raise.
2. `workflow/BRANCH.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/ending.spec.ts`, which walks the ending's rise and the render that cuts it short. CI's on the push: `browse.spec.ts`, `deal.spec.ts`, `capstone.spec.ts`, `inspect.spec.ts`, `victory.spec.ts`, `fall.spec.ts`, `menu.spec.ts`.
