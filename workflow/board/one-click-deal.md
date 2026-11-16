# A deal is chosen on one click

**Line:** A deal is chosen on one click — `e2e/deal.spec.ts` takes an answer with one left click on a deal window standing whole, a refused answer raising its note and taking nothing, no entry ringed after any press and the inspection key showing nothing; the deal window rises over a third of a second and takes no left click before it stands whole; `docs/CHRONICLE-SCREEN.md` and `docs/INTERFACE.md` say so. Doc-impact: `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`.

**Spec:** the pages and the sentences, written by Claude at the intake and settled with the user in substance (2026-11-16); nothing here is the user's wording.

`docs/CHRONICLE-SCREEN.md`, _The deal window_. The first paragraph gains, after its first sentence: "The window rises out of nothing over a third of a second, whatever speed the motions are set at, since it is the beat a second click waits out and no motion of the chronicle's, and what it deals answers no left click until it stands whole."

Its third paragraph becomes: "A left click on one is the choice, and the window closes on it with the landing playing out after — the next deal's window rising where one still waits, and where none does, the rest of the end of turn after a reward, the next turn's draw among it, and nothing after an answer; a left click on an unaffordable or a refused answer says why over the card, in the note a refused card raises, and the window stands. Nothing in the window is selected, so a press beside the cards does nothing. The right click shows a card large over the window, and a press beside it or the back key takes it down onto the window where it stood. The back key takes down the card shown large, else raises the menu as it does from a clean chronicle screen: the window closes on nothing but the choice, the menu opens over it and closes back onto it, and a new chronicle leaves it behind like anything else."

`docs/CHRONICLE-SCREEN.md`, _The capstone's window_: "The window offers nothing to choose, so no press rings its card and the inspection key does nothing while it stands;" becomes "The window offers nothing to choose, and the inspection key does nothing while it stands;".

`docs/INTERFACE.md`, _The presses_:

- "**A press on a scrim is one step back, and the two clicks are one press there.** It takes down the newest card shown large, then closes the window, as the back key does, and never raises the menu. The deal window is closed by no press: a press on its scrim takes down a card shown large and nothing else."
- "**The inspection key inspects the selection**, and moves the inspection there when a right click had put it elsewhere on the screen. With no selection, or while a card stands large, it does nothing; under a window it does nothing either, the screen's selection waiting there."
- "**A window that offers things to select keeps a selection of its own**, which dies with the window; the screen's selection waits under it." becomes "**A window selects nothing**: what it offers is chosen by one left click, and the screen's selection waits under it."
- "The **back key** walks these back in this order: the thing shown large, the newest of them where several stand, then the window, then the inspection, then the selection."
- "**Select** is the tile or the unit the map rings, or the card lifted out of the hand; **inspect** is the tile in the infopanel, the card shown large and the pile in its browse."

No player-facing entry is added or changed.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`.

**Scope:**

- In: an event's answers and a capture's rewards alike, a reward of several copies drawn as a stack among them. One left click, press and release on the same entry, is the take. The window keeps no selection: no ring, nothing for the back key or a press beside the entries to drop, nothing for the inspection key to show.
- In: the beat. Every rise of the deal window fades in over a third of a second of real time and takes no left click on an entry before it stands whole: the first deal of a turn, the next deal of a chain, the deal a resumed chronicle opens on once the capstone's window closes. The right click, a rest on a name and the back key answer from the first frame.
- Out: what an answer looks like, the texts, where the window stands — the next line, _Event answers as text_. This line ships on today's cards, which is why the sentences above still say "over the card".
- Out: the capstone's window, which closes on a left click as it does and takes no beat.
- Decided: a left click on a name in an entry's rules is the entry's, so it takes. A click on an unaffordable or a refused answer raises the note and takes nothing; the note comes down at the next press as every note does. An answer that declares war raises no warning, as the page says, and takes on its one click.
- Tests no longer promised, agreed with the user: `deal.spec.ts`'s walk of the ring — the first click ringing, the inspection key showing the ringed entry large, the back key and a press beside the cards dropping the ring. They go; the right click showing an entry large and the back key raising the menu stay.
- Reconcile: the take is a press as a menu's button and the capstone's card answer one. The beat is the ending screen's rule, a button dead until the screen has risen (`src/ui/ending-screen.ts`), with one difference that is meant: the ending's rise plays at the animation speed, the deal's beat does not.

**Traps:**

- A scene's tweens run at the animation speed (`src/ui/animation-speed.ts` sets `tweens.timeScale` on every scene), so a fade written as an ordinary tween is a twelfth of a second at ×4, under a double click. The beat is real time.
- The specs open on the fastest speed and wait for the deal window with `restedOnDeal` (`e2e/chronicle-screen.ts`), which waits for the window to stand and one frame. Once the beat lands, a click sent then is swallowed: the wait is for the window standing whole. Sixteen specs go through it or through `take`.
- `take` in `e2e/chronicle-screen.ts` clicks the entry twice. With one click the second lands on whatever stands under the fallen scrim, or on the next deal's window; it clicks once.
- The beat is never asserted by a timed click: a slow runner turns it into a flake (`DOGMAS.md` _Testing_, no frame count). Where a pure function holds "does the window answer yet", it gets its Vitest test; otherwise the report says the beat is unasserted.
- `docs/PHASER.md` for a press on an object raised this frame, and for the release a scene hears wherever the press landed.

**Plan:**

1. `src/ui/overlay.ts`: the deal window takes on one click and keeps no selection; the ring, the back key's ring step and the inspection key's reading of a ringed entry are gone. Leaves the window choosing on one click, instantly risen.
2. The same window, and the scrim's fade where it lives: the rise over a third of a second of real time, the entries dead to a left click until it is whole. Leaves the beat standing.
3. `e2e/chronicle-screen.ts`, then `e2e/deal.spec.ts`: the wait for a whole window, the single click, the ring walk removed, the one click and the refusal asserted. `e2e/reference.spec.ts` reads `ringed` once: it follows.
4. `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`: the sentences above. The board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/deal.spec.ts`. CI's, for the hand-back: `bad-air`, `camps`, `drought`, `flood`, `grievance`, `hover`, `landing`, `neutral`, `predators`, `reference`, `resume`, `site-pointer`, `sites`, `strangers`, `travellers`, `wildfire`, and `capstone`, `long-winter`, `monument`, `siege` for the window the deal rises after.
