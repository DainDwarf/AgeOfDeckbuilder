# A small card going down under a relaid panel

**Line:** A small card going down under a relaid panel — a panel laid again at an offset other than zero stands there from inside the click, and a small card still going down may ask its face, now destroyed, for its place; no panel holds more than its room yet. Done when the collection screen's re-lay takes every small card down before its panels go down, as the launch screen's does, and `npm run check`, `npm test` and `npm run lint` pass.

**Spec:** `docs/INTERFACE.md`, the paragraph on a thing named in a card's text: "a small card stays up while the pointer is on it, on the name that raised it or on a small card raised from it, and goes down with those raised from it once the pointer is on none of them." A name whose face is destroyed is one the pointer is on none of. `docs/META-SCREENS.md` _The collection screen_: "a card shown large leaves them where they stood, as a card added or removed does" (the re-lay keeps each panel's offset, which is what sets the new panel moving inside the click). No sentence is added or changed; no player-facing text.

**Doc-impact:** none — the design already covers it (a small card goes down once the pointer is on none of its names), and a sentence for this corner would sit below the design pages' altitude.

**Scope:**

- In: the collection screen's `lay` (`src/ui/collection-screen.ts`) takes the chain of small cards down at once before the old panels go down, on every re-lay: a copy added, a copy removed, a pile pressed into the deck editing mode, the button back to the collection mode.
- What the player sees: a small card up at the press goes down at once. If the pointer still rests on the same name on the rebuilt face, the new panel's first step reads it and the small card rises again at once, since the handover window (`HANDOVER_MS`, 120 ms) counts from the cut. A small card that was already going down goes a few frames early. Nobody could tell the difference from freezing a going-down card where it stood, which is why that option was dropped.
- Out: the hand, the tree and any other surface that destroys a face while its small card goes down; the tooltip and the kind bubble, which `panel.down()` already sends `point(undefined)`; any change to `createPanel`'s initial stand.
- The implementer decides where the call sits: in `lay`, or wherever it best precedes the panels' `down()`.

**Traps:**

- Why it matters: the chain does not go down at `panel.down()`. That calls `point(undefined)` → `small.over(undefined)`, which only starts the `leaving` timer. The new panel's `scroll.stand(offset)` then calls `moved` → `follow` → `small.follow()` → the old link's `raiser.where()` → `face.spotOf(name)` on a destroyed face. Phaser does not throw: a destroyed child's `parentContainer` is nulled (`node_modules/phaser/src/gameobjects/container/Container.js:465`), so `getWorldTransformMatrix` answers the local, unscrolled transform (`src/gameobjects/components/Transform.js:518-521`), and the small card jumps to where its name stood at offset zero.
- The precedent is `src/ui/launch-screen.ts:320`: `inspecting.small.down()` at the head of its `lay`.
- No panel holds more than its room today, so every re-lay stands at offset zero and nothing is visible. No spec can reach the scrolled case until the Stone Age rung's collection-scroll spec.
- Trap-only comments: the call needs none beyond what the trap above would justify, and one saying "takes the small cards down" is a paraphrase.

**Plan:**

1. `src/ui/collection-screen.ts`: the re-lay takes the small cards down before the old panels go down. After this step, no small card outlives the face that raised it across a re-lay.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No proof spec: at offset zero the only visible difference is a race against a 120 ms timer, and a spec on it would restate the call. CI proves on the push: `e2e/collection.spec.ts`, `e2e/deck-editing.spec.ts`.
