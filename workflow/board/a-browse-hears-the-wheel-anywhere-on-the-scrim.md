# A browse hears the wheel anywhere on the scrim

**Line:** A browse on a scrim scrolls under the wheel wherever the pointer stands, as a window's grid already does and as the scrim sentence in `docs/INTERFACE.md` says; today it hears the wheel only over its frame. Done when the pile browse of the chronicle screen and the civilization's browse of the launch and collection screens both scroll under a wheel turned anywhere on their scrim, off the frame included, a card shown large holding them still; `docs/META-SCREENS.md` says so; `e2e/browse.spec.ts` proves it on the pile browse.

**Spec:**

- `docs/INTERFACE.md` → _What stands over what_, the scrim paragraph: already says it ("the wheel over the scrim and the two keys that pan up and down are the scrim's: they scroll what scrolls on it, wherever the pointer stands … a card shown large holds it still under them"). Unchanged; the code comes up to it.
- `docs/META-SCREENS.md` → the launch screen's browse paragraph (the one opening "The browse stands on a scrim over the whole screen"): the sentence

  > A browse holding more than its frame scrolls as a panel of the collection screen does, the two keys that pan up and down scrolling it wherever the pointer stands.

  becomes

  > A browse holding more than its frame scrolls as a panel of the collection screen does, the wheel and the two keys that pan up and down scrolling it wherever the pointer stands, and a card shown large over it holds it still.

- No player-facing text.

**Doc-impact:** `docs/META-SCREENS.md`.

**Scope:**

- In: both browses. The pile browse (chronicle screen, `src/ui/overlay.ts`) and the civilization's browse (launch and collection screens, `standBrowse` in `src/ui/browse.ts`) scroll under a wheel turned anywhere on their scrim: over the frame, the title, the margins, and on the meta screens over the navbar and the bar the scrim covers.
- A card shown large over a browse holds it still under the wheel, as it does under the pan keys.
- The Menu button answers no wheel, so a wheel over it with a browse up scrolls the browse. That is what the scrim sentence says, and no special case is needed.
- A window of the menu standing takes the wheel from everything beneath it, as today.
- Under the debug console the wheel scrolls no browse, as it scrolls no panel today; the rest of the scrim beside the console scrolls it.
- Out: the collection screen's panels keep hearing the wheel only under the pointer (`docs/META-SCREENS.md`, the collection paragraph: "The wheel scrolls the panel under the pointer"). A window's grid is untouched, and so is its lack of a console check.
- No civilization today holds enough cards to overflow its browse, so the civilization's browse can't be seen scrolling in the running game. Its proof is the code path it shares with the pile browse; no fixture is built for it.

**Traps:**

- Over the frame, both the panel's own wheel and a scene-wide wheel hear the notch; the browse must move one notch's worth, not two. No spec today measures a notch's distance on a browse, so a doubled notch would pass unseen; the proof spec's wheel over the frame checks that one notch moves the browse as far as the same notch off the frame.
- The collection screen's panels are built by the same `createPanel` as a browse; whatever lets a browse hear the wheel off its frame must not reach them.
- `docs/PHASER.md`: within a scene, the wheel reaches the topmost interactive object alone, so off the frame the frame zone hears nothing: whatever is topmost there, the scrim, takes it. A hit test inside the wheel's dispatch refills the list Phaser walks, which is why a scroll's move is read in the update step, as `panel.ts` and `overlay.ts` already say.
- The grid's scene-wide wheel in `overlay.ts` already guards on a card shown large; the browse needs the same guard. Today the large card's own scrim covers the frame zone, so no guard was needed, and that stops being true off the frame.

**Plan:**

1. The browse's scroll becomes reachable by a wheel from outside its frame, and the frame's own wheel stops being a second path for a browse, while a collection panel keeps its frame's wheel. Leaves standing: `npm run check` and `npm test` green, nothing wired yet.
2. The chronicle overlay's scene-wide wheel scrolls the pile browse when one stands and no card stands large, as it scrolls a grid. Leaves standing: the pile browse scrolls under a wheel anywhere on its scrim.
3. `standBrowse` does the same for the civilization's browse on the overlay of the meta screens. Leaves standing: both browses done.
4. `docs/META-SCREENS.md` sentence as written in Spec.
5. `e2e/browse.spec.ts`: the test "a pile of more stacks than the frame holds scrolls…" grows a wheel turned over the browse's title, off the frame, that scrolls it as far as the same notch over the frame does; the pan-keys test's card shown large, or a new step beside it, proves a wheel turned while a card stands large moves nothing. Titles are reworded to say it.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/browse.spec.ts`.
- CI proves on the push: the whole suite, with `e2e/browse.spec.ts`, `e2e/launch.spec.ts` and `e2e/collection.spec.ts` (the civilization's browse and the collection panels) the ones to read first if it fails.
- No visual-check: nothing is drawn differently.
